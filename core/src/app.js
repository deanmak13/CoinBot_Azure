const grpc_server = require('./grpc/grpc_server');
const utils = require('./utils');
const {RealTimeMarketData} = require("./datasource/coinbase_client");
const args = require('minimist')(process.argv.slice(2)); 
const {ProductCandleRequest} = require("./grpc/gen/coinbase/v1/coinbase_products_pb")
const {startEventGridListener} = require("./event/event_grid_subscriber");

let logger = utils.getLogger();

const enableGrpc = args.enableGrpc === 'true'; 
const realTimeMarketDataSocket = new RealTimeMarketData();

if (enableGrpc) {
    logger.info('Using gRPC services');
    grpc_server.initialiseGrpServices();
}

function realTimeProductCandlePipeline(){
    // Creating product candle request for real time data
    logger.info("Retrieving configs to begin real time data polling.");
    let candleConfig = utils.getConfig("candle_data", "events.yaml");
    let productCandleRequest = new ProductCandleRequest();
    productCandleRequest.setProductIdList(candleConfig["product_ids"]);
    // Requesting and sending real time product candle data to Insights
    logger.info("Attempting to connect to product candle websocket");
    realTimeMarketDataSocket.forwardProductCandles(productCandleRequest);
}

(async () => {
    // Start the event listener first and wait for it to be ready
    await startEventGridListener();

    // Then start the real-time polling
    realTimeProductCandlePipeline();
})();