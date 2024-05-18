const nano = require('nanomsg')
const { spawn } = require("node:child_process");
const path = require("node:path");
const coinbase = require("./coinbase_wrapper");
const utils = require('./utils');

const grpc = require('@grpc/grpc-js');
const { ProductsDataServiceService } = require('./protos/products_grpc_pb');
const { ProductCandleRequest, ProductCandleResponse } = require('./protos/products_pb');

let logger = utils.getLogger();

const communicationChannel = "127.0.0.1:13130"

function activateAnalyticsClient(){
    // Spawning Analytics child process 
    const python = path.join(__dirname.toString(), '..', 'venv', 'Scripts', 'python.exe');
    const technicalAnalyticsScript = path.join(__dirname.toString(), '..', 'insights', 'insights_grpc_client_impl.py');
    const analyticsTransceiverProcess = spawn(python, [technicalAnalyticsScript]);

    // Initialise Insights, configure response handling and child process logging
    analyticsTransceiverProcess.stdout.on('data', (data) => {console.log("%s", data)} );
    logger.info("Activated Analytics Client");
}

function getProductCandles(call, callback){
    logger.info("Getting Product Candles from API wrapper");
    const request = call.request;

    coinbase.getProductCandles(request).then(
        productCandlesArray => {
            let response = new ProductCandleResponse();
            response.setProductCandlesList(productCandlesArray);
            callback(null, response);
        }
    );
}

function initialiseAnalytics(){
    logger.info("Initialising Analytics");
    activateAnalyticsClient();
    const server = new grpc.Server();
    server.addService(ProductsDataServiceService, {
        getProductCandles: getProductCandles
    });

    server.bindAsync(communicationChannel, grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err) {
            console.error(`Failed to bind to Unix domain socket ${communicationChannel}: ${err}`);
            process.exit(1);
        }
        console.log(`gRPC server running on Unix domain socket ${communicationChannel}`);
    });
}

module.exports = {initialiseAnalytics}
