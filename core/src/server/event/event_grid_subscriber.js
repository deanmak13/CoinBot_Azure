const {getLogger, convertGmtToLocal} = require("../utils");
const {broadcastToClients} = require('../websocket/websocket_publisher');
const {insertDBAnalytics, readDBAnalytics} = require("../db/candle_analytics_cache");

logger = getLogger();

let bufferStore={};
const DELAY_THRESHOLD = 2;
const BUFFER_SIZE_THRESHOLD = 2;

function handleEvents(req, res){
    try{
        const data = req.body;
        let validationResponse  = validateEventGrid(req);
        if (validationResponse ){
            logger.info(`Responding to Event Grid validation request`);
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
            let elapsedSecondsInBuffer = Math.floor((now - event.receivedAt) / 1000);
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
    for (const event of data){
        const eventID = event.id;
        if (event.id) {
            logger.info(`Processing received event [EventType: ${event.eventType},EventId: ${eventID}]`);
            let now = Date.now();
            event.receivedAt = now;
            event.data.time = convertGmtToLocal(event.data.time)
            bufferStore[eventID] = event;
            const flushedEvent = flushBuffer(now);
            if (flushedEvent) {
                insertDBAnalytics(flushedEvent.data);
                const storedData = readDBAnalytics(event.data.id, 0);
                broadcastToClients(storedData, flushedEvent.eventType, flushedEvent.id)
            }
            return
        }
    }
    logger.warn("Attempted to process received event: EventID missing")
}

module.exports = {handleEvents}
