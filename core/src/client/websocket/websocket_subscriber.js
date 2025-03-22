import { useEffect, useState } from "react";

const subscribeToWebsocketPublisher = (url) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log("Subscribed to WebSocket");
        };

        ws.onmessage = (event) => {
            const parsedData = JSON.parse(event.data);
            console.debug("Received Data via websocket:", parsedData);
            setData(parsedData);
        };

        ws.onclose = () => {
            console.log("WebSocket Disconnected");
        };

        return () => {
            ws.close();
        };
    }, [url]);

    return data;
};

export default subscribeToWebsocketPublisher;
