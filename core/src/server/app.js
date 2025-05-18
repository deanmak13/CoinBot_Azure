const utils = require('./utils');
const args = require('minimist')(process.argv.slice(2));
const path = require('path');
const express = require('express');
const {Router} = require("express");
const {RealTimeMarketData, HistoricalMarketData, testApiConnection} = require("./api/coinbase/coinbase_client");
const {ProductCandleRequest} = require("./grpc/gen/coinbase/v1/coinbase_products_pb")
const {handleEvents} = require("./event/event_grid_subscriber");
const {DataPreprocessorInstance} = require("./event/data_preprocessor");
const {setupWebSocketServer} = require("./websocket/websocket_publisher");
const {readDBAnalytics, readDBAnalyticsMetrics} = require("./db/candle_analytics_cache");

const app = express();
const port = process.env.WEBSITES_PORT || 8000;
const candleAnalyticsConfig = utils.getConfig("candle_analytics", "events.yaml");
const candleConfig = utils.getConfig("candle_data", "events.yaml");
const historicalCandleConfig = utils.getConfig("historical_candle_data", "events.yaml");
const historicalDeliveryCooldownCache = {};
const COOLDOWN_SECONDS = historicalCandleConfig["delivery_cooldown_seconds"];

let logger = utils.getLogger();

const realTimeMarketDataSocket = new RealTimeMarketData();
const historicalMarketDataSocket = new HistoricalMarketData();

function streamRealTimeProductCandleData() {
    // Creating product candle request for real time data
    logger.info("Requesting real time Product Candle Data...");
    let productCandleRequest = new ProductCandleRequest();
    productCandleRequest.setProductIdList(candleConfig["product_ids"]);
    const granularityMins = candleConfig["granularity_minutes"];
    
    // Requesting and sending real time product candle data to EventGrid
    realTimeMarketDataSocket.streamProductCandleData(productCandleRequest, (candle) => {
            candle.granularity_mins = granularityMins;
            DataPreprocessorInstance.getInstance().eventiseProductCandle(candle);
        }
    );
}

async function batchDeliverHistoricalProductCandleData(startTime, endTime, granularityMinutes) {
    // Test connection first
    logger.info("Testing Coinbase API connection...");
    const connected = await historicalMarketDataSocket.testApiConnection();
    if (!connected) {
        logger.error("Failed to connect to Coinbase API. Check your credentials.");
        process.exit(1); // Exit if connection fails
    }
    logger.info("Successfully connected to Coinbase API.");

    // Proceed to request Product Candle Data
    logger.info("Requesting Historical Product Candle Data...");
    let productCandleRequest = new ProductCandleRequest();
    productCandleRequest.setProductIdList(historicalCandleConfig["product_ids"]);
    productCandleRequest.setGranularity(granularityMinutes)

    await historicalMarketDataSocket.fetchProductCandleData(productCandleRequest, endTime, startTime, (candleBatch, batchProductId) => {
        for (const candle of candleBatch) {
            candle.product_id = batchProductId;
            candle.granularity_mins = granularityMinutes;
        }
        DataPreprocessorInstance.getInstance().eventiseHistoricalProductCandle(candleBatch);
    })
}

function isInHistoricalDeliveryCooldown(ticker, range) {
    const key = `${ticker}-${range}`;
    const now = Date.now();
    const lastCall = historicalDeliveryCooldownCache[key] || 0;

    if ((now - lastCall) / 1000 < COOLDOWN_SECONDS) {
        logger.info(`API call cooldown phase for Ticker ${ticker} in Time Range ${range}`)
        return true;
    }

    historicalDeliveryCooldownCache[key] = now;
    return false;
}

function setupEventGridRoutes() {
    const candleAnalyticsSubEndPoint = candleAnalyticsConfig['event_grid.subscription_endpoint'];
    const eventGridRouter = Router();
    const MAX_SIZE_BYTES = candleAnalyticsConfig['core_handler.payload_mb_limit'] * 1024 * 1024; // MB to KB

    eventGridRouter.use((req, res, next) => {
        const size = Number(req.headers['content-length'] || 0);
        if (size > MAX_SIZE_BYTES) {
            logger.warn(`Blocked Event Grid payload: ${Math.round(size / 1024)} KB exceeds 5MB limit`);
            return res.status(413).send({error: 'Payload too large'});
        }
        next();
    });

    eventGridRouter.use(express.json({limit: '5MB'}));

    logger.info(`Registering Event Grid route: POST ${candleAnalyticsSubEndPoint}`);
    eventGridRouter.post(candleAnalyticsSubEndPoint, handleEvents);

    app.use('/', eventGridRouter);
    logger.info(`EventGridSubscriber configured for endpoint: ${candleAnalyticsSubEndPoint}`);
}

