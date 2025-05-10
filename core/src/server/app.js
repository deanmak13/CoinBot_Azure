const utils = require('./utils');
const args = require('minimist')(process.argv.slice(2));
const path = require('path');
const express = require('express');
const {Router} = require("express");
const {RealTimeMarketData, HistoricalMarketData, testApiConnection} = require("./api/coinbase/coinbase_client");
const {ProductCandleRequest} = require("./grpc/gen/coinbase/v1/coinbase_products_pb")
const {handleEvents} = require("./event/event_grid_subscriber");
const {DataPreprocessorInstance} = require("./event/data_preprocessor");
const {setupWebSocketServer, broadcastToClients} = require("./websocket/websocket_publisher");
const {readDBAnalytics} = require("./db/candle_analytics_cache");

const app = express();
const port = process.env.WEBSITES_PORT || 8000;
const candleAnalyticsConfig = utils.getConfig("candle_analytics", "events.yaml");
const candleConfig = utils.getConfig("candle_data", "events.yaml");
const historicalCandleConfig = utils.getConfig("historical_candle_data", "events.yaml");

let logger = utils.getLogger();

const realTimeMarketDataSocket = new RealTimeMarketData();
const historicalMarketDataSocket = new HistoricalMarketData();

function realTimeProductCandlePipeline(){
    // Creating product candle request for real time data
    logger.info("Requesting real time Product Candle Data...");
    let productCandleRequest = new ProductCandleRequest();
    productCandleRequest.setProductIdList(candleConfig["product_ids"]);
    
    // Requesting and sending real time product candle data to EventGrid
    realTimeMarketDataSocket.streamProductCandleData(productCandleRequest, (candle)=>{
        DataPreprocessorInstance.getInstance().eventiseProductCandle(candle);}
    );
}

async function historicalProductCandlePipeline() {
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
    let granularityMinutes = historicalCandleConfig["granularity_minutes"]
    let productCandleRequest = new ProductCandleRequest();
    productCandleRequest.setProductIdList(historicalCandleConfig["product_ids"]);
    productCandleRequest.setGranularity(granularityMinutes)
    let endTime = utils.unixNow();
    let secondsAgo = utils.convertDynamicTimeRangeToSeconds(historicalCandleConfig?.time_ranges?.[0]?.value || null);
    let startTime = endTime - secondsAgo;

    await historicalMarketDataSocket.fetchProductCandleData(productCandleRequest, endTime, startTime, (candleBatch, batchProductId) => {
        for (const candle of candleBatch) {
            candle.product_id = batchProductId;
        }
        DataPreprocessorInstance.getInstance().eventiseHistoricalProductCandle(candleBatch);
    })
}

function setupEventGridRoutes() {
    // Apply JSON body parsing only to Event Grid routes
    const candleAnalyticsSubEndPoint = candleAnalyticsConfig['event_grid.subscription_endpoint'];

    // Create a router for event grid endpoints
    const eventGridRouter = Router();
    eventGridRouter.use(express.json());
    eventGridRouter.post(candleAnalyticsSubEndPoint, handleEvents);

    app.use('/', eventGridRouter);

    logger.info(`EventGridSubscriber configured for endpoint: ${candleAnalyticsSubEndPoint}`);
}

function setupFrontEndRoutes() {
    // Serve static files from the build directory
    app.use(express.static(path.join(__dirname, '..', '..', 'build')));

    app.get('/api/config', (req, res) => {
        const { configName, configFileName } = req.query;
        if (!configName || !configFileName) {
            return res.status(400).json({ error: "Missing 'config' or 'configFileName' query param" });
        }
        try {
            const config = utils.getConfig(configName, configFileName);
            res.json(config);
        } catch (err){
            console.error("Config Util Error:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    })

    app.get('/api/latestAnalytics', (req, res) => {
        const { ticker, range: timeRange } = req.query;
        if (!ticker || !timeRange) {
            return res.status(400).json({ error: "Missing 'ticker' or 'range' query param" });
        }

        if (!candleConfig["product_ids"].includes(ticker) && !historicalCandleConfig["product_ids"].includes(ticker)){
            return res.status(404).json({ error: `Ticker '${ticker}' not supported` });
        }

        let timeRangeSeconds = utils.convertDynamicTimeRangeToSeconds(timeRange);
        if (!timeRangeSeconds) {
            return res.status(400).json({ error: "Invalid time range format" });
        }

        try {
            const storedData = readDBAnalytics(ticker, timeRangeSeconds);
            res.json(storedData);
        } catch (err){
            console.error("DB read error:", err);
            res.status(500).json({ error: "Internal server error" });
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

    // Ensure historical data is loaded first
    await historicalProductCandlePipeline();

    // Begin pulling real time product candle data
    await realTimeProductCandlePipeline();

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
