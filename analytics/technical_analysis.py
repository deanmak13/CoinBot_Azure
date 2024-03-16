import talib
from talib import MA_Type
import numpy

def perform_technical_analysis(historical_candle_data):
    ### Add additional features to candle data (feature engineering)
    # Simple moving average
    candle_data = numpy.array(historical_candle_data)
    print(candle_data)
    Feature_Engineering(candle_data)


class Feature_Engineering():
    def __init__(self, candle_data) -> None:
        self.candle_data = candle_data
        self.low = self.candle_data[:,1]
        self.high = self.candle_data[:,2]
        self.close = self.candle_data[:,4]
        self.volume = self.candle_data[:,5]
        self.calculate_overlay_studies()
        self.calculate_momentum_indicators()
        self.calculate_volume_indicators()

    def calculate_overlay_studies(self):
        # NOTE: due to formula, increasing timeperiod reduces number of non-NaN observations
        time_window = 2
        SMA = talib.SMA(self.close, timeperiod=time_window)
        WMA = talib.WMA(self.close, timeperiod=time_window)
        EMA = talib.EMA(self.close, timeperiod=time_window)
        KAMA = talib.KAMA(self.close, timeperiod=time_window)
        # print(WMA)
    
    def calculate_momentum_indicators(self):
        time_window = 2
        RSI = talib.RSI(self.close, timeperiod=time_window)
        MACD, MACD_Signal, MACD_History = talib.MACD(self.close, fastperiod=12, slowperiod=26, signalperiod=9)
        MOM = talib.MOM(self.close, timeperiod=10)
        MFI = talib.MFI(self.high, self.low, self.close, self.volume, timeperiod=14)
        # print(MACD, MACD_Signal, MACD_History)
        # print(RSI)

    def calculate_volume_indicators(self):
        OBV = talib.OBV(self.close, self.volume)
        # print(OBV)
