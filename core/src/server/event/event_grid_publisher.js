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
        logger.info(`EventType:${event["eventType"]},EventID:${event["id"]} - event published successfully.`);
    } catch (error) {
        logger.error(`EventType:${event["eventType"]},EventID:${event["id"]} - error publishing event: ${error}`);
    }
}

module.exports = {createEvent, publishEvent}