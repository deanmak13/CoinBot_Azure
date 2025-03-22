const utils = require('./utils');
const {RealTimeMarketData} = require("./api/coinbase_client");
const args = require('minimist')(process.argv.slice(2));
const path = require('path');
const {ProductCandleRequest} = require("./grpc/gen/coinbase/v1/coinbase_products_pb")
const {startEventGridListener} = require("./event/event_grid_subscriber");
const express = require("express");
require('./websocket/websocket_publisher'); // starts the WebSocket server

const frontEndApp = express();
const eventGridApp = express();

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

function serveFrontEndBuild(){
    frontEndApp.use(express.static(path.join(__dirname, '..', '..', 'build')));
    frontEndApp.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', '..', 'build', 'index.html'));
    });
    const frontEndPort = process.env.WEBSITES_PORT || 8000;
    frontEndApp.listen(frontEndPort, () => {
        logger.info(`FrontEnd listening on port ${frontEndPort}`);
    }).on('error', (err) => {
        logger.error(`Failed to start listening for FrontEnd: ${err.message}`);
        process.exit(1);
});
}

(async () => {
    serveFrontEndBuild();
    await startEventGridListener(eventGridApp);
    realTimeProductCandlePipeline();
})();