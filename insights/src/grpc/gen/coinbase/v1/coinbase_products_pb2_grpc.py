# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc

from coinbase.v1 import coinbase_products_pb2 as coinbase_dot_v1_dot_coinbase__products__pb2


class ProductsDataServiceStub(object):
    """Missing associated documentation comment in .proto file."""

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.GetProductCandles = channel.unary_unary(
                '/coinbase.v1.ProductsDataService/GetProductCandles',
                request_serializer=coinbase_dot_v1_dot_coinbase__products__pb2.ProductCandleRequest.SerializeToString,
                response_deserializer=coinbase_dot_v1_dot_coinbase__products__pb2.ProductCandleResponse.FromString,
                _registered_method=True)


class ProductsDataServiceServicer(object):
    """Missing associated documentation comment in .proto file."""

    def GetProductCandles(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_ProductsDataServiceServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'GetProductCandles': grpc.unary_unary_rpc_method_handler(
                    servicer.GetProductCandles,
                    request_deserializer=coinbase_dot_v1_dot_coinbase__products__pb2.ProductCandleRequest.FromString,
                    response_serializer=coinbase_dot_v1_dot_coinbase__products__pb2.ProductCandleResponse.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'coinbase.v1.ProductsDataService', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))
    server.add_registered_method_handlers('coinbase.v1.ProductsDataService', rpc_method_handlers)


 # This class is part of an EXPERIMENTAL API.
class ProductsDataService(object):
    """Missing associated documentation comment in .proto file."""

    @staticmethod
    def GetProductCandles(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(
            request,
            target,
            '/coinbase.v1.ProductsDataService/GetProductCandles',
            coinbase_dot_v1_dot_coinbase__products__pb2.ProductCandleRequest.SerializeToString,
            coinbase_dot_v1_dot_coinbase__products__pb2.ProductCandleResponse.FromString,
            options,
            channel_credentials,
            insecure,
            call_credentials,
            compression,
            wait_for_ready,
            timeout,
            metadata,
            _registered_method=True)
