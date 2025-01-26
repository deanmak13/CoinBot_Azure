from talib import abstract as TA
from collections import deque
from datetime import timedelta
import numpy

from utils import get_logger

_logger = get_logger(logger_name="Insights")

candleQueue = deque(maxlen=300)


def updateTechnicalIndicators(latestCandleData):
    if candleQueue:
        oldestCandleDataInQueue = candleQueue[-1]
        print(latestCandleData.time)
        print(oldestCandleDataInQueue.time)
        if latestCandleData.time - oldestCandleDataInQueue.time >= timedelta(minutes=5):
            candleQueue.clear()
    candleQueue.appendleft(latestCandleData)
    calculateMovingAverages()


def calculateMovingAverages(timeperiod=5):
    """
    Calculates the overlay study indicators
    :param timeperiod: the duration over which the study is calculated or applied to the underlying data (unit=data points). increasing timeperiod reduces number of non-NaN observations
    :return: Columns of the calculated overlay studies
    """
    inputs = {'low': numpy.array([candle.low for candle in candleQueue]), 'high': numpy.array([candle.high for candle in candleQueue]), 'open': numpy.array([candle.open for candle in candleQueue]),
              'close': numpy.array([candle.close for candle in candleQueue]), 'volume': numpy.array([candle.volume for candle in candleQueue])}
    SMA = TA.SMA(inputs, timeperiod=timeperiod)
    WMA = TA.WMA(inputs, timeperiod=timeperiod)
    EMA = TA.EMA(inputs, timeperiod=timeperiod)
    KAMA = TA.KAMA(inputs, timeperiod=timeperiod)
    BBAND_upper, BBAND_middle, BBAND_lower = TA.BBANDS(inputs, timeperiod=timeperiod, nbdevup=2.0, nbdevdn=2.0, matype=0)
    overlay_studies_names = ['SMA', 'WMA', 'EMA', 'KAMA', 'BBAND_upper', 'BBAND_middle', 'BBAND_lower']
    print(numpy.column_stack((SMA, WMA, EMA, KAMA, BBAND_upper, BBAND_middle, BBAND_lower)))
    return numpy.column_stack((SMA, WMA, EMA, KAMA, BBAND_upper, BBAND_middle, BBAND_lower)), overlay_studies_names
