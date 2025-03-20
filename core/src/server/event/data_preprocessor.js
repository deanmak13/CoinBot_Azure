const { monotonicFactory  } = require('ulid');
const {createEvent, publishEvent} = require("./event_grid_publisher");
const utils = require('../utils');
const {EventType} = require('./model/EventType');

let logger = utils.getLogger();

const generateUlid = monotonicFactory();

const DataPreprocessorInstance = (() => {
    let instance;
  
    const createInstance = () => {
      return new DataPreprocessor();
    };
  
    return {
      getInstance: () => {
        if (!instance) {
          instance = createInstance();
        }
        return instance;
      },
    };
})();

class DataPreprocessor{
    constructor(){}

    eventiseProductCandle(candleJSON){
        let eventType = EventType.CANDLE;
        let subject = "core/src/event/data_preprocessor/eventiseRealTimeProductCandle";
        // Generate a monotonic ULID.
        let id = generateUlid();
        let event = createEvent(id, eventType, subject, candleJSON);
        publishEvent(event);
    }
}

module.exports = {DataPreprocessorInstance};