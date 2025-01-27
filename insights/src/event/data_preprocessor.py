from grpc.gen.coinbase.v1.coinbase_products_pb2 import ProductCandle


def dict_to_product_candle(dictionary):
    product_candle = ProductCandle()
    product_candle.product_id = dictionary["productId"]
    product_candle.start = dictionary["start"]
    product_candle.open = dictionary["open"]
    product_candle.close = dictionary["close"]
    product_candle.high = dictionary["high"]
    product_candle.low = dictionary["low"]
    product_candle.volume = dictionary["volume"]
    return product_candle
