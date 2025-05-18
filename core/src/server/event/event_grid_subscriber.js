const {getLogger, convertGmtToUKLocal} = require("../utils");
const {broadcastToClients} = require('../websocket/websocket_publisher');
const {insertDBAnalytics, insertDBAnalyticsBatch, readDBAnalytics} = require("../db/candle_analytics_cache");
const {EventType} = require("./model/EventType");

const logger = getLogger();

let bufferStore={};
const DELAY_THRESHOLD = 10;
const BUFFER_SIZE_THRESHOLD = 5;

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
        if (Object.keys(bufferStore).length >= BUFFER_SIZE_THRESHOLD) {
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

function processEvent(data) {
    for (const event of data) {
        const eventID = event.id;
        if (!eventID) {
            logger.warn("Attempted to process received event: EventID missing");
            continue;
        }
        const eventType = event.eventType;
        if (!eventType){
            logger.warn("Attempted to process received event: EventType missing");
            continue;
        }

        logger.info(`Processing received event [EventType: ${eventType}, EventId: ${eventID}]`);
        const now = Date.now();
        event.receivedAt = now;

        let receivedData = event.data;
        let cachedData = {};
        if (eventType===EventType.CANDLE_ANALYTICS_BATCH) {
            logger.info(`Immediate processing: skipping buffer for batched data event [Event I.D: ${eventID}]`)
            if (receivedData.length === 0) {
                logger.warn(`Received empty array for event.data [EventId: ${eventID}]`);
                continue;
            }

            for (const candle of receivedData) {
                if (candle?.time) {
                    candle.time = convertGmtToUKLocal(candle.time);
                } else {
                    logger.warn(`Candle missing time field: ${JSON.stringify(candle)}`);
                }
            }

            insertDBAnalyticsBatch(receivedData);
            cachedData = readDBAnalytics(receivedData[0]?.id, 0, receivedData[0]?.granularity_mins);
            broadcastToClients(cachedData, event.eventType, event.id);
        } else if (eventType===EventType.CANDLE_ANALYTICS) {
            bufferStore[eventID] = event;
            const flushedEvent = flushBuffer(now);
            if (!flushedEvent) continue;

            receivedData = flushedEvent.data;
            if (!receivedData.id || !receivedData.time) {
                logger.warn(`Invalid candle object: missing id or time [EventId: ${eventID}]`);
                continue;
            }

            receivedData.time = convertGmtToUKLocal(receivedData.time);
            insertDBAnalytics(receivedData);
            cachedData = readDBAnalytics(receivedData.id, 0, receivedData.granularity_mins);
            broadcastToClients(cachedData, flushedEvent.eventType, flushedEvent.id);
        } else {
            logger.warn(`Unexpected flushed data format: ${typeof receivedData} [EventId: ${eventID}]`);
            continue;
        }
    }
}


module.exports = {handleEvents}
