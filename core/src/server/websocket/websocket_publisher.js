const {WebSocketServer } = require('ws');
const utils = require("../utils");

let logger = utils.getLogger();
const wss = new WebSocketServer({ port: 3001 });
logger.debug("WebSocket server started on port 3001");

let clients = new Set(); // Store connected clients

wss.on('connection', (ws) => {
    logger.info('WebSocket Subscriber connected');
    clients.add(ws);

    ws.on('close', () => {
        logger.info('WebSocket Subscriber disconnected');
        clients.delete(ws);
    });
});

function broadcastToClients(data, dataType, dataId) {
    const message = JSON.stringify(data);
    clients.forEach
    (client => {
        if (client.readyState === WebSocket.OPEN) {
            logger.info(`Broadcasting data to 1 of ${clients.size} Websocket Subscribers: [EventType:${dataType},EventID:${dataId}]`);
            return client.send(message);
        }
        logger.warn(`Client not in ready state, no data pushed: [EventType:${dataType},EventID:${dataId}]`)
    });
}

module.exports = {broadcastToClients}