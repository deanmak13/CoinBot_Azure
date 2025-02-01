const {ProductCandle, ProductCandleResponse, ProductCandleRequest} = require('../grpc/gen/coinbase/v1/coinbase_products_pb');
const {createEvent, publishEvent} = require("./event_grid_publisher");
const utils = require('../utils');
const {EventType} = require('./model/EventType');

let logger = utils.getLogger();

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
    constructor(){
        this.processedProductCandleDataCount = 0;
    }

    eventiseProductCandle(candleJSON){
        let eventType = EventType.CANDLE;
        let subject = "core/src/event/data_preprocessor/prepareProductCandleEvent";
        let event = createEvent(this.processedProductCandleDataCount, eventType, subject, candleJSON);
        publishEvent(event);
        this.processedProductCandleDataCount++;
    }
}

module.exports = {DataPreprocessorInstance};