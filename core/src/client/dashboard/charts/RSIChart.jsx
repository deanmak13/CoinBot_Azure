import React, { useEffect, useRef } from 'react';
import { createChart, LineSeries, LineStyle } from 'lightweight-charts';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ChartDescription } from "../components/chart-components/ChartDescription";
import ChartSummaryStack from "../components/chart-components/ChartSummaryStack";

const RSIChart = ({ data, timeScaleRef, summaryValue }) => {
    const theme = useTheme();
    const chartContainerRef = useRef();
    const chartRef = useRef();

    useEffect(() => {
        if (!data?.time || !data?.RSI) return;

        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 300,
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
                autoScale: false,
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: false,
            },
        });

        chartRef.current = chart;
        const timeData = data.time;

        // Sync X-axis (time) across charts
        const timeScale = chart.timeScale();
        if (!timeScaleRef.current) {
            timeScaleRef.current = timeScale;
        } else {
            timeScale.subscribeVisibleTimeRangeChange((range) => {
                if (range) timeScaleRef.current.setVisibleRange(range);
            });
        }

        // Main RSI Line
        const rsiSeries = chart.addSeries(LineSeries, {
            color: theme.palette.primary.main,
            lineWidth: 1.5,
            priceLineVisible: false,
        });

        const rsiValues = timeData.map((time, i) => ({
            time,
            value: data.RSI[i],
        })).filter(p => p.value !== undefined && !isNaN(p.value));

        rsiSeries.setData(rsiValues);

        // Invisible Y-bounds to lock scale
        chart.addSeries(LineSeries, {
            color: theme.palette.background.default,
            lineWidth: 0.01,
            priceLineVisible: false,
        }).setData(timeData.map((time) => ({ time, value: 0 })));

        chart.addSeries(LineSeries, {
            color: theme.palette.background.default,
            lineWidth: 0.01,
            priceLineVisible: false,
        }).setData(timeData.map((time) => ({ time, value: 100 })));

        // Overbought line at 70
        chart.addSeries(LineSeries, {
            color: theme.palette.error.main,
            lineStyle: LineStyle.Dashed,
            lineWidth: 2,
            priceLineVisible: false,
        }).setData(timeData.map((time) => ({ time, value: 70 })));

        // Oversold line at 30
        chart.addSeries(LineSeries, {
            color: theme.palette.success.main,
            lineStyle: LineStyle.Dashed,
            lineWidth: 2,
            priceLineVisible: false,
        }).setData(timeData.map((time) => ({ time, value: 30 })));

        // Scroll to most recent data
        timeScale.scrollToPosition(0, true);

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
                <Typography component="h2" variant="subtitle2" sx={{ color: 'text.primary' }} gutterBottom>
                    Relative Strength Index (RSI)
                </Typography>
                <ChartSummaryStack latestValue={summaryValue}/>
                <ChartDescription>
                    Measures the speed and magnitude of a security's recent price changes to detect overbought or oversold conditions.
                </ChartDescription>
                <Box ref={chartContainerRef} />
            </CardContent>
        </Card>
    );
};

export default RSIChart;
