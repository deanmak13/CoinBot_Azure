const {ProductCandle, ProductCandleResponse, ProductCandleRequest} = require('../grpc/gen/coinbase/v1/coinbase_products_pb');
const {createEvent, publishEvent} = require("./event_publisher");

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
        let event = createEvent(this.processedProductCandleDataCount, "productCandleData", productCandle);
        publishEvent(event);
        this.processedProductCandleDataCount++;
    }
}

module.exports = {DataPreprocessorInstance};