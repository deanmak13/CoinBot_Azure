const { EventGridPublisherClient, AzureKeyCredential } = require("@azure/eventgrid");
const utils = require("../utils");

const endpoint = "<your-event-grid-topic-endpoint>";
const apiKey = "<your-access-key>";

let logger = utils.getLogger();

const EventGridClientSingleton = (() => {
    let instance;
  
    const createInstance = () => {
      const endpoint = "https://<your-eventgrid-endpoint>.eventgrid.azure.net";
      const apiKey = "<your-api-key>";
      return new EventGridPublisherClient(endpoint, "EventGridSchema", new AzureKeyCredential(apiKey));
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

function createEvent(id, type, data){
 return {id: id, eventType: type, data: data, dataVersion: "1.0", subject: "Subject", eventTime: new Date().toISOString()}
};

async function publishEvent(event) {
    const client = EventGridClientSingleton.getInstance();
    try { 
        await client.sendEvent(event);
        logger.info("{} event published successfully.", event["eventType"]); 
    } catch (error) {
        logger.error("{} error publishing event: {}", event["eventType"], error);
    }
}

module.exports = {createEvent, publishEvent}