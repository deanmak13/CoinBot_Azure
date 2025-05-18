from talib import abstract as TA
from sortedcontainers import SortedList
import numpy

import utils
from utils import get_logger

_logger = get_logger(logger_name="Insights []")
ANALYTICS_CONFIG = utils.get_config("candle_data_analytics", "analytics_configurations.yml")

candle_store = {}

def generate_store_key(product_id, granularity_mins):
    return f"{product_id}{granularity_mins}"

def upsert_candle_queue(candle):
    queue_key = generate_store_key(candle.product_id, candle.granularity_mins)
    if queue_key not in candle_store.keys():
        candle_store[queue_key] = SortedList(key=lambda candle: candle.start)
    candle_queue = candle_store[queue_key]
    index = candle_queue.bisect_left(candle)
    if index < len(candle_queue) and candle_queue[index].start == candle.start:
        candle_queue.pop(index)
    while len(candle_queue) > ANALYTICS_CONFIG["analytics_store_max_size"]:
        candle_queue.pop(0)
    candle_queue.add(candle)

# NOTE: THIS WORKS ONLY IF SENDING IN WHAT SHOULD BE THE LATEST CANDLE DATA. OTHERWISE, THE LATEST CANDLE DATA IN CACHE WILL BE SENT OUT, WHILE CANDLE PASSED IN HERE IS SIMPLY STASHED AT THE BACK OF QUEUE
def update_technical_indicators(latest_candle_data):
    upsert_candle_queue(latest_candle_data)

    inputs = get_ohlcv_inputs(latest_candle_data.product_id, latest_candle_data.granularity_mins)
    technical_indicators = get_cleaned_ohlcv(inputs) | calculate_moving_averages(inputs) | calculate_bands(inputs) | calculate_candlestick_patterns(inputs) | calculate_momentum_indicators(inputs)

    latest_indicator_values = {}
    for key, values in technical_indicators.items():
        if isinstance(values, list) and values:
            latest_indicator_values[key] = values[-1]

    return latest_indicator_values

def update_technical_indicators_batch(batch_candle_data):
    sorted_batch_data = sorted(batch_candle_data, key=lambda x: x.start)
    analysis_batch = []
    for latest_candle_data in sorted_batch_data:
        latest_analysis = update_technical_indicators(latest_candle_data)
        analysis_batch.append(latest_analysis)
    return analysis_batch

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
    numeric_keys = [key for key in inputs if key not in ['id']]
    if not numeric_keys:
        _logger.warn("No numeric keys found in inputs; skipping indicator calculations.")
        return {}

    try:
        ohlcv_data = numpy.column_stack([inputs[key] for key in numeric_keys])
    except Exception as e:
        _logger.error(f"Failed to build column stack from OHLCV inputs: {e}")
        return {}

    cleaned = clean_calc_outputs(ohlcv_data, numeric_keys)
    cleaned['id'] = inputs['id'].tolist()
    return cleaned

def get_ohlcv_inputs(product_id, granularity_mins):
    store_key = generate_store_key(product_id, granularity_mins)
    if store_key not in candle_store:
        return {}
    candle_queue = candle_store[store_key]
    if not candle_queue:
        return {}
    return {'id': numpy.array([candle.product_id for candle in candle_queue]),
            'time': numpy.array([candle.start for candle in candle_queue]),
            'low': numpy.array([candle.low for candle in candle_queue]),
            'high': numpy.array([candle.high for candle in candle_queue]),
            'open': numpy.array([candle.open for candle in candle_queue]),
            'close': numpy.array([candle.close for candle in candle_queue]),
            'volume': numpy.array([candle.volume for candle in candle_queue]),
            'granularity_mins': numpy.array([candle.granularity_mins for candle in candle_queue])}

def clean_calc_outputs(combined_array, array_columns):
    if not numpy.isnan(combined_array).all():
        # Transpose to zip columns instead of rows
        return {study_name: data for study_name, data in zip(array_columns, combined_array.T.tolist())}
    return {}