const utils = require('../../utils');

class EventType{
    static CANDLE = utils.getConfig("candle_data", "events.yaml")['event_grid.event_type'];
    static CANDLE_ANALYTICS = utils.getConfig("candle_analytics", "events.yaml")['event_grid.event_type'];
    static CANDLE_ANALYTICS_BATCH = utils.getConfig("candle_analytics", "events.yaml")['event_grid.batch_event_type'];
    static HISTORICAL_CANDLE = utils.getConfig("historical_candle_data", "events.yaml")['event_grid.event_type'];
}

module.exports.EventType = EventType;