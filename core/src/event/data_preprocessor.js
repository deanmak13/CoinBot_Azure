const {ProductCandle, ProductCandleResponse, ProductCandleRequest} = require('../grpc/gen/coinbase/v1/coinbase_products_pb');
const {createEvent, publishEvent} = require("./event_publisher");
const utils = require('../utils');

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

    processProductCandleData(productCandle){
        let eventType = "productCandleData";
        let subject = "core/src/event/data_preprocessor/processProductCandleData";
        let jsonData = productCandle.toObject();
        let event = createEvent(this.processedProductCandleDataCount, eventType, subject, jsonData);
        logger.info(`Publishing ${eventType} Event: ` + JSON.stringify(event));
        publishEvent(event);
        this.processedProductCandleDataCount++;
    }
}

module.exports = {DataPreprocessorInstance};