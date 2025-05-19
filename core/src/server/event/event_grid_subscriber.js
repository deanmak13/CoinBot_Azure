const {getLogger, convertGmtToUKLocal} = require("../utils");
const {broadcastToClients} = require('../websocket/websocket_publisher');
const {insertDBAnalytics, insertDBAnalyticsBatch, readDBAnalytics} = require("../db/candle_analytics_cache");
const {EventType} = require("./model/EventType");
const { Mutex } = require('async-mutex');
const dbMutex = new Mutex();

const logger = getLogger();

let bufferStore = {};
const processedEventIds = new Set();
const DELAY_THRESHOLD = 2;
const BUFFER_SIZE_THRESHOLD = 5;

// === Batch processing queue + worker pool ===
const batchQueue = [];
const BATCH_WORKER_COUNT = 4;

function enqueueBatchEvent(event) {
    batchQueue.push(event);
}

async function batchWorker() {
    while (true) {
        if (batchQueue.length === 0) {
            await new Promise(resolve => setTimeout(resolve, 50)); // Wait 50ms if queue is empty
            continue;
        }

        const event = batchQueue.shift();
        try {
            const eventID = event.id;
            const receivedData = event.data;

            if (!Array.isArray(receivedData) || receivedData.length === 0) {
                logger.warn(`Skipped invalid or empty batch payload [EventID: ${eventID}]`);
                continue;
            }

            for (const candle of receivedData) {
                if (candle?.time) {
                    candle.time = convertGmtToUKLocal(candle.time);
                } else {
                    logger.warn(`Candle missing time field: ${JSON.stringify(candle)}`);
                }
            }

            logger.info(`BatchWorker processing batch size: ${receivedData.length} [EventID: ${eventID}]`);
            await dbMutex.runExclusive(() => {
                insertDBAnalyticsBatch(receivedData);
            });
            const cachedData = readDBAnalytics(receivedData[0]?.id, 0, receivedData[0]?.granularity_mins);
            broadcastToClients(cachedData, event.eventType, event.id);
        } catch (err) {
            logger.error(`BatchWorker failed to process batch event: ${err}`);
        }
    }
}

function startBatchWorkers() {
    for (let i = 0; i < BATCH_WORKER_COUNT; i++) {
        batchWorker(); // Start worker (no need to wrap in async IIFE)
        logger.info(`Started BatchWorker #${i + 1}`);
    }
}

// === Main Event Handler ===

function handleEvents(req, res) {
    try {
        const data = req.body;
        let validationResponse = validateEventGrid(req);
        if (validationResponse) {
            logger.info(`Responding to Event Grid validation request`);
            res.status(200).json(validationResponse);
            return;
        }

        processEvent(data);
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
        return { validationResponse: validationCode };
    }
    return null;
}

function flushBuffer(now) {
    if (bufferStore) {
        const sortedIDs = Object.keys(bufferStore).sort();
        logger.debug(`Buffer size: ${sortedIDs.length}, Sorted IDs: ${sortedIDs}`);

        for (let eventID of sortedIDs) {
            const event = bufferStore[eventID];
            if (!event) continue;

            let elapsedSecondsInBuffer = Math.floor((now - event.receivedAt) / 1000);
            if (elapsedSecondsInBuffer >= DELAY_THRESHOLD) {
                logger.info(`Flushing event from buffer [Event I.D: ${eventID}] (time threshold met, waited ${elapsedSecondsInBuffer} seconds)`);
                delete bufferStore[eventID];
                return event;
            }
        }

        if (Object.keys(bufferStore).length >= BUFFER_SIZE_THRESHOLD) {
            let oldestEventID = sortedIDs[0];
            const event = bufferStore[oldestEventID];
            if (event) {
                logger.info(`Flushing event from buffer [Event I.D: ${oldestEventID}] (size threshold met, buffer size: ${Object.keys(bufferStore).length})`);
                delete bufferStore[oldestEventID];
                return event;
            }
        }
    }
}

async function processEvent(data) {
    for (const event of data) {
        const eventID = event.id;
        if (!eventID) {
            logger.warn("Attempted to process received event: EventID missing");
            continue;
        }
        const eventType = event.eventType;
        if (!eventType) {
            logger.warn("Attempted to process received event: EventType missing");
            continue;
        }

        if (processedEventIds.has(eventID)) {
            logger.warn(`Duplicate event received and skipped [EventId: ${eventID}]`);
            continue;
        }
        processedEventIds.add(eventID);

        logger.info(`Processing received event [EventType: ${eventType}, EventId: ${eventID}]`);
        const now = Date.now();
        event.receivedAt = now;

        let receivedData = event.data;
        let cachedData = {};

        if (eventType === EventType.CANDLE_ANALYTICS_BATCH) {
            logger.info(`Immediate processing: skipping buffer for batched data event [Event I.D: ${eventID}]`);
            logger.info(`Handling batch size: ${receivedData.length} [EventID: ${eventID}]`);
            enqueueBatchEvent(event); // Queue for workers to process
        } else if (eventType === EventType.CANDLE_ANALYTICS) {
            bufferStore[eventID] = event;
            const flushedEvent = flushBuffer(now);
            if (!flushedEvent) continue;

            receivedData = flushedEvent.data;
            if (!receivedData.id || !receivedData.time) {
                logger.warn(`Invalid candle object: missing id or time [EventId: ${eventID}]`);
                continue;
            }

            receivedData.time = convertGmtToUKLocal(receivedData.time);
            await dbMutex.runExclusive(() => {
                insertDBAnalytics(receivedData);
            });
            cachedData = readDBAnalytics(receivedData.id, 0, receivedData.granularity_mins);
            broadcastToClients(cachedData, flushedEvent.eventType, flushedEvent.id);
        } else {
            logger.warn(`Unexpected flushed data format: ${typeof receivedData} [EventId: ${eventID}]`);
            continue;
        }
    }
}

startBatchWorkers(); // Call this on module load

module.exports = { handleEvents };
