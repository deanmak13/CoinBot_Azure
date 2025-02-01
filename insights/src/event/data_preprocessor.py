import asyncio

import utils
from event.event_grid_publisher import create_event, publish_event
from event.model.EventType import EventType
from grpc.gen.coinbase.v1.coinbase_products_pb2 import ProductCandle

_logger = utils.get_logger("Insights")

def dict_to_product_candle(dictionary):
    product_candle = ProductCandle()
    product_candle.product_id = dictionary["product_id"]
    product_candle.start = int(dictionary["start"])
    product_candle.open = float(dictionary["open"])
    product_candle.close = float(dictionary["close"])
    product_candle.high = float(dictionary["high"])
    product_candle.low = float(dictionary["low"])
    product_candle.volume = float(dictionary["volume"])
    return product_candle

class DataPreprocessor:
    processedProduceCandleAnalysisEvent=0
    def __new__(cls, *args, **kwargs):
        if not hasattr(cls, 'instance'):
            cls.instance = super(DataPreprocessor, cls).__new__(cls)
        return cls.instance

    def eventise_product_candle_analysis(self, analysis_data):
        _logger.info("Eventising analysis data of size: " + str(len(analysis_data)))
        event_type = EventType.CANDLE_ANALYTICS
        subject = "insights/src/event/prepare_product_candle_analysis_event"
        event = create_event(self.processedProduceCandleAnalysisEvent, event_type, subject, analysis_data)
        publish_event(event)
        self.processedProduceCandleAnalysisEvent+=1
