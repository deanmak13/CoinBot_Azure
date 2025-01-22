const grpc_server = require('./grpc/grpc_server');
const utils = require('./utils');
const {RealTimeMarketData} = require("./datasource/coinbase_client");
const args = require('minimist')(process.argv.slice(2)); 
const {ProductCandleRequest} = require("./grpc/gen/coinbase/v1/coinbase_products_pb")

let logger = utils.getLogger();

const enableGrpc = args.enableGrpc === 'true'; 
const realTimeMarketDataSocker = new RealTimeMarketData();

if (enableGrpc) {
    console.log('Using gRPC services'); 
    grpc_server.initialiseGrpServices();
}

logger.info("Retrieving configs to begin real time data polling.");
let candleConfig = utils.loadYamlConfig("candles", "events.yaml");
let productCandleRequest = new ProductCandleRequest();
productCandleRequest.setProductIdList(candleConfig["product_ids"]);
logger.info("Attempting to connect to product candle websocket");
realTimeMarketDataSocker.getProductCandles(productCandleRequest);
