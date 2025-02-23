const { spawn } = require("node:child_process");
const path = require("node:path");
const {HistoricalMarketData} = require("../datasource/coinbase_client");
const utils = require('../utils');

const grpc = require('@grpc/grpc-js');
const { ProductsDataServiceService } = require('./gen/coinbase/v1/coinbase_products_grpc_pb');
const { ProductCandleRequest, ProductCandleResponse } = require('./gen/coinbase/v1/coinbase_products_pb');

let logger = utils.getLogger();

function getProductCandles(call, callback){
    logger.info("Getting Product Candles from API wrapper");
    const request = call.request;

    let response = HistoricalMarketData.getProductCandles(request)
    callback(null, response);
}

function bindGrpcServerToUnixDomainSocket(){
    server.bindAsync(utils.GRPC_COMMUNICATION_CHANNEL, grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err) {
            console.error(`Failed to bind to Unix domain socket ${utils.GRPC_COMMUNICATION_CHANNEL}: ${err}`);
            process.exit(1);
        }
        console.log(`gRPC server running on Unix domain socket ${utils.GRPC_COMMUNICATION_CHANNEL}`);
    });
}

function addGrpcServices(){
    const server = new grpc.Server();
    server.addService(ProductsDataServiceService, {
        getProductCandles: getProductCandles
    });
    bindGrpcServerToUnixDomainSocket();
}

module.exports = {initialiseAnalytics: addGrpcServices}
