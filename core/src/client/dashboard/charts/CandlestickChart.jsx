import React, {useEffect, useRef, useState} from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import {Card, CardContent, Box, Typography, Chip} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ChartTitle from "../components/chart-components/ChartTitle";
import { ChartDescription } from "../components/chart-components/ChartDescription";
import Stack from "@mui/material/Stack";

const CandlestickChart = ({ data, timeScaleRef, ticker = "N/A" }) => {
    const theme = useTheme();
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const [latestPrice, setLatestPrice] = useState(null);

    useEffect(() => {
        if (!data?.time || !data?.open || !data?.high || !data?.low || !data?.close) return;

        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
            layout: {
                background: { type: 'solid', color: theme.palette.background.default },
                textColor: theme.palette.text.primary,
                attributionLogo: false,
            },
            grid: {
                vertLines: { visible: true, color: theme.palette.divider },
                horzLines: { visible: true, color: theme.palette.divider },
            },
            rightPriceScale: {
                borderVisible: false,
                scaleMargins: { top: 0.05, bottom: 0.05 },
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: false,
            },
        });

        chartRef.current = chart;

        const timeScale = chart.timeScale();
        if (!timeScaleRef.current) {
            timeScaleRef.current = timeScale;
        } else {
            timeScale.subscribeVisibleTimeRangeChange((range) => {
                if (range) timeScaleRef.current.setVisibleRange(range);
            });
        }

        // prepare Candlestickseries for data
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: theme.palette.success.main,
            downColor: theme.palette.error.main,
            borderUpColor: theme.palette.success.main,
            borderDownColor: theme.palette.error.main,
            wickUpColor: theme.palette.success.main,
            wickDownColor: theme.palette.error.main,
        });

        // format data
        const candleData = data.time.map((time, i) => ({
            time,
            open: data.open[i],
            high: data.high[i],
            low: data.low[i],
            close: data.close[i],
        })).filter(c => Object.values(c).every(v => v !== undefined && !isNaN(v)));

        // Set the data to the chart
        candleSeries.setData(candleData);

        // Update latest price if we have data
        if (candleData.length > 0) {
            setLatestPrice(candleData[candleData.length - 1].close);
        }

        timeScale.scrollToPosition(0, true); // scroll to latest candle

        return () => {
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [data, theme, timeScaleRef]);

    return (
        <Card variant="outlined" sx={{ width: '100%' }}>
            <CardContent>
                <ChartTitle>Candle</ChartTitle>
                <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{
                        alignContent: { xs: 'center', sm: 'flex-start' },
                        alignItems: 'center', // Changed from 'left' for better vertical alignment
                        mb: 1 // Added margin bottom for spacing
                    }}
                >
                    <Typography
                        component="h2"
                        variant="h4"
                        sx={{
                            color: (theme) => theme.palette.text.primary,
                        }}
                    >
                        {latestPrice !== null ? "$" + latestPrice.toLocaleString() : "N/A"}
                    </Typography>
                    <Chip
                        size="small"
                        label={ticker}
                        sx={{ ml: 1 }} // Added margin left for spacing
                    />
                </Stack>
                <ChartDescription>
                    Displays open, high, low, and close price action to visualize market structure.
                </ChartDescription>
                <Box ref={chartContainerRef} />
            </CardContent>
        </Card>
    );
};

export default CandlestickChart;