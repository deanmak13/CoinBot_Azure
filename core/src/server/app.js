const utils = require('./utils');
const args = require('minimist')(process.argv.slice(2));
const path = require('path');
const express = require('express');
const {Router} = require("express");
const {RealTimeMarketData} = require("./api/coinbase_client");
const {ProductCandleRequest} = require("./grpc/gen/coinbase/v1/coinbase_products_pb")
const {handleEvents} = require("./event/event_grid_subscriber");
const {DataPreprocessorInstance} = require("./event/data_preprocessor");
const {setupWebSocketServer, broadcastToClients} = require("./websocket/websocket_publisher");
const {readDBAnalytics} = require("./db/candle_analytics_cache");

const app = express();
const port = process.env.WEBSITES_PORT || 8000;

let logger = utils.getLogger();

const realTimeMarketDataSocket = new RealTimeMarketData();

function realTimeProductCandlePipeline(){
    // Creating product candle request for real time data
    logger.info("Requesting real time Product Candle Data...");
    let candleConfig = utils.getConfig("candle_data", "events.yaml");
    let productCandleRequest = new ProductCandleRequest();
    productCandleRequest.setProductIdList(candleConfig["product_ids"]);
    // Requesting and sending real time product candle data to EventGrid
    realTimeMarketDataSocket.streamProductCandleData(productCandleRequest, (candle)=>{
        DataPreprocessorInstance.getInstance().eventiseProductCandle(candle);}
    );
}

function setupEventGridRoutes() {
    // Apply JSON body parsing only to Event Grid routes
    const candleAnalyticsSubEndPoint = utils.getConfig("candle_analytics", "events.yaml")['event_grid.subscription_endpoint'];

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

    app.get('/api/latestAnalytics', (req, res) => {
        const storedData = readDBAnalytics();
        res.json(storedData);
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
    realTimeProductCandlePipeline();

    // Create the HTTP server with WebSocket support
    const server = setupWebSocketServer(app);

    // Start the server on a single port
    server.listen(port, () => {
        logger.info(`Server listening on port ${port}`);
        logger.info(`- Front-end serving from build directory`);
        logger.info(`- WebSocket server attached`);
        const candleAnalyticsSubEndPoint = utils.getConfig("candle_analytics", "events.yaml")['event_grid.subscription_endpoint'];
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
