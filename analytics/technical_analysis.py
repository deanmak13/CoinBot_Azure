import sys

from talib import abstract as TA
import pandas
import numpy
from keras.models import Model
from keras.layers import Input, ConvLSTM1D, Dense, Dropout
from sklearn.model_selection import train_test_split
from utils import get_logger

_logger = get_logger(logger_name="Analytics/Technical Analysis")

def perform_technical_analysis(historical_candle_data):
    ### Add additional features to candle data (feature engineering)
    candle_data = numpy.array(historical_candle_data)
    features = FeatureEngineering(candle_data).features
    DeepLearning(data=features, predictor_variable='close')


class DeepLearning():
    def __init__(self, data :pandas.DataFrame, predictor_variable: str) -> None:
        # disable_traceback_filtering()
        _logger.info("Deep Learning Initiated...")
        self.data = data
        self.predictor_variable = predictor_variable
        self.prepare_data()
        self.model_compilation()
        self.fit_model()

    def prepare_data(self, time_steps_per_sample=10, test_size=0.2):
        # shape = (samples, time steps, features) [-1 lets numpy calculate size based on steps+features]. Adjust time_steps per sample to see effects on model
        # Also extracting predictor variable and as numpy array 
        self.predictor_variable = self.data.pop(self.predictor_variable).to_numpy().reshape(-1, time_steps_per_sample, 1, 1)
        self.data = self.data.to_numpy().reshape(-1, time_steps_per_sample, self.data.shape[1], 1)
        self.train_data, self.test_data, self.train_predictor, self.test_predictor = train_test_split(self.data, self.predictor_variable, test_size=test_size, shuffle=False)

    def model_compilation(self):
        # Managing data input shape using input/reshape layers
        main_input = Input(shape=(self.train_data.shape[1], self.train_data.shape[2], 1)) # Input shape of (<sample_size/observations>=None, <time_steps>, <features>). sample_size=none allows for flexible sample size
        # reshaped_input = Reshape((self.train_data.shape[1], self.train_data.shape[2], 1))(main_input)  # Add channel dimension, new shape is (<sample_size>, <time_steps>, <features>, <channel>=1). 1 as time series is only on 1 channel

        # To maintain shape, either kernel size 1 or
        convlstm = ConvLSTM1D(filters=32, kernel_size=1, activation='relu', return_sequences=False)(main_input)

        dropout = Dropout(0.2)(convlstm)

        outputs = Dense(1)(dropout)

        self.model = Model(inputs=main_input, outputs=outputs)
        self.model.compile(optimizer='adam', loss='mae')
    
    def fit_model(self, batch_size=32, model_validation_split=0.1):
        _logger.info(f"Training model to data of shape: {self.train_data.shape}")
        print(self.train_data)
        print(self.train_predictor)
        self.model.fit(self.train_data, self.train_predictor, validation_split=model_validation_split, batch_size=batch_size)
        # Evaluate the models performance upon fitting
        model_evaluation = self.model.evaluate(self.test_data, self.test_predictor)
        test_prediction = self.model.predict(self.test_data)
        prediction_data_comparison = pandas.DataFrame({'True Values': self.test_predictor.flatten(), 'Predicted Values': test_prediction.flatten()})
        print(f"Model Performance: {model_evaluation}")
        print(prediction_data_comparison)




