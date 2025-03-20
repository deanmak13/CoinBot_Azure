import React from 'react';
import {CandlestickSeries, createChart, createSeriesMarkers} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {useTheme} from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";

import ChartTitle from "../components/chart-components/ChartTitle";

const formatCandles = (data) => {
    if (!data || !data.time) return [];
    return data.time.map((t, i) => ({
        time: t,
        open: data.open[i],
        high: data.high[i],
        low: data.low[i],
        close: data.close[i],
        id: data.id[i],
    }));
};

// TODO: reevaluate the impact of this
const deduplicateCandles = (data) => {
    const unique = [];
    const seen = new Set();
    data.forEach((candle) => {
        if (!seen.has(candle.time)) {
            unique.push(candle);
            seen.add(candle.time);
        }
    });
    return unique;
};

const CandlestickChart = ({ data, patterns=[] }) => {
    const theme = useTheme();
    const chartContainerRef = useRef();
    const [summaryData, setSummaryData] = useState({});

    useEffect(() => {
        if (!data || !data.MACD || !data.MACD_Signal || !data.MACD_History) return;

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 300,
            layout: {
                attributionLogo: false,
                background: { type: 'solid', color: theme.palette.background.default },
                textColor: theme.palette.text.primary,
            },
            grid: {
                vertLines: {
                    visible: true,
                    color: theme.palette.divider,
                    style: 1,
                },
                horzLines: {
                    visible: true,
                    color: theme.palette.divider,
                    style: 1,
                },
            },
            rightPriceScale: { borderVisible: false },
            timeScale: { borderVisible: false },
        });
        const series = chart.addSeries(CandlestickSeries);
        const formattedCandles = formatCandles(data);
        const uniqueCandles = deduplicateCandles(formattedCandles);

        if (uniqueCandles.length > 1) {
            const firstTime = uniqueCandles[0].time;
            const secondTime = uniqueCandles[1].time;
            const timeInterval = secondTime - firstTime;

            chart.applyOptions({
                timeScale: {
                    barSpacing: Math.max(6, timeInterval / 500), // Adjust spacing based on interval
                    rightOffset: timeInterval / 100, // Ensures the chart has enough right space
                    timeVisible: true,
                    secondsVisible: timeInterval < 60, // Show seconds if interval < 1 minute
                }
            });
        }

        series.setData(uniqueCandles);
        setSummaryData(
            uniqueCandles.map((candle) => ({
                close: candle.close,
                ticker: candle.id,
            }))
        );

        patterns.forEach((pattern) => {
            createSeriesMarkers(series, [
                {
                    time: pattern.time,
                    position: "aboveBar",
                    color: pattern.type === "Hammer" ? theme.palette.error.main : theme.palette.primary.main,
                    shape: pattern.type === "Hammer" ? "arrowDown" : "arrowUp",
                    text: pattern.type,
                },
            ]);
        });

        return () => chart.remove();
    }, [data, patterns]);

    return (
        <Card variant="outlined" sx={{ width: '100%' }}>
            <CardContent>
                <ChartTitle>Candle</ChartTitle>
                <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{
                        alignContent: { xs: 'center', sm: 'flex-start' },
                        alignItems: 'left',
                    }}
                >
                    <Typography
                        component="h2"
                        variant="h4"
                        sx={{
                            color: (theme) => theme.palette.text.primary,
                        }}
                    >
                        {summaryData.length > 0 ? summaryData[summaryData.length - 1].close.toLocaleString() : "N/A"}
                    </Typography>
                    <Chip size="small" label={summaryData.length > 0 ? summaryData[summaryData.length - 1].ticker : "Ticker"} />
                </Stack>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Displays the high, low, open, and closing prices of a security for a specific period.
                </Typography>
                <Box ref={chartContainerRef} />
            </CardContent>
        </Card>
    );
};

export default CandlestickChart;