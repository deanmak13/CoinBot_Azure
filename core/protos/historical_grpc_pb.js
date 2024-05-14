// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var protos_historical_pb = require('../protos/historical_pb.js');

function serialize_ProductCandleRequest(arg) {
  if (!(arg instanceof protos_historical_pb.ProductCandleRequest)) {
    throw new Error('Expected argument of type ProductCandleRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_ProductCandleRequest(buffer_arg) {
  return protos_historical_pb.ProductCandleRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_ProductCandleResponse(arg) {
  if (!(arg instanceof protos_historical_pb.ProductCandleResponse)) {
    throw new Error('Expected argument of type ProductCandleResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_ProductCandleResponse(buffer_arg) {
  return protos_historical_pb.ProductCandleResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var HistoricalDataServiceService = exports.HistoricalDataServiceService = {
  getProductCandles: {
    path: '/HistoricalDataService/GetProductCandles',
    requestStream: false,
    responseStream: false,
    requestType: protos_historical_pb.ProductCandleRequest,
    responseType: protos_historical_pb.ProductCandleResponse,
    requestSerialize: serialize_ProductCandleRequest,
    requestDeserialize: deserialize_ProductCandleRequest,
    responseSerialize: serialize_ProductCandleResponse,
    responseDeserialize: deserialize_ProductCandleResponse,
  },
};

exports.HistoricalDataServiceClient = grpc.makeGenericClientConstructor(HistoricalDataServiceService);
