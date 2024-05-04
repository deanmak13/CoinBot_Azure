const axios = require('axios');
const qs = require('qs');
const { SecretClient } = require("@azure/keyvault-secrets");
const { ClientSecretCredential } = require("@azure/identity");
const utils = require('./utils');
require('dotenv').config();

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
async function getProductCandles(productID, granularity, requests=1, data_points_limit=0){
  let apiUrl = `https://api.exchange.coinbase.com/products/${productID}/candles`;
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
      response_data = response_data.concat(response.data);
    }
    if (0 < data_points_limit && data_points_limit < response_data.length){
        response_data = response_data.slice(0, data_points_limit);}
    logger.info("Retrieved %d Total Product Candle Data Points after %d requests", response_data.length, requests)
    return response_data;
  } catch (error) {
    console.log(error);
  }
};

// getProductCandles("BTC-USD", 300).then(data => console.log(data));

module.exports = {getProductCandles}