import logging
import sys
import yaml

loggers = []


def setup_logger(logger_name: str):
    _logger = logging.getLogger(logger_name)
    _logger.setLevel(logging.INFO)
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s - %(name)s - [%(levelname)s] - %(message)s')
    handler.setFormatter(formatter)
    _logger.addHandler(handler)
    loggers.append(_logger)
    return _logger


def get_logger(logger_name: str):
    for logger in loggers:
        if logger.name == logger_name:
            return logger
    return setup_logger(logger_name)


def get_config(config_name, config_file):
    with open(f"./config/{config_file}") as file:
        config = yaml.load(file, Loader=yaml.FullLoader)
        return config[config_name]


GRPC_COMMUNICATION_CHANNEL = get_config('communication_channel', 'grpc.yaml')
