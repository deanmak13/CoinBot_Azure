import pandas as pd
import pandas_ta as ta
from sortedcontainers import SortedList
from datetime import timedelta
import numpy as np

from utils import get_logger, epoch_to_datetime

_logger = get_logger(logger_name="Insights []")

candleQueue = SortedList(key=lambda candle: candle.start)
candle_granularity_mins = 60

def update_technical_indicators(latest_candle_data):
    candleQueue.add(latest_candle_data)

    if candleQueue:
        oldest_candle_in_queue = candleQueue[0]
        latest_start_time = epoch_to_datetime(latest_candle_data.start)
        oldest_start_time = epoch_to_datetime(oldest_candle_in_queue.start)
        if latest_start_time - oldest_start_time >= timedelta(minutes=candle_granularity_mins):
            candleQueue.pop(0)

    return get_cleaned_ohlcv() | calculate_moving_averages() | calculate_bands() | calculate_candlestick_patterns() | calculate_momentum_indicators()

def _get_ohlcv_dataframe():
    """Convert candleQueue to pandas DataFrame for pandas_ta operations"""
    data = get_ohlcv_inputs()
    df = pd.DataFrame({
        'open': data['open'],
        'high': data['high'],
        'low': data['low'],
        'close': data['close'],
        'volume': data['volume']
    }, index=data['time'])
    return df

# Aligned with Trend Analysis
def calculate_moving_averages(timeperiod=2):
    """
    Calculates the overlay study indicators
    :param timeperiod: the duration over which the study is calculated
    :return: Columns of the calculated overlay studies
    """
    if len(candleQueue) < timeperiod:
        return {}
        
    df = _get_ohlcv_dataframe()
    
    # Calculate indicators using pandas_ta
    sma = df.ta.sma(length=timeperiod).values
    wma = df.ta.wma(length=timeperiod).values
    ema = df.ta.ema(length=timeperiod).values
    kama = df.ta.kama(length=timeperiod).values
    
    overlay_study_names = ['SMA', 'WMA', 'EMA', 'KAMA']
    combined_array = np.column_stack((sma, wma, ema, kama))
    
    return clean_calc_outputs(combined_array, overlay_study_names)

# Aligned with Volatility Detection
def calculate_bands(timeperiod=2):
    if len(candleQueue) < timeperiod:
        return {}
        
    df = _get_ohlcv_dataframe()
    
    # Calculate Bollinger Bands
    bbands = df.ta.bbands(length=timeperiod, std=2.0)
    
    # Extract upper, middle, lower bands
    bband_upper = bbands[f'BBU_{timeperiod}_2.0'].values
    bband_middle = bbands[f'BBM_{timeperiod}_2.0'].values
    bband_lower = bbands[f'BBL_{timeperiod}_2.0'].values
    
    overlay_study_names = ['BBAND_upper', 'BBAND_middle', 'BBAND_lower']
    combined_array = np.column_stack((bband_upper, bband_middle, bband_lower))
    
    return clean_calc_outputs(combined_array, overlay_study_names)

# Aligned with Momentum
def calculate_momentum_indicators(timeperiod=2):
    """
    Calculates the momentum indicators
    :param timeperiod: the duration over which the indicator is calculated
    :return: Columns of the calculated momentum indicators
    """
    if len(candleQueue) < timeperiod:
        return {}
        
    df = _get_ohlcv_dataframe()
    
    # Calculate indicators
    rsi = df.ta.rsi(length=timeperiod).values
    
    # MACD has multiple components
    macd_result = df.ta.macd(fast=12, slow=26, signal=9)
    macd = macd_result[f'MACD_12_26_9'].values
    macd_signal = macd_result[f'MACDs_12_26_9'].values
    macd_hist = macd_result[f'MACDh_12_26_9'].values
    
    mom = df.ta.mom(length=timeperiod).values
    mfi = df.ta.mfi(length=timeperiod).values
    roc = df.ta.roc(length=timeperiod).values
    
    overlay_study_names = ['RSI', 'MACD', 'MACD_Signal', 'MACD_History', 'MOM', 'MFI', 'ROC']
    combined_array = np.column_stack((rsi, macd, macd_signal, macd_hist, mom, mfi, roc))
    
    return clean_calc_outputs(combined_array, overlay_study_names)

# Aligned with Pattern Detection
def calculate_candlestick_patterns():
    if len(candleQueue) < 2:  # Patterns usually need at least 2 candles
        return {}
        
    df = _get_ohlcv_dataframe()
    
    # pandas_ta has different pattern naming than TA-Lib
    # We'll use the closest equivalents
    hammer = df.ta.cdl_pattern(name="hammer").values
    engulfing = df.ta.cdl_pattern(name="engulfing").values
    
    overlay_study_names = ['Hammer', 'Engulfing']
    candlestick_patterns = np.column_stack((hammer, engulfing))
    
    return clean_calc_outputs(candlestick_patterns, overlay_study_names)

# Returning numpy ohlcv, not to be used for inputs
def get_cleaned_ohlcv():
    inputs = get_ohlcv_inputs()
    # Define which keys are numeric, as stacking with non-numerics results in string casting on all
    numeric_keys = [key for key in inputs.keys() if key != 'id']
    ohlcv_data = np.column_stack(([inputs[key] for key in numeric_keys]))
    cleaned = clean_calc_outputs(ohlcv_data, numeric_keys)
    # Add back the string id
    cleaned['id'] = inputs['id'].tolist()
    return cleaned

def get_ohlcv_inputs():
    return {'id': np.array([candle.product_id for candle in candleQueue]),
            'time': np.array([candle.start for candle in candleQueue]),
            'low': np.array([candle.low for candle in candleQueue]),
            'high': np.array([candle.high for candle in candleQueue]),
            'open': np.array([candle.open for candle in candleQueue]),
            'close': np.array([candle.close for candle in candleQueue]),
            'volume': np.array([candle.volume for candle in candleQueue])}

def clean_calc_outputs(combined_array, array_columns):
    if not np.isnan(combined_array).all():
        # Transpose to zip columns instead of rows
        return {study_name: data for study_name, data in zip(array_columns, combined_array.T.tolist())}
    return {}