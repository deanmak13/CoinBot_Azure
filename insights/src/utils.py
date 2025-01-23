import logging
import sys
import yaml
import os

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
    # Get the shared directory path from an environment variable, or default to local for testing
    shared_config_dir = os.getenv('SHARED_DIR', './config')  # Default to local if not in Docker
    with open(f"{shared_config_dir}/{config_file}") as file:
        config = yaml.load(file, Loader=yaml.FullLoader)
        return config[config_name]


GRPC_COMMUNICATION_CHANNEL = get_config('communication_channel', 'grpc.yaml')