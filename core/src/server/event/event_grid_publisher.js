const { EventGridPublisherClient, AzureKeyCredential } = require("@azure/eventgrid");
const { DefaultAzureCredential, EnvironmentCredential } = require("@azure/identity");
const utils = require("../utils");
const path = require('path');
const {EventType} = require("./model/EventType");
require("dotenv").config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });

let logger = utils.getLogger();

const EventGridClientFactory = (() => {
    let clients = {};
    let eventSchema = "EventGrid"

    const createInstance = (endpoint) => {
      return new EventGridPublisherClient(endpoint, eventSchema, new DefaultAzureCredential());
    };

    const getClient = (dataType) => {
        const endpoint = process.env.EVENT_GRID_TOPIC_URL;
        if (!clients[dataType]) {
            logger.info(`Instantiating ${dataType} EventGridPublisherClient`);
            clients[dataType] = createInstance(endpoint);
        }
        return clients[dataType];
    };
  
    return {
      getClient: getClient,
    };
})();

function createEvent(id, type, subject, data){
  return {id: `${id}`, eventType: type, data: data, dataVersion: "1.0", subject: subject, eventTime: new Date().toISOString()}
}

async function publishEvent(event) {
    const client = EventGridClientFactory.getClient(EventType.CANDLE);
    try {
        await client.send([event]);
        logger.info(`Published to EventGrid successfully [EventType:${event["eventType"]},EventID:${event["id"]}]`);
    } catch (error) {
        logger.error(`Error publishing to EventGrid [EventType:${event["eventType"]},EventID:${event["id"]}]: ${error}`);
    }
}

module.exports = {createEvent, publishEvent}