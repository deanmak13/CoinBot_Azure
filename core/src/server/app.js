const grpc_server = require('./grpc/grpc_server');
const utils = require('./utils');
const {RealTimeMarketData} = require("./datasource/coinbase_client");
const args = require('minimist')(process.argv.slice(2)); 
const {ProductCandleRequest} = require("./grpc/gen/coinbase/v1/coinbase_products_pb")
const {handleEvents} = require("./event/event_grid_subscriber");
const express = require("express");
const bodyParser = require("express");
require('./websocket/websocket_publisher'); // starts the WebSocket server

const app = express();

let logger = utils.getLogger();

const realTimeMarketDataSocket = new RealTimeMarketData();

function realTimeProductCandlePipeline(){
    // Creating product candle request for real time data
    logger.info("Retrieving configs to begin real time data polling.");
    let candleConfig = utils.getConfig("candle_data", "events.yaml");
    let productCandleRequest = new ProductCandleRequest();
    productCandleRequest.setProductIdList(candleConfig["product_ids"]);
    // Requesting and sending real time product candle data to Insights
    logger.info("Attempting to connect to product candle websocket");
    realTimeMarketDataSocket.feedProductCandlesInsights(productCandleRequest);
}

async function startEventGridListener(){
    app.use(bodyParser.json());
    let candleAnalyticsSubEndPoint = utils.getConfig("candle_analytics", "events.yaml")['event_grid.subscription_endpoint'];
    let eventGridport = utils.getConfig("candle_analytics", "events.yaml")["event_grid.port"];
    app.post(candleAnalyticsSubEndPoint, (handleEvents));
    app.listen(eventGridport, () => {logger.info(`EventGridSubscriber subscribed to endpoint: ${candleAnalyticsSubEndPoint}`);});
}

(async () => {
    await startEventGridListener();
    realTimeProductCandlePipeline();
})();