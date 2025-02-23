from event.event_grid_subscriber import process_event
from grpc.gen.coinbase.v1.coinbase_products_pb2 import ProductCandle


class MockDataProvider:
    def create_serialized_product_candle(self, product_id, time, low, high, open_price, close, volume):
        # Create a new instance of ProductCandle
        product_candle = ProductCandle()

        # Set the fields
        product_candle.product_id = product_id
        product_candle.start = time
        product_candle.low = low
        product_candle.high = high
        product_candle.open = open_price
        product_candle.close = close
        product_candle.volume = volume

        # Serialize to binary
        return product_candle.SerializeToString()

    def mock_event_data(self):
        # ProductCandle example objects
        data = [
            {"id": "63", "eventType": "productCandleData",
             "data": self.create_serialized_product_candle("BTC-USD", 1737908400, 45, 2, 5, 5, 52), "dataVersion": "1.0",
             "subject": "core/src/event/data_preprocessor/processProductCandleData",
             "eventTime": "2025-01-26T16:27:30.630Z"},
            {"id": "64", "eventType": "productCandleData",
             "data": self.create_serialized_product_candle("BTC-USD", 1737915600, 47, 4, 7, 7, 50), "dataVersion": "1.0",
             "subject": "core/src/event/data_preprocessor/processProductCandleData",
             "eventTime": "2025-01-26T16:27:30.632Z"},
            {"id": "65", "eventType": "productCandleData",
             "data": self.create_serialized_product_candle("BTC-USD", 1737919200, 49, 3.5, 6.5, 6.5, 51), "dataVersion": "1.0",
             "subject": "core/src/event/data_preprocessor/processProductCandleData",
             "eventTime": "2025-01-26T16:27:30.634Z"},
            {"id": "66", "eventType": "productCandleData",
             "data": self.create_serialized_product_candle("BTC-USD", 1737922800, 46, 3.8, 7.2, 7.1, 53), "dataVersion": "1.0",
             "subject": "core/src/event/data_preprocessor/processProductCandleData",
             "eventTime": "2025-01-26T16:27:30.635Z"},
            {"id": "67", "eventType": "productCandleData",
             "data": self.create_serialized_product_candle("BTC-USD", 1737926400, 48, 3.2, 6.8, 6.9, 49), "dataVersion": "1.0",
             "subject": "core/src/event/data_preprocessor/processProductCandleData",
             "eventTime": "2025-01-26T16:27:30.638Z"},
            {"id": "68", "eventType": "productCandleData",
             "data": self.create_serialized_product_candle("BTC-USD", 1737930000, 47.5, 3.3, 6.3, 6.4, 50), "dataVersion": "1.0",
             "subject": "core/src/event/data_preprocessor/processProductCandleData",
             "eventTime": "2025-01-26T16:27:30.639Z"},
            {"id": "69", "eventType": "productCandleData",
             "data": self.create_serialized_product_candle("BTC-USD", 1737933600, 49.5, 4.1, 7.1, 7.2, 52), "dataVersion": "1.0",
             "subject": "core/src/event/data_preprocessor/processProductCandleData",
             "eventTime": "2025-01-26T16:27:30.641Z"},
            {"id": "70", "eventType": "productCandleData",
             "data": self.create_serialized_product_candle("BTC-USD", 1737937200, 48.5, 3.7, 6.7, 6.8, 51), "dataVersion": "1.0",
             "subject": "core/src/event/data_preprocessor/processProductCandleData",
             "eventTime": "2025-01-26T16:27:30.642Z"}
        ]
        for event in data:
            event_mock = [event]
            # Convert the list to JSON format
            # json_data = json.dumps(event_mock, indent=4)
            process_event(event_mock)
