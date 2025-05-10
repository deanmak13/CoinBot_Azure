import utils

class EventType:
    CANDLE = utils.get_config("candle_data", "events.yaml")['event_grid.event_type']
    CANDLE_ANALYTICS = utils.get_config("candle_analytics", "events.yaml")["event_grid.event_type"]
    HISTORICAL_CANDLE = utils.get_config("historical_candle_data", "events.yaml")["event_grid.event_type"]
