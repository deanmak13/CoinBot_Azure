import { useEffect } from "react";

export const subscribeToWebsocketPublisher = (url, dataHandler) => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
        console.log("Subscribed to WebSocket");
    };

    ws.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);
        console.debug("Received Data via websocket:", parsedData);
        dataHandler(parsedData);
    };

    ws.onclose = () => {
        console.log("WebSocket Disconnected");
    };

    return () => {
        ws.close();
        console.log("WebSocket manually closed");
    };
};


export default subscribeToWebsocketPublisher;