class FeatureEngineering():
    def __init__(self, candle_data: numpy.ndarray) -> None:
        _logger.info("Feature Engineering Initiated...")
        self.candle_data = candle_data
        self.candle_data_names = ['timestamp', 'low', 'high', 'open', 'close', 'volume']  # Assuming candle_data includes timestamp
        self.analysis_inputs = {
            'low': candle_data[:,1],
            'high': candle_data[:,2],
            'open': candle_data[:,3],
            'close': candle_data[:,4],
            'volume': candle_data[:,5]
        }
        self.engineer_features()

    def engineer_features(self):
        initial_indicators, initial_indicators_names = self.append_technical_analysis_indicators()
        self.initial_indicators_df = pandas.DataFrame(initial_indicators, columns=initial_indicators_names)
        self.interpolate_missing_values()
        self.features = self.correlation_analysis()

    def append_technical_analysis_indicators(self):
        overlay_studies, overlay_studies_names = self.calculate_overlay_studies()
        momentum_indicators, momentum_indicators_names = self.calculate_momentum_indicators()
        volume_indicators, volume_indicators_names = self.calculate_volume_indicators()
        volatility_indicators, volatility_indicators_names = self.calculate_volatility_indicators()
        features_names = self.candle_data_names + overlay_studies_names + momentum_indicators_names + volume_indicators_names + volatility_indicators_names
        features = numpy.concatenate((self.candle_data, overlay_studies, momentum_indicators, volume_indicators, volatility_indicators), axis=1)
        return features, features_names
    
    def interpolate_missing_values(self):
        self.initial_indicators_df['timestamp'] = pandas.to_datetime(self.initial_indicators_df['timestamp'], unit='s')
        self.initial_indicators_df.set_index('timestamp', inplace=True)
        self.initial_indicators_df.bfill(inplace=True)

    def correlation_analysis(self):
        threshold=0.61
        correlation_matrix = self.initial_indicators_df.corr().abs()
        average_correlation = correlation_matrix.mean()
        columns_to_remove = average_correlation[average_correlation >= threshold].index
        columns_to_remove = columns_to_remove.drop('close', errors='ignore')
        _logger.info(f"Removing the following overcorrelating features: {columns_to_remove.to_list()}")
        selected_features = self.initial_indicators_df.drop(columns=columns_to_remove)
        return selected_features        

    def calculate_overlay_studies(self):
        # NOTE: due to formula, increasing timeperiod reduces number of non-NaN observations
        timeperiod = 2
        SMA = TA.SMA(self.analysis_inputs, timeperiod=timeperiod)
        WMA = TA.WMA(self.analysis_inputs, timeperiod=timeperiod)
        EMA = TA.EMA(self.analysis_inputs, timeperiod=timeperiod)
        KAMA = TA.KAMA(self.analysis_inputs, timeperiod=timeperiod)
        BBAND_upper, BBAND_middle, BBAND_lower = TA.BBANDS(self.analysis_inputs, timeperiod=timeperiod, nbdevup=2.0, nbdevdn=2.0, matype=0)
        overlay_studies_names = ['SMA', 'WMA', 'EMA', 'KAMA', 'BBAND_upper', 'BBAND_middle', 'BBAND_lower']
        return numpy.column_stack((SMA, WMA, EMA, KAMA, BBAND_upper, BBAND_middle, BBAND_lower)), overlay_studies_names

    def calculate_momentum_indicators(self):
        timeperiod = 2
        RSI = TA.RSI(self.analysis_inputs, timeperiod=timeperiod)
        MACD, MACD_Signal, MACD_History = TA.MACD(self.analysis_inputs, fastperiod=12, slowperiod=26, signalperiod=9)
        MOM = TA.MOM(self.analysis_inputs, timeperiod=timeperiod)
        MFI = TA.MFI(self.analysis_inputs, timeperiod=timeperiod)
        ROC = TA.ROC(self.analysis_inputs, timeperiod=timeperiod)
        momentum_indicators_names = ['RSI', 'MACD', 'MACD_Signal', 'MACD_History', 'MOM', 'MFI', 'ROC']
        return numpy.column_stack((RSI, MACD, MACD_Signal, MACD_History, MOM, MFI, ROC)), momentum_indicators_names

    def calculate_volume_indicators(self):
        OBV = TA.OBV(self.analysis_inputs)
        volume_indicators_names = ['OBV']
        return numpy.column_stack((OBV,)), volume_indicators_names

    def calculate_volatility_indicators(self):
        timeperiod = 2
        ATR = TA.ATR(self.analysis_inputs, timeperiod=timeperiod)
        volatility_indicators_names = ['ATR']
        return numpy.column_stack((ATR,)), volatility_indicators_names
