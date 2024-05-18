// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var protos_products_pb = require('../protos/products_pb.js');

function serialize_ProductCandleRequest(arg) {
  if (!(arg instanceof protos_products_pb.ProductCandleRequest)) {
    throw new Error('Expected argument of type ProductCandleRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_ProductCandleRequest(buffer_arg) {
  return protos_products_pb.ProductCandleRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_ProductCandleResponse(arg) {
  if (!(arg instanceof protos_products_pb.ProductCandleResponse)) {
    throw new Error('Expected argument of type ProductCandleResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_ProductCandleResponse(buffer_arg) {
  return protos_products_pb.ProductCandleResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var ProductsDataServiceService = exports.ProductsDataServiceService = {
  getProductCandles: {
    path: '/ProductsDataService/GetProductCandles',
    requestStream: false,
    responseStream: false,
    requestType: protos_products_pb.ProductCandleRequest,
    responseType: protos_products_pb.ProductCandleResponse,
    requestSerialize: serialize_ProductCandleRequest,
    requestDeserialize: deserialize_ProductCandleRequest,
    responseSerialize: serialize_ProductCandleResponse,
    responseDeserialize: deserialize_ProductCandleResponse,
  },
};

exports.ProductsDataServiceClient = grpc.makeGenericClientConstructor(ProductsDataServiceService);
