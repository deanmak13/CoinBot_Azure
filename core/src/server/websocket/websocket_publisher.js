const { WebSocket, WebSocketServer } = require('ws');
const utils = require("../utils");
const http = require('http');

let logger = utils.getLogger();
let clients = new Set(); // Store connected clients

function setupWebSocketServer(app) {
    // Create an HTTP server using the Express app
    const server = http.createServer(app);

    // Create WebSocket server by passing the HTTP server
    const wss = new WebSocketServer({ server });

    logger.debug("WebSocket server attached to HTTP server");
    wss.on('connection', (ws) => {
        logger.info('WebSocket Subscriber connected');
        clients.add(ws);

        ws.on('close', () => { // Fix: This should be ws.on, not wss.on
            logger.info('WebSocket Subscriber disconnected');
            clients.delete(ws); // Fix: This should be ws, not wss
        });
    });

    return server;
}

function broadcastToClients(data, dataType, dataId) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            logger.info(`Broadcasting data to 1 of ${clients.size} Websocket Subscribers: [EventType:${dataType},EventID:${dataId}]`);
            return client.send(message);
        }
        logger.warn(`Client not in ready state, no data pushed: [EventType:${dataType},EventID:${dataId}]`);
    });
}

module.exports = { setupWebSocketServer, broadcastToClients };