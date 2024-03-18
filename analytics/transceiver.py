import sys
import traceback
import json
from trio import run
from pynng import Pair0
from utils import setup_logger
from time import sleep
from technical_analysis import perform_technical_analysis

_logger = setup_logger()

communicationFileAddress = "ipc:///config/communication.icp"

def router(load: dict):
    message = json.loads(load['message'])
    perform_technical_analysis(message)
    

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
        sleep(3)
        await receiver.asend(receipt)
        _logger.info("Sent Response")
        return load_dict

try:
    load = run(receiver)
    router(load)
    run(transmitter, {"message": "SOME TESTER DATA", "id": "53"})
except Exception:
    raise _logger.error(f"Transceiver Communication Error: {traceback.format_exc()}")

sys.stdout.flush()