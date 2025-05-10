import subscribeToWebsocketPublisher from "../../websocket/websocket_subscriber";
import { useEffect, useRef, useState } from "react";
import * as React from "react";
import Box from "@mui/material/Box";
import {Typography} from "@mui/material";
import Header from "./Header";
import DashboardLayout from "./DashboardLayout";

async function fetchConfigs(setAvailableTickers, setTimeRanges) {
    try {
        const [candleRes, historicalRes] = await Promise.all([
            fetch("/api/config?configName=candle_data&configFileName=events.yaml"),
            fetch("/api/config?configName=historical_candle_data&configFileName=events.yaml")
        ]);
        const candleDataConfig = await candleRes.json();
        const historicalCandleConfig = await historicalRes.json();

        setAvailableTickers(candleDataConfig.product_ids || []);
        setTimeRanges(historicalCandleConfig.time_ranges || []);
    } catch (err) {
        console.error("Error fetching config:", err);
    }
}

function initializeDefaults(availableTickers, timeRanges, ticker, timeRange, setTicker, setTimeRange) {
    if (availableTickers.length > 0 && ticker === null) {
        setTicker(availableTickers[0]);
    }
    if (timeRanges.length > 0 && timeRange === null) {
        setTimeRange(timeRanges[0].value);
    }
}

export default function RealTimeGrid() {
    const [data, setData] = useState(null);
    const timeScaleRef = useRef(null);
    const [availableTickers, setAvailableTickers] = useState([]);
    const [timeRanges, setTimeRanges] = useState([]);
    const [ticker, setTicker] = useState(null);
    const [timeRange, setTimeRange] = useState(null);

    // Fetch config from backend
    useEffect(() => {
        fetchConfigs(setAvailableTickers, setTimeRanges);
    }, []);

    // setting default ticker and time range
    useEffect(() => {
        initializeDefaults(availableTickers, timeRanges, ticker, timeRange, setTicker, setTimeRange);
    }, [availableTickers, timeRanges, ticker, timeRange]);

    // Fetch initial snapshot of data from cache
    useEffect(() => {
        fetch(`/api/latestAnalytics?ticker=${ticker}&range=${timeRange}`)
            .then(res => res.json())
            .then(setData);
    }, [ticker, timeRange]);

    // Listen for live updates
    subscribeToWebsocketPublisher(`${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`, (receivedData)=>{
        if (receivedData.id[0] === ticker){
            setData(receivedData)
        }
    });

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
            {/* Selector Panel */}
            <Header availableTickers={availableTickers} ticker={ticker} setTicker={setTicker} timeRanges={timeRanges} timeRange={timeRange} setTimeRange={setTimeRange}></Header>

            {/* Charts */}
            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                Real Time Analysis
            </Typography>
            <DashboardLayout data={data} ticker={ticker} timeScaleRef={timeScaleRef}/>
        </Box>
    );
}
