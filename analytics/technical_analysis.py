import json
import sys

from talib import abstract as TA
import pandas
import numpy
from keras.models import Sequential, model_from_json
from keras.layers import Input, ConvLSTM1D, Dense, Dropout, RepeatVector, Reshape, MaxPooling2D, LeakyReLU
from keras.optimizers import Adam
from keras.losses import Huber
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from matplotlib import pyplot
from utils import get_logger

_logger = get_logger(logger_name="Analytics/Technical Analysis")

def perform_technical_analysis(historical_candle_data):
    ### Add additional features to candle data (feature engineering)
    candle_data = numpy.array(historical_candle_data)
    features = FeatureEngineering(candle_data).features
    DeepLearning(data=features, predictor_variable='close').generate_new_model()

class DeepLearning():
    def __init__(self, data :pandas.DataFrame, predictor_variable: str) -> None:
        # disable_traceback_filtering()
        _logger.info("Deep Learning Initiated...")
        self.data = data
        self.predictor_variable = predictor_variable
        self.data_scaler = MinMaxScaler()
        self.predictor_scaler = MinMaxScaler()
        self.performance_dir = "analytics\\model_configs\\performance.csv"
        self.model_dir = "analytics\\model_configs\\TA_model.json"
        self.evaluation_plot_dir = "analytics\\model_configs\\evaluation_plot.png"

    def generate_new_model(self):
        self.prepare_data()
        self.model_compilation()
        self.fit_model()
        self.evaluate_model()

    # TODO: resolve model loading issues
    def load_model(self):
        self.prepare_data()
        with open(self.model_dir, 'r') as json_file:
            json_object = json.load(json_file)
            self.model = model_from_json(json.dumps(json_object))
        self.fit_model()
        self.evaluate_model()

    def prepare_data(self, time_steps_per_sample=1, test_size=0.2):
        # shape = (samples, time steps, features) [-1 lets numpy calculate size based on steps+features]. Adjust time_steps per sample to see effects on model
        # Also extracting predictor variable and as numpy array 
        predictor_variable = self.data.pop(self.predictor_variable).to_numpy()
        data = self.data.to_numpy()
        data_normalized, predictor_variable_normalzed = self.data_normalisation(data_array=data, predictor_array=predictor_variable)
        data_normalized = data_normalized.reshape(-1, time_steps_per_sample, data.shape[1], 1)
        predictor_variable_normalzed = predictor_variable_normalzed.reshape(-1, time_steps_per_sample, 1, 1)
        self.train_data, self.test_data, self.train_predictor, self.test_predictor = train_test_split(data_normalized, predictor_variable_normalzed, test_size=test_size, shuffle=False)

    def data_normalisation(self, data_array: numpy.ndarray, predictor_array: numpy.ndarray):
        predictor_variable_normalzed = self.predictor_variable_normalzed = self.predictor_scaler.fit_transform(predictor_array.reshape(-1, 1))
        data_normalized = self.data_scaler.fit_transform(data_array)
        return data_normalized, predictor_variable_normalzed

    def prediction_denormalisation(self, prediction_array: numpy.ndarray):
        return self.predictor_scaler.inverse_transform(prediction_array.reshape(1, -1)).flatten()

    def model_compilation(self):
        self.model = Sequential()
        # Managing data input shape using input/reshape layers
        self.model.add(Input(shape=(self.train_data.shape[1], self.train_data.shape[2], 1))) # Input shape of (<sample_size/observations>=None, <time_steps>, <features>, <channel>=1). sample_size=none allows for flexible sample size. 1 as time series is only on 1 channel
        # self.model.add(Reshape((self.train_data.shape[1], self.train_data.shape[2], 1, 1))) # Add channel dimension, new shape is (<sample_size>, <time_steps>, <features>, <channel>=1). 1 as time series is only on 1 channel
    
        self.model.add(Dense(64, activation='linear'))
        self.model.add(Reshape((self.train_data.shape[1], self.train_data.shape[2], 64)))  # Reshape to match ConvLSTM1D input shape

        self.model.add(ConvLSTM1D(filters=100, kernel_size=20, padding='same', activation='tanh', return_sequences=True))

        # self.model.add(ConvLSTM1D(filters=50, kernel_size=20, padding='same', activation='tanh', return_sequences=True))
        # Max pooling layer to reduce spatial dimensions, due to padding in ConvLSTM1D
        self.model.add(MaxPooling2D(pool_size=(1, 10)))
        self.model.add(Dropout(0.8))

        self.model.add(Dense(64, activation='linear'))
        self.model.add(Dense(1, activation='linear'))

        self.model.compile(optimizer=Adam(learning_rate=0.001), loss=Huber())
        self.model.summary() 
        # Saving model configurations to json
        with open(self.model_dir, 'w') as json_file:
            json_file.write(self.model.to_json())

    def fit_model(self, compiled_model=None, batch_size=296, model_validation_split=0.1):
        if not compiled_model:
            compiled_model = self.model
        _logger.info(f"Training model to train data of shape: {self.train_data.shape}")
        compiled_model.fit(self.train_data, self.train_predictor, validation_split=model_validation_split, batch_size=batch_size)

    def evaluate_model(self):
        # Evaluate the models performance upon fitting
        self.loss_evaluation = self.model.evaluate(self.test_data, self.test_predictor, verbose=2)
        test_prediction = self.model.predict(self.test_data)
        _logger.info(f"Predicting on model to data of shape: {self.test_data.shape}, and predictor of shape: {self.test_predictor.shape}, to generate predictions of shape: {test_prediction.shape}")
        test_predictor_denormalised = self.prediction_denormalisation(self.test_predictor)
        test_prediction_denormalised = self.prediction_denormalisation(test_prediction)
        evaluation_result = pandas.DataFrame({'True Values': pandas.Series(test_predictor_denormalised), 'Predicted Values': pandas.Series(test_prediction_denormalised), 'Loss Evaluation': pandas.Series(self.loss_evaluation)})       
        evaluation_result.to_csv(self.performance_dir)
        print(evaluation_result)
        _logger.info(f"Model Performance -\n Loss Eval: {round((self.loss_evaluation * 100), 4)}%\n")
        self.plot_evaluation(evaluation_result)

    def plot_evaluation(self, dataframe):
        # Plotting
        pyplot.figure(figsize=(10, 6))  # Adjust size if needed
        pyplot.plot(dataframe.index, dataframe['True Values'], label='True Values', marker='o')  # Line plot for column1
        pyplot.plot(dataframe.index, dataframe['Predicted Values'], label='Predicted Values', marker='s')  # Line plot for column2
        pyplot.xlabel('Timestep')  # X-axis label
        pyplot.ylabel('Closing Price')  # Y-axis label
        pyplot.title('Price Prediction Evaluation')  # Title of the plot
        pyplot.legend()  # Show legend
        pyplot.grid(True)  # Show grid

        # Save plot to an image file (e.g., PNG format)
        pyplot.savefig(self.evaluation_plot_dir)
        



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

sys.stdout.flush()