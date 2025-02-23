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
        console.log(client.readyState);
        if (client.readyState === WebSocket.OPEN) {
            logger.info(`Pushing data to ${clients.size} Websocket Subscribers: [EventType:${dataType},EventID:${dataId}]`);
            client.send(message);
        }
    });
}

module.exports = {broadcastToClients}