import logging
import sys

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
