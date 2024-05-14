import sys
sys.stderr = sys.stdout

import traceback
import json
import grpc
from protos.historical_pb2 import ProductCandleRequest
from protos.historical_pb2_grpc import HistoricalDataServiceStub
from trio import run
from pynng import Pair0
from utils import get_logger
from time import sleep
from technical_analysis import perform_technical_analysis

_logger = get_logger(logger_name="Insights")

communicationFileAddress = "ipc:///config/communication.icp"

def router(load: dict):
    message = json.loads(load['message'])
    # perform_technical_analysis(message)
    get_historical_product_data()
    

async def transmitter(load: dict):
     with Pair0(listen=communicationFileAddress) as transmitter:
       load = json.dumps(load).encode()
       sleep(3)
       await transmitter.asend(load)
       _logger.info("Transmitted data")

async def receiver():
    with Pair0(listen=communicationFileAddress) as receiver:
        load_bytes = await receiver.arecv()
        load_dict: dict = json.loads(load_bytes)
        load_id = load_dict['id']
        _logger.info(f"TRANSCEIVER RECEIVED LOAD (size:{len(load_dict)}) WITH ID: {load_id}")
        receipt = json.dumps({"message": f"RECEIVED LOAD WITH ID {load_id}"}).encode()
        # sleep(3)
        # await receiver.asend(receipt)
        # _logger.info("Sent Response")
        return load_dict

async def get_historical_product_data():
    with grpc.insecure_channel("127.0.0.1:13130") as channel:
        client = HistoricalDataServiceStub(channel)
        request = ProductCandleRequest()
        request.product_id = "BTC-USD"
        request.granularity = 300
        request.requests  = 1
        request.data_points_limit = 0
        # _logger.info("Sending request to Get Product Candles")
        response = client.GetProductCandles(request)
        _logger.info(response)

try:
    run(get_historical_product_data)
    # router(load)
    # run(transmitter, {"message": "SOME TESTER DATA", "id": "53"})
except Exception:
    raise _logger.error(f"Transceiver Communication Error:\n\n\n {traceback.format_exc()}")

sys.stdout.flush()
