import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ChartTitle from "../components/chart-components/ChartTitle";
import { ChartDescription } from "../components/chart-components/ChartDescription";

const CandlestickChart = ({ data, timeScaleRef }) => {
    const theme = useTheme();
    const chartContainerRef = useRef();
    const chartRef = useRef();

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

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: theme.palette.success.main,
            downColor: theme.palette.error.main,
            borderUpColor: theme.palette.success.main,
            borderDownColor: theme.palette.error.main,
            wickUpColor: theme.palette.success.main,
            wickDownColor: theme.palette.error.main,
        });

        const candleData = data.time.map((time, i) => ({
            time,
            open: data.open[i],
            high: data.high[i],
            low: data.low[i],
            close: data.close[i],
        })).filter(c => Object.values(c).every(v => v !== undefined && !isNaN(v)));

        candleSeries.setData(candleData);

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
                <ChartTitle>Candlestick Overview</ChartTitle>
                <ChartDescription>
                    Displays open, high, low, and close price action to visualize market structure.
                </ChartDescription>
                <Box ref={chartContainerRef} />
            </CardContent>
        </Card>
    );
};

export default CandlestickChart;
