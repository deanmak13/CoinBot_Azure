import sys
sys.stderr = sys.stdout

import traceback
import grpc
from protos.products_pb2 import ProductCandleRequest
from protos.products_pb2_grpc import ProductsDataServiceStub
from trio import run
from utils import get_logger
from technical_analysis import perform_historical_technical_analysis

_logger = get_logger(logger_name="Insights")

communicationChannel = "127.0.0.1:13130"

async def get_historical_product_data():
    with grpc.insecure_channel(communicationChannel) as channel:
        client = ProductsDataServiceStub(channel)
        request = ProductCandleRequest()
        request.product_id = "BTC-USD"
        request.granularity = 300
        request.requests  = 1
        request.data_points_limit = 10        
        _logger.info("RPC made to get product candles.")
        response = client.GetProductCandles(request)
        _logger.info(response)
        return response

try:
    product_candle_data = run(get_historical_product_data)
    product_candle_data_list = [(candle.time, candle.low, candle.high, candle.open, candle.close, candle.volume) for candle in product_candle_data.product_candles]
    perform_historical_technical_analysis(product_candle_data_list)
except Exception:
    raise _logger.error(f"Transceiver Communication Error:\n\n\n {traceback.format_exc()}")

sys.stdout.flush()
