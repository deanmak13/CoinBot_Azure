const utils = require('../../utils');

class EventType{
    static CANDLE = utils.getConfig("candle_data", "events.yaml")['event_grid.event_type'];
    static CANDLE_ANALYTICS = utils.getConfig("candle_analytics", "events.yaml")['event_grid.event_type'];
}

module.exports.EventType = EventType;