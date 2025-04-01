require('dotenv').config();
const axios = require('axios');
const qs = require('qs');
const { SecretClient } = require("@azure/keyvault-secrets");
const { ClientSecretCredential } = require("@azure/identity");
const utils = require('../utils');
const WebSocket = require('ws');
const {ProductCandleResponse, ProductCandle} = require('../grpc/gen/coinbase/v1/coinbase_products_pb');

let logger = utils.getLogger();

/**
 * Retrieves API authentication credentials from Azure Key Vault.
 * @returns {Promise<Object>} An object containing API secret and key.
 */
async function getAPIAuthentication() {
  try {
    const credential = new ClientSecretCredential(process.env.TENANT_ID, process.env.CLIENT_ID, process.env.CLIENT_SECRET);

    const keyVaultName = "AppleOfKnowledge1";
    const url = "https://" + keyVaultName + ".vault.azure.net";

    const client = new SecretClient(url, credential);

    const apiSecret = await client.getSecret("CoinbaseSecret");
    const apiKey = await client.getSecret("CoinbaseKey");

    let auth = {secret: apiSecret.value, key: apiKey.value};
    return auth; 
  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  }
}

/**
 * Constructs a configuration object for making HTTP requests with Axios.
 * @param {string} url - The URL of the API endpoint.
 * @param {Object} queryParametersDict - An object containing query parameters.
 * @returns {Object} The configuration object for Axios.
 */
function configuration(url, httpMethod, queryParametersDict){
  let apiAuth = getAPIAuthentication();
  let apiSecret = apiAuth.secret;
  let apiKey = apiAuth.key;
  let config = {
    method: httpMethod,
    url: url,
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
    },
  };
  if (queryParametersDict){
    let queryString = qs.stringify(queryParametersDict);
    config.url += "?" + queryString;
  };
  return config;
};

/**
 * Uses subscription to Websocket channels to retrieve real time data.
 * Pushes data to the 
 * https://docs.cdp.coinbase.com/advanced-trade/docs/ws-overview
*/
class RealTimeMarketData{

  constructor(){
    this.endpoint = "wss://advanced-trade-ws.coinbase.com";
    this.heartbeatTime = 30000;
  }

  sendChannelHeartbeat(webSocket, channel){
    setInterval(() => {
      if (webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(JSON.stringify({ type: "ping" }));
        logger.info("Sent %ss interval heartbeat ping to %s channel", this.heartbeatTime, channel);
      }
    }, this.heartbeatTime);
  }

  /**
   * Retrieves candlestick data for a specific product from the Coinbase API.
   * Then sends the data over to Insights.
   * See candles channel: https://docs.cdp.coinbase.com/advanced-trade/docs/ws-channels#candles-channel
   * @param productCandleRequest
   * @param candleHandler the lambda function to handle the retrieved candle data
   * @returns ProductCandleResponse, which contains:
   *    time - bucket start time
   *    low - lowest price during the bucket interval
   *    high - highest price during the bucket interval
   *    open - opening price (first trade) in the bucket interval
   *    close - closing price (last trade) in the bucket interval
   *    volume - volume of trading activity during the bucket interval
   */
  async streamProductCandleData(productCandleRequest, candleHandler){
    let channel = "candles"
    try{
      let webSocket = new WebSocket(this.endpoint);

      webSocket.addEventListener("open", (event) => {
        let subscribeMessage = {"type": "subscribe", "product_ids":productCandleRequest.getProductIdList(), "channel": channel};
        webSocket.send(JSON.stringify(subscribeMessage));
        logger.info("Subscribed to %s tickers for %s channel", productCandleRequest.getProductIdList(), channel);
        this.sendChannelHeartbeat(webSocket, channel)
      });

      webSocket.addEventListener("message", (event) => {
        let data = JSON.parse(event.data);
        if (data.events){
          for (const event of data.events){
            if (event.candles){
              logger.info("CoinBase %s channel received %d data points", channel, event.candles.length)
              for (const candle of event.candles){
                candleHandler(candle);
              }
            }
          }
        }
      });

      webSocket.addEventListener("close", (event) => {
        logger.warn("Closed %s WebSocket channel with code: %s", channel, event.code);
      });
      
      webSocket.addEventListener("error", (event) => {
        logger.error("Error occured while listening to %s WebSocket channel. Error: %s", channel, event.error);
      });
    }
    catch (error){
      logger.info("Error attempting to listen to %s WebSocket for produce candles: %s", channel, error);
      throw error;
    }
  }

}


class HistoricalMarketData{

  constructor() {}

  /**
   * Retrieves candlestick data for a specific product from the Coinbase API.
   * @param {string} productID - The ID of the product.
   * @param {number} granularity - The granularity of the candlestick data.
   * @returns
   *    time - bucket start time
   *    low - lowest price during the bucket interval
   *    high - highest price during the bucket interval
   *    open - opening price (first trade) in the bucket interval
   *    close - closing price (last trade) in the bucket interval
   *    volume - volume of trading activity during the bucket interval
   */
  static async getProductCandles(productCandleRequest){
    const [productID, granularity, requests, data_points_limit] = productCandleRequest.array;
    let apiUrl = `https://api.exchange.coinbase.com/products/${productID[0]}/candles`;
    let queryDict = {granularity: granularity};
    try {
      let response_data = [];
      for (let completed_requests = 0; completed_requests < requests; completed_requests++){
        if (completed_requests > 0) {
          queryDict['end'] = response_data[response_data.length - 1][0] - granularity;
          queryDict['start'] = queryDict['end'] - (299 * granularity)
        }

        let config = configuration(apiUrl, 'get', queryDict);
        let response = await axios(config);
        response.data.forEach(candle => {
          let productCandle = new ProductCandle(candle);
          response_data.push(productCandle);
        });
      }
      if (0 < data_points_limit && data_points_limit < response_data.length){
          response_data = response_data.slice(0, data_points_limit);}
      logger.info("Coinbase API wrapper Retrieved %d Total Product Candle Data Points after %d requests", response_data.length, requests)
      let productCandles = new ProductCandleResponse().setProductCandlesList(response_data);
      return productCandles;
    } catch (error) {
      console.error(error);
    }
  }

}

module.exports = {RealTimeMarketData, HistoricalMarketData}