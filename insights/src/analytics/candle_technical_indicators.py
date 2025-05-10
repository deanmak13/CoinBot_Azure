from talib import abstract as TA
from sortedcontainers import SortedList
import numpy

import utils
from utils import get_logger

_logger = get_logger(logger_name="Insights []")
ANALYTICS_CONFIG = utils.get_config("candle_data_analytics", "analytics_configurations.yml")

candle_store = {}

def upsert_candle_queue(candle):
    if candle.product_id not in candle_store.keys():
        candle_store[candle.product_id] = SortedList(key=lambda candle: candle.start)
    candle_queue = candle_store[candle.product_id]
    index = candle_queue.bisect_left(candle)
    if index < len(candle_queue) and candle_queue[index].start == candle.start:
        candle_queue.pop(index)
    while len(candle_queue) > ANALYTICS_CONFIG["analytics_store_max_size"]:
        candle_queue.pop(0)
    candle_queue.add(candle)

def update_technical_indicators(latest_candle_data):
    upsert_candle_queue(latest_candle_data)

    inputs = get_ohlcv_inputs(latest_candle_data.product_id)
    technical_indicators = get_cleaned_ohlcv(inputs) | calculate_moving_averages(inputs) | calculate_bands(inputs) | calculate_candlestick_patterns(inputs) | calculate_momentum_indicators(inputs)

    latest_indicator_values = {}
    for key, values in technical_indicators.items():
        if isinstance(values, list) and values:
            latest_indicator_values[key] = values[-1]

    return latest_indicator_values

# Aligned with Trend Analysis
def calculate_moving_averages(inputs):
    """
    Calculates the overlay study indicators
    :return: Columns of the calculated overlay studies
    """
    timeperiod = ANALYTICS_CONFIG["MovingAverages"]["timeperiod"]
    SMA = TA.SMA(inputs, timeperiod=timeperiod)
    WMA = TA.WMA(inputs, timeperiod=timeperiod)
    EMA = TA.EMA(inputs, timeperiod=timeperiod)
    KAMA = TA.KAMA(inputs, timeperiod=timeperiod)
    overlay_study_names = ['SMA', 'WMA', 'EMA', 'KAMA']
    combined_array = numpy.column_stack((SMA, WMA, EMA, KAMA))
    return clean_calc_outputs(combined_array, overlay_study_names)

# Aligned with Volatility Detection
def calculate_bands(inputs):
    timeperiod = ANALYTICS_CONFIG["BBANDS"]["timeperiod"]
    BBAND_upper, BBAND_middle, BBAND_lower = TA.BBANDS(inputs, timeperiod=timeperiod, nbdevup=ANALYTICS_CONFIG["BBANDS"]["nbdevup"], nbdevdn=ANALYTICS_CONFIG["BBANDS"]["nbdevdn"], matype=ANALYTICS_CONFIG["BBANDS"]["matype"])
    overlay_study_names = ['BBAND_upper', 'BBAND_middle', 'BBAND_lower']
    combined_array = numpy.column_stack((BBAND_upper, BBAND_middle, BBAND_lower))
    return clean_calc_outputs(combined_array, overlay_study_names)

# Aligned with Momentum
def calculate_momentum_indicators(inputs):
    """
    Calculates the momentum indicators
    :param timeperiod: the duration over which the indicator is calculated or applied to the underlying data (unit=data points). increasing timeperiod reduces number of non-NaN observations
    :return: Columns of the calculated momentum indicators
    """
    timeperiod = ANALYTICS_CONFIG["MACD"]["timeperiod"]
    RSI = TA.RSI(inputs, timeperiod=timeperiod)
    MACD, MACD_Signal, MACD_History = TA.MACD(inputs, fastperiod=ANALYTICS_CONFIG["MACD"]["fastperiod"], slowperiod=ANALYTICS_CONFIG["MACD"]["slowperiod"], signalperiod=ANALYTICS_CONFIG["MACD"]["signalperiod"])
    MOM = TA.MOM(inputs, timeperiod=timeperiod)
    MFI = TA.MFI(inputs, timeperiod=timeperiod)
    ROC = TA.ROC(inputs, timeperiod=timeperiod)
    overlay_study_names = ['RSI', 'MACD', 'MACD_Signal', 'MACD_History', 'MOM', 'MFI', 'ROC']
    combined_array = numpy.column_stack((RSI, MACD, MACD_Signal, MACD_History, MOM, MFI, ROC))
    return clean_calc_outputs(combined_array, overlay_study_names)

# Aligned with Pattern Detection
def calculate_candlestick_patterns(inputs):
    hammer = TA.CDLHAMMER(inputs['open'], inputs['high'], inputs['low'], inputs['close'])
    engulfing = TA.CDLENGULFING(inputs['open'], inputs['high'], inputs['low'], inputs['close'])
    overlay_study_names = ['Hammer', 'Engulfing']
    candlestick_patterns = numpy.column_stack((hammer, engulfing))
    return clean_calc_outputs(candlestick_patterns, overlay_study_names)

# Returning numpy ohlcv, not to be used for inputs
def get_cleaned_ohlcv(inputs):
    # Define which keys are numeric, as stacking with non-numerics results in string casting on all
    numeric_keys = [key for key in inputs.keys() if key != 'id']
    ohlcv_data = numpy.column_stack(([inputs[key] for key in numeric_keys]))
    cleaned = clean_calc_outputs(ohlcv_data, numeric_keys)
    # Add back the string id
    cleaned['id'] = inputs['id'].tolist()
    return cleaned

def get_ohlcv_inputs(product_id):
    if product_id not in candle_store:
        return {}
    return {'id': numpy.array([candle.product_id for candle in candle_store[product_id]]),
            'time': numpy.array([candle.start for candle in candle_store[product_id]]),
            'low': numpy.array([candle.low for candle in candle_store[product_id]]),
            'high': numpy.array([candle.high for candle in candle_store[product_id]]),
            'open': numpy.array([candle.open for candle in candle_store[product_id]]),
            'close': numpy.array([candle.close for candle in candle_store[product_id]]),
            'volume': numpy.array([candle.volume for candle in candle_store[product_id]])}

def clean_calc_outputs(combined_array, array_columns):
    if not numpy.isnan(combined_array).all():
        # Transpose to zip columns instead of rows
        return {study_name: data for study_name, data in zip(array_columns, combined_array.T.tolist())}
    return {}