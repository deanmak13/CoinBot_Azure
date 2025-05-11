require('dotenv').config();
const axios = require('axios');
const WebSocket = require('ws');
const {HttpMethod, CoinbaseBaseURL, RequestPath, resolveIntToApiGranularity} = require('../model/Coinbase');
const {createJWTToken, getAPIAuthentication, generateApiConfiguration} = require('./coinbase_auth')
const utils = require('../../utils');

let logger = utils.getLogger();

/**
 * Uses subscription to Websocket channels to retrieve real time data.
 * https://docs.cdp.coinbase.com/advanced-trade/docs/ws-overview
 */
class RealTimeMarketData {
  constructor() {
    this.endpoint = "wss://advanced-trade-ws.coinbase.com";
    this.heartbeatTime = 30000;
  }

  sendChannelHeartbeat(webSocket, channel) {
    setInterval(() => {
      if (webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(JSON.stringify({ type: "ping" }));
        logger.info("Sent %ss interval heartbeat ping to %s channel", this.heartbeatTime, channel);
      }
    }, this.heartbeatTime);
  }

  /**
   * Retrieves candlestick data for a specific product from the Coinbase API.
   * @param productCandleRequest
   * @param candleHandler the lambda function to handle the retrieved candle data
   */
  async streamProductCandleData(productCandleRequest, candleHandler) {
    const channel = "candles";
    try {
      const webSocket = new WebSocket(this.endpoint);

      webSocket.addEventListener("open", (event) => {
        let subscribeMessage = {"type": "subscribe", "product_ids":productCandleRequest.getProductIdList(), "channel": channel};
        webSocket.send(JSON.stringify(subscribeMessage));
        logger.info("Subscribed to %s tickers for realtime %s channel", productCandleRequest.getProductIdList(), channel);
        this.sendChannelHeartbeat(webSocket, channel)
      });

      webSocket.addEventListener("message", (event) => {
        let data = JSON.parse(event.data);
        if (data.events){
          for (const event of data.events){
            if (event.candles){
              logger.info("CoinBase realtime %s channel received %d data points", channel, event.candles.length)
              for (const candle of event.candles){
                candleHandler(candle);
              }
            }
          }
        }
      });

      webSocket.addEventListener("close", (event) => {
        logger.warn("Closed realtime %s WebSocket channel with code: %s", channel, event.code);
      });
      
      webSocket.addEventListener("error", (event) => {
        logger.error("Error occured while listening to realtime %s WebSocket channel. Error: %s", channel, event.error);
      });
      return webSocket; // Return the websocket so caller can close it if needed
    }
    catch (error) {
      logger.error("Error attempting to listen to realtime %s WebSocket for product candles: %s", channel, error);
      throw error;
    }
  }
}

class HistoricalMarketData {
  constructor() {}

  /**
   * Retrieves candlestick data for a specific product from the Coinbase API.
   * @param productCandleRequest
   * @param endTime
   * @param startTime
   * @param candleBatchHandler
   */
  async fetchProductCandleData(productCandleRequest, endTime, startTime, candleBatchHandler) {
    for (const productID of productCandleRequest.getProductIdList()) {
      const apiUri = `${CoinbaseBaseURL}${RequestPath.PRODUCTS}/${productID}/candles`;
      const granularityMinutes = productCandleRequest.getGranularity();
      const queryDict = {
        granularity: resolveIntToApiGranularity(granularityMinutes),
        end: endTime,
        start: startTime
      };

      try {
        const config = await generateApiConfiguration(apiUri, HttpMethod.GET, queryDict);
        logger.info(`Fetching historical candle data for ${productID} from ${startTime} to ${endTime}`);

        const response = await axios(config);
        let candleBatchCount = 0;

        if (response.data && Array.isArray(response.data.candles)) {
          const candles = response.data.candles;
          candleBatchHandler(candles, productID);
          candleBatchCount = candles.length;
          logger.info("Retrieved %d historical candle data points for %s", candleBatchCount, productID);
        } else {
          logger.warn("Unexpected response format from Coinbase API for historical %s", productID);
          console.log("Response data:", response.data);
        }
      } catch (error) {
        logger.error("Error fetching historical candle data for %s: %s", productID, error.message);
        if (error.response) {
          logger.error("Historical API Response Status: %s, data: %s", error.response.status, JSON.stringify(error.response.data));
        }
      }
    }
  }

  /**
   * Test the API connection by calling /brokerage/accounts
   */
  async testApiConnection() {
    try {
      const apiAuth = await getAPIAuthentication();
      const uri = CoinbaseBaseURL + RequestPath.PRODUCTS;
      const token = await createJWTToken(HttpMethod.GET, apiAuth.key, apiAuth.secret, uri);
      const fullUri = 'https://' + uri;

      const config = {
        method: HttpMethod.GET,
        url: fullUri,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      const response = await axios(config);
      logger.info("Coinbase API connection successful:", response.status);
      if (response.status === 200){
        return response;
      }
    } catch (err) {
      logger.error("Connection test failed:", err.message);
    }
  }
}

module.exports = {RealTimeMarketData, HistoricalMarketData}