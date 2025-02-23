import { useEffect, useState } from "react";

const subscribeToWebsocketPublisher = (url) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log("Connected to WebSocket Publisher");
        };

        ws.onmessage = (event) => {
            const parsedData = JSON.parse(event.data);
            console.log("Received Data:", parsedData);
            setData(parsedData);
        };

        ws.onclose = () => {
            console.log("WebSocket Publisher Disconnected");
        };

        return () => {
            ws.close();
        };
    }, [url]);

    return data;
};

export default subscribeToWebsocketPublisher;
