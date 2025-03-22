const utils = require("../utils");
const {broadcastToClients} = require('../websocket/websocket_publisher');
const bodyParser = require("express");
const {insertDBAnalytics, readDBAnalytics} = require("../db/candle_analytics_cache");

logger = utils.getLogger();

let bufferStore={};
const DELAY_THRESHOLD = 5;
const BUFFER_SIZE_THRESHOLD = 10;

async function startEventGridListener(expressApp){
    expressApp.use(bodyParser.json());
    const candleAnalyticsSubEndPoint = utils.getConfig("candle_analytics", "events.yaml")['event_grid.subscription_endpoint'];
    const eventGridport = utils.getConfig("candle_analytics", "events.yaml")["event_grid.port"];
    expressApp.post(candleAnalyticsSubEndPoint, (handleEvents));
    expressApp.listen(eventGridport, () => {logger.info(`EventGridSubscriber subscribed to endpoint: ${candleAnalyticsSubEndPoint}`);
    }).on('error', (err) => {
        logger.error(`Failed to start listening for EventGridSubscriber: ${err.message}`);
        process.exit(1);
    });
}

function handleEvents(req, res){
    try{
        const data = req.body;
        let validationResponse  = validateEventGrid(req);
        if (validationResponse ){
            res.status(200).json(validationResponse)
            return;
        }
        processEvent(data)
        res.status(200).send({ success: true });
    } catch (error) {
        logger.error(`Error handling event: ${error}`);
        res.status(400).send({ success: false });
    }
}

function validateEventGrid(req) {
    if (req.headers['aeg-event-type'] === 'SubscriptionValidation') {
        let validationEvent = req.body[0];
        let validationCode = validationEvent.data.validationCode;
        return {validationResponse: validationCode};
    }
    return null;
}

function flushBuffer(now){
    if (bufferStore){
        const sortedIDs = Object.keys(bufferStore).sort();
        logger.debug(`Buffer size: ${sortedIDs.length}, Sorted IDs: ${sortedIDs}`);

        // Option 1: Check for any event that has been waiting longer than the delay threshold
        for (let eventID of sortedIDs){
            const event = bufferStore[eventID];
            if (!event) {
                continue;
            }
            let elapsedSecondsInBuffer =  (((now - event.receivedAt) % 60000) / 1000).toFixed(0);
            if (elapsedSecondsInBuffer >= DELAY_THRESHOLD){
                logger.info(`Flushing event from buffer [Event I.D: ${eventID}] (time threshold met, waited ${elapsedSecondsInBuffer} seconds)`);
                delete bufferStore[eventID];
                return event;
            }
        }

        // Option 2: If no stale event, but the buffer is too large, flush the event with the smallest ID.
        if (Object.keys(bufferStore).length > BUFFER_SIZE_THRESHOLD) {
            let oldestEventID = sortedIDs[0];
            const event = bufferStore[oldestEventID];
            if (event){
                logger.info(`Flushing event from buffer [Event I.D: ${oldestEventID}] (size threshold met, buffer size: ${Object.keys(bufferStore).length})`);
                delete bufferStore[oldestEventID];
                return event;
            }
        }
    }
}

function processEvent(data){
    const event = data[0];
    const eventID = event.id;
    if (event.id) {
        logger.info(`Processing received event [EventType: ${event.type},EventId: ${eventID}]`);
        let now = Date.now();
        event.receivedAt = now;
        bufferStore[eventID] = event;
        const flushedEvent = flushBuffer(now);
        if (flushedEvent) {
            insertDBAnalytics(flushedEvent.data);
            const storedData = readDBAnalytics();
            broadcastToClients(storedData, flushedEvent.eventType, flushedEvent.id)
        }
        return
    }
    logger.warn("Attempted to process received event: EventID missing")
}

module.exports = {startEventGridListener}
