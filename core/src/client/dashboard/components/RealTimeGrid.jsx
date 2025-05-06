import MovingAveragesChart from "../charts/MovingAveragesChart";
import MACDChart from "../charts/MACDChart";
import CandlestickChart from "../charts/CandlestickChart";
import RSIChart from "../charts/RSIChart";
import subscribeToWebsocketPublisher from "../../websocket/websocket_subscriber";
import { useEffect, useRef, useState } from "react";
import {getConfig} from "../../util";
import * as React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import {
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Paper
} from "@mui/material";

const candleConfig = getConfig("candle_data", "events.yaml")

const availableTickers = candleConfig["product_ids"];
const timeRanges = [
    { label: '1 day ago', value: '1d' },
    { label: '1 week ago', value: '1w' },
    { label: '1 month ago', value: '1mo' },
    { label: '3 months ago', value: '3mo' },
    { label: '6 months ago', value: '6mo' },
    { label: '1 year ago', value: '1y' },
];

export default function RealTimeGrid() {
    const [data, setData] = useState(null);
    const [ticker, setTicker] = useState('BTC-USD');
    const [timeRange, setTimeRange] = useState('1d');

    const timeScaleRef = useRef(null);

    // Fetch initial snapshot
    useEffect(() => {
        fetch(`/api/latestAnalytics?ticker=${ticker}&range=${timeRange}`)
            .then(res => res.json())
            .then(setData);
    }, [ticker, timeRange]);

    // Listen for live updates
    const liveData = subscribeToWebsocketPublisher(`${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`);
    useEffect(() => {
        if (liveData) setData(liveData);
    }, [liveData]);

    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
            {/* Selector Panel */}
            <Paper elevation={2} sx={{ mb: 2, p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 180 }}>
                    <InputLabel id="ticker-label">Select Ticker</InputLabel>
                    <Select
                        labelId="ticker-label"
                        value={ticker}
                        label="Select Ticker"
                        onChange={(e) => setTicker(e.target.value)}
                    >
                        {availableTickers.map((t) => (
                            <MenuItem key={t} value={t}>{t}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 180 }}>
                    <InputLabel id="time-label">Time Range</InputLabel>
                    <Select
                        labelId="time-label"
                        value={timeRange}
                        label="Time Range"
                        onChange={(e) => setTimeRange(e.target.value)}
                    >
                        {timeRanges.map(({ label, value }) => (
                            <MenuItem key={value} value={value}>{label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>

            {/* Charts */}
            <Grid container spacing={2} columns={12} sx={{ mb: (theme) => theme.spacing(2) }}>
                <Grid size={{ xs: 12, md: 12 }}>
                    <CandlestickChart data={data} timeScaleRef={timeScaleRef} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <MovingAveragesChart data={data} timeScaleRef={timeScaleRef} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <MACDChart data={data} timeScaleRef={timeScaleRef} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <RSIChart data={data} timeScaleRef={timeScaleRef} />
                </Grid>
            </Grid>
        </Box>
    );
}
