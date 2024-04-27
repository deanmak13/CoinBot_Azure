import json
import sys

from talib import abstract as TA
import pandas
import numpy
import math
from keras import saving as keras_saving
from keras.preprocessing.sequence import pad_sequences
from keras.models import Sequential, model_from_json, Model
from keras.layers import Input, ConvLSTM1D, Dense, Dropout, RepeatVector, Reshape, MaxPooling2D, BatchNormalization
from keras.callbacks import LambdaCallback, Callback
from keras.optimizers import Adam
from keras.losses import Huber
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler
from matplotlib import pyplot
from utils import get_logger

_logger = get_logger(logger_name="Analytics/Technical Analysis")

def perform_technical_analysis(historical_candle_data):
    ### Add additional features to candle data (feature engineering)
    candle_data = numpy.array(historical_candle_data)
    features = FeatureEngineering(candle_data).features
    # DeepLearning(data=features, predictor='close').load_trained_model()
    DeepLearning(data=features, predictor='close').generate_new_model()

class DeepLearning():
    def __init__(self, data :pandas.DataFrame, predictor: str) -> None:
        # disable_traceback_filtering()
        _logger.info("Deep Learning Initiated...")
        self.data = data
        self.predictor = predictor
        self.model_validation_split = 0.1
        self.predictor_scaler = RobustScaler()
        self.performance_dir = "analytics\\model_artifacts\\performance.csv"
        self.model_config_dir = "analytics\\model_artifacts\\TA_model_config.json"
        self.trained_model_dir = "analytics\\model_artifacts\\archive\\TA_model.keras"
        self.evaluation_plot_dir = "analytics\\model_artifacts\\evaluation_plot.png"

    def generate_new_model(self):
        self.prepare_data()
        self.model_compilation()
        self.fit_model()
        self.evaluate_model()

    # TODO: resolve model loading issues
    def load_model_config(self):
        self.prepare_data()
        with open(self.model_config_dir, 'r') as json_file:
            json_object = json.load(json_file)
            self.model = model_from_json(json.dumps(json_object))
        self.fit_model()
        self.evaluate_model()

    def load_trained_model(self):
        self.prepare_data()
        self.model = keras_saving.load_model(self.trained_model_dir)
        self.evaluate_model()

    def prepare_data(self, test_size=0.2, window_size=5):
        """
        Prepare data for model training and testing.
        :param test_size: The ratio of test observations to be used in self evaluating the model
        :param window_size: The number of observations in each window
        """
        # extracting predictor variable and as numpy array 
        predictor = self.data.pop(self.predictor).to_numpy()
        data = self.data.to_numpy()
        data_normalized, predictor_normalized = self.data_normalisation(data_array=data, predictor_array=predictor)
        
        data_rolling, predictor_rolling = [], []
        # Creating rolling window in data. Hence, every 5 data values will point to every 5th predictor value
        for i in range(window_size, data_normalized.shape[0]):
            data_rolling.append(data_normalized[i-window_size:i])
            predictor_rolling.append(predictor_normalized[i])

        # set batch size based on rolling length
        self.batch_size = max([i for i in range(1, len(predictor_rolling)) if len(predictor_rolling) % i == 0])
        
        data_rolling = numpy.array(data_rolling)
        predictor_rolling = numpy.array(predictor_rolling).reshape(-1, self.batch_size, 1, 1)
        data_rolling = data_rolling.reshape(-1, self.batch_size, data_rolling.shape[1], data_rolling.shape[2])
        data_rolling = pad_sequences(data_rolling, maxlen=max(len(seq) for seq in data_rolling), padding='post', dtype='float32')
        predictor_rolling = pad_sequences(predictor_rolling, maxlen=max(len(seq) for seq in predictor_rolling), padding='post', dtype='float32')
        self.train_data, self.test_data, self.train_predictor, self.test_predictor = train_test_split(data_rolling, predictor_rolling, test_size=test_size, shuffle=False)

    def data_normalisation(self, data_array: numpy.ndarray, predictor_array: numpy.ndarray):
        """
        Normalises the data for model fitting.
        :param data_array: the numpy array of data
        :param predictor_array: the numpy array of the predictor data
        """
        predictor_normalized = self.predictor_scaler.fit_transform(predictor_array.reshape(-1, 1))
        data_normalized = RobustScaler().fit_transform(data_array)
        return data_normalized, predictor_normalized

    def prediction_denormalisation(self, prediction_array: numpy.ndarray):
        """
        Using the same scaler used to normalise the predictor data, this will denormalise predicted values
        :param prediction_array: the array of predicted values
        :return the denormalised predicted values
        """
        return self.predictor_scaler.inverse_transform(prediction_array.reshape(1, -1)).flatten()

    def model_compilation(self):
        """
        Compiles the multiple layers of the model together
        """
        # Managing data input shape using input/reshape layers
        input_batch_size = math.floor((1-self.model_validation_split)*self.train_data.shape[0])
        print(f"THIS IS INPUT BSTCH SIZEL {input_batch_size}")

        self.model = Sequential()
        self.model.add(Input(shape=(self.train_data.shape[1], self.train_data.shape[2], self.train_data.shape[3]), batch_size=input_batch_size)) # Input shape of (<sample_size/observations>=None, <time_steps>, <features>, <channel>=1). sample_size=none allows for flexible sample size. 1 as time series is only on 1 channel
                 
        self.model.add(Dense(64, activation='linear'))
        self.model.add(Reshape((-1, self.train_data.shape[2], 64)))  # Reshape to match ConvLSTM1D input shape

        self.model.add(ConvLSTM1D(filters=130, kernel_size=10, padding='same', activation='tanh', return_sequences=True, go_backwards=False, stateful=True))
        # self.model.add(BatchNormalization())
        # self.model.add(ConvLSTM1D(filters=120, kernel_size=10, padding='same', activation='tanh', return_sequences=True, go_backwards=False, stateful=True))

        # Max pooling layer to reduce spatial dimensions, due to padding in ConvLSTM1D
        self.model.add(MaxPooling2D(pool_size=(1, self.train_data.shape[2])))
        self.model.add(Dropout(0.5))

        self.model.add(Dense(64, activation='linear'))
        self.model.add(Dense(1, activation='linear'))

        # self.model = Model(inputs=inputs, outputs=outputs)
        self.model.compile(optimizer=Adam(learning_rate=0.001), loss=Huber())
        self.model.summary() 
        # Saving model configurations to jsoninput = 
        with open(self.model_config_dir, 'w') as json_file:
            json_file.write(self.model.to_json())

    class ResetStatesCallback(Callback):
        def on_epoch_begin(self, epoch, logs):
            self.model.reset_states()

    def reset_states(self, epoch, logs):
        self.model.layers[3].reset_states()

    def fit_model(self, compiled_model=None):
        """
        Fits the training data to the model, and saves the 
        :param compiled_model: The model to fit the training data to
        :param model_validation_split: the test and train data the model will use for self evaluations. The ratio representing the amount of test data
        """
        if not compiled_model:
            compiled_model = self.model
        _logger.info(f"Training model to train data of shape: {self.train_data.shape} and train predictor of shape: {self.train_predictor.shape}")
        reset_states_callback = LambdaCallback(on_epoch_end=self.reset_states)
        compiled_model.fit(self.train_data, self.train_predictor, validation_split=self.model_validation_split, shuffle=False) #TODO: figure out why batch size so problematic
        compiled_model.save(self.trained_model_dir)

    def evaluate_model(self):
        """
        Evaluates the models performance upon fitting, logs the results dataframe and gets it plotted
        """
        _logger.info(f"Predicting on model to data of shape: {self.test_data.shape}, and predictor of shape: {self.test_predictor.shape}")
        self.loss_evaluation = self.model.evaluate(self.test_data, self.test_predictor, verbose=2)
        test_prediction = self.model.predict(self.test_data)
        _logger.info(f"Generating predictions of shape: {test_prediction.shape}")
        test_predictor_denormalised = self.prediction_denormalisation(self.test_predictor)
        test_prediction_denormalised = self.prediction_denormalisation(test_prediction)
        evaluation_result = pandas.DataFrame({'True Values': pandas.Series(test_predictor_denormalised), 'Predicted Values': pandas.Series(test_prediction_denormalised), 'Loss Evaluation': pandas.Series(self.loss_evaluation), 'Features': pandas.Series(self.data.columns)})      
        evaluation_result.to_csv(self.performance_dir)
        print(evaluation_result)
        _logger.info(f"Model Performance -\n Loss Eval: {round((self.loss_evaluation * 100), 4)}%\n")
        self.plot_evaluation(evaluation_result)

    def plot_evaluation(self, dataframe: pandas.DataFrame):
        """
        Plots the results from the evaluate_model() function, and saves plot to file
        :param dataframe: The evaluation results
        """
        pyplot.figure(figsize=(10, 6))  # Adjust size if needed
        pyplot.plot(dataframe.index, dataframe['True Values'], label='True Values', marker='.', linestyle='-', markersize=2, linewidth=0.5) 
        pyplot.plot(dataframe.index, dataframe['Predicted Values'], label='Predicted Values', marker='.', linestyle='-', markersize=2, linewidth=0.5) 
        pyplot.xlabel('Timestep')  # X-axis label
        pyplot.ylabel('Closing Price')  # Y-axis label
        pyplot.title(f"Price Prediction Evaluation (Loss eval : {dataframe['Loss Evaluation'][0]} )")  # Title of the plot
        pyplot.legend()  # Show legend
        pyplot.grid(True)  # Show grid

        # Save plot to an image file (e.g., PNG format)
        pyplot.savefig(self.evaluation_plot_dir)
        



