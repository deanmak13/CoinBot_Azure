import subscribeToWebsocketPublisher from "../../websocket/websocket_subscriber";
import { useEffect, useRef, useState } from "react";
import * as React from "react";
import Box from "@mui/material/Box";
import {Typography} from "@mui/material";
import DashboardLayout from "./DashboardLayout";
import Stack from "@mui/material/Stack";
import SelectMenu from "./SelectMenu";

async function fetchConfigs(setAvailableTickers, setTimeRanges, setTicker, setTimeRange) {
    try {
        const [candleRes, historicalRes] = await Promise.all([
            fetch("/api/config?configName=candle_data&configFileName=events.yaml"),
            fetch("/api/config?configName=historical_candle_data&configFileName=events.yaml")
        ]);

        const candleDataConfig = await candleRes.json();
        const historicalCandleConfig = await historicalRes.json();

        const availableTickers = candleDataConfig.product_ids || [];
        const timeRangesRaw = historicalCandleConfig.time_ranges || [];
        const timeRanges = timeRangesRaw.map(({ label, value }) => ({ label, value }));

        setAvailableTickers(availableTickers);
        setTimeRanges(timeRanges);

        // Use the local vars, not the React state vars
        if (availableTickers.length > 0) setTicker(availableTickers[0]);
        if (timeRanges.length > 0) setTimeRange(timeRanges[0].value);

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
    const [activeStreaming, setActiveStreaming] = useState(true);

    // Fetch config from backend
    useEffect(() => {
        fetchConfigs(setAvailableTickers, setTimeRanges, setTicker, setTimeRange);
    }, []);

    // setting default ticker and time range. ensuring they've been fetched first
    useEffect(() => {
        const ready =
            Array.isArray(availableTickers) && availableTickers.length > 0 &&
            Array.isArray(timeRanges) && timeRanges.length > 0 &&
            ticker != null && timeRange != null;

        if (ready) {
            initializeDefaults(availableTickers, timeRanges, ticker, timeRange, setTicker, setTimeRange);
        }
    }, [availableTickers, timeRanges, ticker, timeRange]);

    // Fetch initial snapshot of data from cache
    useEffect(() => {
        if (ticker && timeRange) {
            fetch(`/api/latestAnalytics?ticker=${ticker}&range=${timeRange}`)
                .then(res => res.json())
                .then(res => {
                    setData(res.data);
                    setActiveStreaming(res.activeStreaming);
                })
                .catch(err => console.error("Failed to fetch analytics:", err));
        }
    }, [ticker, timeRange]);

    // Listen for live updates
    useEffect(() => {
        const wsUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;

        // If activeStreaming === true: only allow 5-minute data. If activeStreaming === false: reject 5-minute data, allow others.
        // This prevents real time data from overriding historical data at granularity level
        // Includes null/undefined safety on array access
        const unsubscribe = subscribeToWebsocketPublisher(wsUrl, (receivedData) => {
            const granularity = receivedData.granularity_mins?.[0];
            const tickerMatch = receivedData.id?.[0] === ticker;

            if (!tickerMatch || granularity == null) return;

            if (activeStreaming && granularity === 5) {
                setData(receivedData);
            } else if (!activeStreaming && granularity !== 5) {
                setData(receivedData);
            }
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [ticker, activeStreaming]);

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
            {/* Charts */}
            <Stack
                direction="row"
                sx={{
                    display: { xs: 'none', md: 'flex' },
                    width: '100%',
                    alignItems: { xs: 'flex-start', md: 'center' },
                    justifyContent: 'space-between',
                    maxWidth: { sm: '100%', md: '1700px' },
                    pt: 1.5,
                }}
                spacing={2}
            >
            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                Real Time Analysis
            </Typography>
            <SelectMenu availableTickers={availableTickers} ticker={ticker} setTicker={setTicker} timeRange={timeRange} setTimeRange={setTimeRange} timeRanges={timeRanges} ></SelectMenu>
            </Stack>
            <DashboardLayout data={data} ticker={ticker} timeScaleRef={timeScaleRef}/>
        </Box>
    );
}
