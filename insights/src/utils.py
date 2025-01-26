import logging
import sys
import yaml
import os

loggers = []


def setup_logger(logger_name: str):
    _logger = logging.getLogger(logger_name)
    _logger.setLevel(logging.INFO)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter('%(asctime)s - %(name)s - [%(levelname)s] - %(message)s')
    console_handler.setFormatter(console_formatter)
    _logger.addHandler(console_handler)

    # File handler
    log_file_path = os.path.join("../home/LogFiles", f"{logger_name}.log")
    file_handler = logging.FileHandler(log_file_path)
    file_handler.setLevel(logging.INFO)
    file_formatter = logging.Formatter('%(asctime)s - %(name)s - [%(levelname)s] - %(message)s')
    file_handler.setFormatter(file_formatter)
    _logger.addHandler(file_handler)

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
