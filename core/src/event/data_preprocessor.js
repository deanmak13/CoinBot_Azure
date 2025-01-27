const {ProductCandle, ProductCandleResponse, ProductCandleRequest} = require('../grpc/gen/coinbase/v1/coinbase_products_pb');
const {createEvent, publishEvent} = require("./event_grid_publisher");
const utils = require('../utils');
const jspb = require('google-protobuf');

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

    // TODO: need to figure out how to map direct without setting each field. Issue with generated proto classes
    mapCandleJSONToProductCandle(candle) {
      let productCandle = new ProductCandle();
      // Mapping and setting fields
      productCandle.setProductId(candle.product_id);
      productCandle.setStart(parseInt(candle.start));
      productCandle.setLow(parseFloat(candle.low));
      productCandle.setHigh(parseFloat(candle.high));
      productCandle.setOpen(parseFloat(candle.open));
      productCandle.setClose(parseFloat(candle.close));
      productCandle.setVolume(parseFloat(candle.volume));
      return productCandle;
  }

    processProductCandleData(candleJSON){
        let eventType = "productCandleData";
        let subject = "core/src/event/data_preprocessor/processProductCandleData";
        let productCandle = this.mapCandleJSONToProductCandle(candleJSON)
        let serializedJson = productCandle.toObject(productCandle);
        let event = createEvent(this.processedProductCandleDataCount, eventType, subject, serializedJson);
        publishEvent(event);
        this.processedProductCandleDataCount++;
    }
}

module.exports = {DataPreprocessorInstance};