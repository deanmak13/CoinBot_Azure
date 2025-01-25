const { EventGridPublisherClient, AzureKeyCredential } = require("@azure/eventgrid");
const { DefaultAzureCredential } = require("@azure/identity");
const utils = require("../utils");
require("dotenv").config();

let logger = utils.getLogger();

const EventGridClientFactory = (() => {
    let clients = {};
    let eventSchema = "EventGrid"
  
    const createInstance = (endpoint) => {
      logger.info(`HERE IS CLI ID: ${process.env.AZURE_CLIENT_ID}`)
      return new EventGridPublisherClient(endpoint, eventSchema, new DefaultAzureCredential());
    };
  
    return {
      getClient: (dataType) => {
        const endpoint = process.env.EVENT_GRID_CANDLES_SUB_ENDPOINT;
        if (!clients[dataType]) {
          clients[dataType] = createInstance(endpoint);
        }
        return clients[dataType];
      },
    };
})();

function createEvent(id, type, data){
 return {id: `${id}`, eventType: type, data: data, dataVersion: "1.0", subject: "Subject", eventTime: new Date().toISOString()}
};

async function publishEvent(event) {
    const client = EventGridClientFactory.getClient("candle");
    try { 
        await client.send([event]);
        logger.info(`${event["eventType"]} event published successfully.`); 
    } catch (error) {
        logger.error(`${event["eventType"]} error publishing event: ${error}`);
    }
}

module.exports = {createEvent, publishEvent}