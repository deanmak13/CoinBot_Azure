// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var coinbase_v1_coinbase_products_pb = require('./coinbase_products_pb.js');

function serialize_coinbase_v1_ProductCandleRequest(arg) {
  if (!(arg instanceof coinbase_v1_coinbase_products_pb.ProductCandleRequest)) {
    throw new Error('Expected argument of type coinbase.v1.ProductCandleRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_coinbase_v1_ProductCandleRequest(buffer_arg) {
  return coinbase_v1_coinbase_products_pb.ProductCandleRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_coinbase_v1_ProductCandleResponse(arg) {
  if (!(arg instanceof coinbase_v1_coinbase_products_pb.ProductCandleResponse)) {
    throw new Error('Expected argument of type coinbase.v1.ProductCandleResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_coinbase_v1_ProductCandleResponse(buffer_arg) {
  return coinbase_v1_coinbase_products_pb.ProductCandleResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var ProductsDataServiceService = exports.ProductsDataServiceService = {
  getProductCandles: {
    path: '/coinbase.v1.ProductsDataService/GetProductCandles',
    requestStream: false,
    responseStream: false,
    requestType: coinbase_v1_coinbase_products_pb.ProductCandleRequest,
    responseType: coinbase_v1_coinbase_products_pb.ProductCandleResponse,
    requestSerialize: serialize_coinbase_v1_ProductCandleRequest,
    requestDeserialize: deserialize_coinbase_v1_ProductCandleRequest,
    responseSerialize: serialize_coinbase_v1_ProductCandleResponse,
    responseDeserialize: deserialize_coinbase_v1_ProductCandleResponse,
  },
};

exports.ProductsDataServiceClient = grpc.makeGenericClientConstructor(ProductsDataServiceService);