class FeatureEngineering():
    """
    Processing data to ready it for model training, including calculating indicators, interpolating missing values and correlation analysis.
    """
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
        """
        The main function calling the correct sequence of functions for feature engineering
        """
        self.initial_indicators_df = self.append_technical_analysis_indicators()
        self.interpolate_missing_values()
        self.features = self.correlation_analysis()

    def append_technical_analysis_indicators(self):
        """
        Collects all the categorised indicators/features from their calculating functions and concatenates them into one numpy store
        :return: DataFrame of the features and feature names
        """
        overlay_studies, overlay_studies_names = self.calculate_overlay_studies()
        momentum_indicators, momentum_indicators_names = self.calculate_momentum_indicators()
        volume_indicators, volume_indicators_names = self.calculate_volume_indicators()
        volatility_indicators, volatility_indicators_names = self.calculate_volatility_indicators()
        features_names = self.candle_data_names + overlay_studies_names + momentum_indicators_names + volume_indicators_names + volatility_indicators_names
        features = numpy.concatenate((self.candle_data, overlay_studies, momentum_indicators, volume_indicators, volatility_indicators), axis=1)
        indicators_df = pandas.DataFrame(features, columns=features_names)
        return indicators_df
    
    def interpolate_missing_values(self):
        """
        Interpolates any missing data in the initial pre-correlation DataFrame, while also transforming enoch time to datetime
        """
        self.initial_indicators_df['timestamp'] = pandas.to_datetime(self.initial_indicators_df['timestamp'], unit='s')
        
        self.initial_indicators_df.set_index('timestamp', inplace=True)
        # self.initial_indicators_df.bfill(inplace=True)
        self.initial_indicators_df.replace(0, numpy.nan, inplace=True)
        self.initial_indicators_df.fillna(method='bfill', inplace=True)

    def correlation_analysis(self, threshold=0.61):
        """
        Performs correlation on the features and drops those above the defined threshold
        :param int threshold: the correlation threshold above which a column is dropped (default=0.61)
        :return: the remaining columns in a DataFrame
        """
        correlation_matrix = self.initial_indicators_df.corr().abs()
        average_correlation = correlation_matrix.mean()
        columns_to_remove = average_correlation[average_correlation >= threshold].index
        columns_to_remove = columns_to_remove.drop('close', errors='ignore')
        _logger.info(f"Removing the following overcorrelating features: {columns_to_remove.to_list()}")
        selected_features = self.initial_indicators_df.drop(columns=columns_to_remove)
        return selected_features        

    def calculate_overlay_studies(self, timeperiod = 2):
        """
        Calculates the overlay study indicators
        :param timeperiod: the duration over which the study is calculated or applied to the underlying data (unit=data points). increasing timeperiod reduces number of non-NaN observations
        :return: Columns of the calculated overlay studies
        """
        SMA = TA.SMA(self.analysis_inputs, timeperiod=timeperiod)
        WMA = TA.WMA(self.analysis_inputs, timeperiod=timeperiod)
        EMA = TA.EMA(self.analysis_inputs, timeperiod=timeperiod)
        KAMA = TA.KAMA(self.analysis_inputs, timeperiod=timeperiod)
        BBAND_upper, BBAND_middle, BBAND_lower = TA.BBANDS(self.analysis_inputs, timeperiod=timeperiod, nbdevup=2.0, nbdevdn=2.0, matype=0)
        overlay_studies_names = ['SMA', 'WMA', 'EMA', 'KAMA', 'BBAND_upper', 'BBAND_middle', 'BBAND_lower']
        return numpy.column_stack((SMA, WMA, EMA, KAMA, BBAND_upper, BBAND_middle, BBAND_lower)), overlay_studies_names

    def calculate_momentum_indicators(self, timeperiod = 2):
        """
        Calculates the momentum indicators
        :param timeperiod: the duration over which the indicator is calculated or applied to the underlying data (unit=data points). increasing timeperiod reduces number of non-NaN observations
        :return: Columns of the calculated momentum indicators
        """
        RSI = TA.RSI(self.analysis_inputs, timeperiod=timeperiod)
        MACD, MACD_Signal, MACD_History = TA.MACD(self.analysis_inputs, fastperiod=12, slowperiod=26, signalperiod=9)
        MOM = TA.MOM(self.analysis_inputs, timeperiod=timeperiod)
        MFI = TA.MFI(self.analysis_inputs, timeperiod=timeperiod)
        ROC = TA.ROC(self.analysis_inputs, timeperiod=timeperiod)
        momentum_indicators_names = ['RSI', 'MACD', 'MACD_Signal', 'MACD_History', 'MOM', 'MFI', 'ROC']
        return numpy.column_stack((RSI, MACD, MACD_Signal, MACD_History, MOM, MFI, ROC)), momentum_indicators_names

    def calculate_volume_indicators(self):
        """
        Calculates the volatility indicators
        :return: Columns of the calculated volume indicators
        """
        OBV = TA.OBV(self.analysis_inputs)
        volume_indicators_names = ['OBV']
        return numpy.column_stack((OBV,)), volume_indicators_names

    def calculate_volatility_indicators(self, timeperiod = 2):
        """
        Calculates the volatility indicators
        :param timeperiod: the duration over which the indicator is calculated or applied to the underlying data (unit=data points). increasing timeperiod reduces number of non-NaN observations
        :return: Columns of the calculated volatility indicators
        """
        ATR = TA.ATR(self.analysis_inputs, timeperiod=timeperiod)
        volatility_indicators_names = ['ATR']
        return numpy.column_stack((ATR,)), volatility_indicators_names

sys.stdout.flush()