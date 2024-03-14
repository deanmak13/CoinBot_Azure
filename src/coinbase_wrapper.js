const axios = require('axios');
const qs = require('qs');
const { SecretClient } = require("@azure/keyvault-secrets");
const { ClientSecretCredential } = require("@azure/identity");
require('dotenv').config();

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
 */
async function getProductCandles(productID, granularity){
  let apiUrl = `https://api.exchange.coinbase.com/products/${productID}/candles`;
  let queryDict = {granularity: granularity};
  let config = configuration(apiUrl, 'get', queryDict);
  try {
    let response = await axios(config);
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

// getProductCandles("BTC-USD", 300).then(data => console.log(data));

module.exports = {getProductCandles}