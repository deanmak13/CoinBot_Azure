import sys
import traceback
import json
from trio import run
from pynng import Pair0
from utils import setup_logger

_logger = setup_logger()

communicationFileAddress = "ipc:///config/communication.icp"

def router(load: dict):
    message = load['message']

# def transmitter(load: dict):
#     with :
#         transmitter.send_msg(load)

def receiver():
    with Pair0(dial=communicationFileAddress) as receiver:
        load_bytes = receiver.recv_msg().bytes
        load_dict = json.loads(load_bytes)
        load_id = load_dict['id']
        _logger.info(f"RECEIVED LOAD WITH ID: {load_id}")
        receipt = json.dumps({"message": f"RECEIVED LOAD WITH ID {load_id}"})
        receiver.send(receipt.encode())
        return load_dict

try:
    load = receiver()
    router(load)
except Exception:
    raise _logger.error(f"Transceiver Communication Error: {traceback.format_exc()}")
sys.stdout.flush()