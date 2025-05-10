import { useEffect } from "react";

const subscribeToWebsocketPublisher = (url, dataHandler) => {
    useEffect(() => {
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
        };
    }, [url, dataHandler]);
};

export default subscribeToWebsocketPublisher;