function setupFrontEndRoutes() {
    // Serve static files from the build directory
    app.use(express.static(path.join(__dirname, '..', '..', 'build')));

    app.get('/api/config', (req, res) => {
        try {
            const {configName, configFileName} = req.query;

            if (!configName || !configFileName) {
                const error = new Error("Missing 'config' or 'configFileName' query param - /api/config");
                error.statusCode = 400;
                logger.error(error);
                throw error;
            }

            const config = utils.getConfig(configName, configFileName);
            logger.info(`Responding to /api/config request [config:${configName}.${configFileName}]`);
            res.json(config);

        } catch (err) {
            logger.error("Config Util Error:", err);
            res.status(err.statusCode || 500).json({error: err.message || "Internal server error"});
        }
    });

    app.get('/api/latestAnalytics', async (req, res) => {
        const {ticker, range: timeRangeValue} = req.query;
        // console.log("RECEIVED LATEST ANALYTICS RE");
        // Request Validation Checks
        if (!ticker || !timeRangeValue) {
            return res.status(400).json({error: "Missing 'ticker' or 'range' query param"});
        }

        if (!candleConfig["product_ids"].includes(ticker) && !historicalCandleConfig["product_ids"].includes(ticker)) {
            return res.status(404).json({error: `Ticker '${ticker}' not supported`});
        }

        let timeRangeSeconds = utils.convertDynamicTimeRangeToSeconds(timeRangeValue);
        if (!timeRangeSeconds) {
            return res.status(400).json({error: "Invalid time range format"});
        }

        // get granularity based on selected time range (candle limiting)
        let granularityMinutes;
        const time_ranges = historicalCandleConfig["time_ranges"];
        for (let range_config of time_ranges) {
            const range_value = range_config["value"];
            if (timeRangeSeconds === utils.convertDynamicTimeRangeToSeconds(range_value)) {
                granularityMinutes = range_config["granularity_minutes"];
                logger.info(`Using granularity ${granularityMinutes} minutes for ticker ${ticker} - /api/latestAnalytics`);
            }
        }

        // Historical start time and end time
        const endTime = utils.unixNow();
        let startTime = utils.getTimeFromXSecondsAgo(timeRangeSeconds, endTime);

        try {
            const metrics = readDBAnalyticsMetrics(ticker, startTime, granularityMinutes);
            const storedDataCount = (metrics && typeof metrics.count === 'number') ? metrics.count : 0; // Handle case where metrics is null/undefined or count is invalid

            const expectedCandleCount = Math.floor(timeRangeSeconds / (granularityMinutes * 60));
            const expectedApiCalls = Math.ceil(expectedCandleCount / 350); // TODO - store this 350 max candles as a config constant
            const timePartition = timeRangeSeconds / expectedApiCalls;

            const missingData = !metrics || storedDataCount < expectedCandleCount;

            // If data is missing or count is lower than expected, fetch from API. Don't if in cooldown period
            if (missingData && !isInHistoricalDeliveryCooldown(ticker, timeRangeValue)) {
                let batchEndTime = endTime;
                const promises = [];

                for (let i = 0; i < expectedApiCalls; i++) {
                    const batchStartTime = batchEndTime - timePartition;
                    promises.push(
                        batchDeliverHistoricalProductCandleData(batchStartTime, batchEndTime, granularityMinutes)
                    );
                    batchEndTime = batchStartTime;
                }

                await Promise.all(promises);
            }

            const storedData = readDBAnalytics(ticker, startTime, granularityMinutes);
            logger.info(`Responding to /api/latestAnalytics request [ticker:${ticker}, timeRange: ${timeRangeValue}]`);
            res.json(storedData);
        } catch (err) {
            console.error("DB read error:", err);
            res.status(500).json({error: "Internal server error"});
        }
    });

    // Serve index.html for all other routes (should be last)
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', '..', 'build', 'index.html'));
    });
}

async function startServer() {
    // Set up routes
    await setupEventGridRoutes();
    setupFrontEndRoutes();

    // Begin pulling real time product candle data
    await streamRealTimeProductCandleData();

    // Create the HTTP server with WebSocket support
    const server = setupWebSocketServer(app);

    // Start the server on a single port
    server.listen(port, () => {
        logger.info(`Server listening on port ${port}`);
        logger.info(`- Front-end serving from build directory`);
        logger.info(`- WebSocket server attached`);
        const candleAnalyticsSubEndPoint = candleAnalyticsConfig['event_grid.subscription_endpoint'];
        logger.info(`- Event Grid webhook at ${candleAnalyticsSubEndPoint}`);
    }).on('error', (err) => {
        logger.error(`Failed to start server: ${err.message}`);
        process.exit(1);
    });
}

startServer().catch(err => {
    logger.error(`Error during server startup: ${err.message}`);
    process.exit(1);
});
