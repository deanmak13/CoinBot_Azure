const nano = require('nanomsg')
const { spawn } = require("node:child_process");
const path = require("node:path");
const coinbase = require("./coinbase_wrapper");
const utils = require('./utils');

const grpc = require('@grpc/grpc-js');
const { HistoricalDataServiceService } = require('./protos/historical_grpc_pb');
const { ProductCandleRequest, ProductCandleResponse } = require('./protos/historical_pb');

let logger = utils.getLogger();

function activateAnalyticsClient(){
    // Spawning Analytics child process 
    const python = path.join(__dirname.toString(), '..', 'venv', 'Scripts', 'python.exe');
    const technicalAnalyticsScript = path.join(__dirname.toString(), '..', 'insights', 'transceiver.py');
    const analyticsTransceiverProcess = spawn(python, [technicalAnalyticsScript]);

    // Initialise connection to Analytics process, and configure response handling and child process logging
    // const analyticsSocket = openAnalyticsSocket();
    // analyticsSocket.on("data", processMessages);
    analyticsTransceiverProcess.stdout.on('data', (data) => {console.log("%s", data)} );
    logger.info("Activated Analytics Client");
    // return analyticsSocket;
}

function getProductCandles(call, callback){
    logger.info("Getting Product Candles");
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
    server.addService(HistoricalDataServiceService, {
        getProductCandles: getProductCandles
    });

    let socketPath = "127.0.0.1:13130"
    server.bindAsync(socketPath, grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err) {
            console.error(`Failed to bind to Unix domain socket ${socketPath}: ${err}`);
            process.exit(1);
        }
        console.log(`gRPC server running on Unix domain socket ${socketPath}`);
    });
}

module.exports = {initialiseAnalytics}
