from talib import abstract as TA
from collections import deque
from datetime import timedelta, datetime, timezone
import numpy

from event.data_preprocessor import DataPreprocessor
from utils import get_logger, epoch_to_datetime

_logger = get_logger(logger_name="Insights []")

candleQueue = deque(maxlen=300)
candle_granularity_mins = 5

def update_technical_indicators(latest_candle_data):
    if len(candleQueue) > 0:
        oldest_candle_data_in_queue = candleQueue[-1]
        latest_start_time = epoch_to_datetime(latest_candle_data.start)
        oldest_start_time = epoch_to_datetime(oldest_candle_data_in_queue.start)
        if latest_start_time - oldest_start_time >= timedelta(minutes=candle_granularity_mins):
            candleQueue.pop()
    candleQueue.appendleft(latest_candle_data)
    return calculate_moving_averages() | calculate_bands() | calculate_candlestick_patterns() | calculate_momentum_indicators()

# Aligned with Trend Analysis
def calculate_moving_averages(timeperiod=2):
    """
    Calculates the overlay study indicators
    :param timeperiod: the duration over which the study is calculated or applied to the underlying data (unit=data points). increasing timeperiod reduces number of non-NaN observations
    :return: Columns of the calculated overlay studies
    """
    inputs = get_ohlcv_inputs()
    SMA = TA.SMA(inputs, timeperiod=timeperiod)
    WMA = TA.WMA(inputs, timeperiod=timeperiod)
    EMA = TA.EMA(inputs, timeperiod=timeperiod)
    KAMA = TA.KAMA(inputs, timeperiod=timeperiod)
    overlay_study_names = ['SMA', 'WMA', 'EMA', 'KAMA']
    combined_array = numpy.column_stack((SMA, WMA, EMA, KAMA))
    return clean_calc_outputs(combined_array, overlay_study_names)

# Aligned with Volatility Detection
def calculate_bands(timeperiod=2):
    inputs = get_ohlcv_inputs()
    BBAND_upper, BBAND_middle, BBAND_lower = TA.BBANDS(inputs, timeperiod=timeperiod, nbdevup=2.0, nbdevdn=2.0, matype=0)
    overlay_study_names = ['BBAND_upper', 'BBAND_middle', 'BBAND_lower']
    combined_array = numpy.column_stack((BBAND_upper, BBAND_middle, BBAND_lower))
    return clean_calc_outputs(combined_array, overlay_study_names)

# Aligned with Momentum
def calculate_momentum_indicators(timeperiod = 2):
    """
    Calculates the momentum indicators
    :param timeperiod: the duration over which the indicator is calculated or applied to the underlying data (unit=data points). increasing timeperiod reduces number of non-NaN observations
    :return: Columns of the calculated momentum indicators
    """
    inputs = get_ohlcv_inputs()
    RSI = TA.RSI(inputs, timeperiod=timeperiod)
    MACD, MACD_Signal, MACD_History = TA.MACD(inputs, fastperiod=12, slowperiod=26, signalperiod=9)
    MOM = TA.MOM(inputs, timeperiod=timeperiod)
    MFI = TA.MFI(inputs, timeperiod=timeperiod)
    ROC = TA.ROC(inputs, timeperiod=timeperiod)
    overlay_study_names = ['RSI', 'MACD', 'MACD_Signal', 'MACD_History', 'MOM', 'MFI', 'ROC']
    combined_array = numpy.column_stack((RSI, MACD, MACD_Signal, MACD_History, MOM, MFI, ROC))
    return clean_calc_outputs(combined_array, overlay_study_names)

# Aligned with Pattern Detection
def calculate_candlestick_patterns():
    inputs = get_ohlcv_inputs()
    hammer = TA.CDLHAMMER(inputs['open'], inputs['high'], inputs['low'], inputs['close'])
    engulfing = TA.CDLENGULFING(inputs['open'], inputs['high'], inputs['low'], inputs['close'])
    overlay_study_names = ['Hammer', 'Engulfing']
    candlestick_patterns = numpy.column_stack((hammer, engulfing))
    return clean_calc_outputs(candlestick_patterns, overlay_study_names)

def get_ohlcv_inputs():
    return {'low': numpy.array([candle.low for candle in candleQueue]),
              'high': numpy.array([candle.high for candle in candleQueue]),
              'open': numpy.array([candle.open for candle in candleQueue]),
              'close': numpy.array([candle.close for candle in candleQueue]),
              'volume': numpy.array([candle.volume for candle in candleQueue])}

def clean_calc_outputs(combined_array, array_columns):
    if not numpy.isnan(combined_array).all():
        return {study_name: data for study_name, data in zip(array_columns, combined_array.tolist())}
    return {}