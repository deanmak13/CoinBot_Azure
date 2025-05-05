import React, { useEffect, useRef } from 'react';
import { createChart, LineSeries, HistogramSeries } from 'lightweight-charts';
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Box } from '@mui/material';
import ChartTitle from "../components/chart-components/ChartTitle";
import { ChartDescription } from "../components/chart-components/ChartDescription";

const MACDChart = ({ data }) => {
    const theme = useTheme();
    const chartContainerRef = useRef();
    const chartRef = useRef();

    useEffect(() => {
        if (!data?.time || !data?.MACD || !data?.MACD_Signal || !data?.MACD_History) return;

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
                scaleMargins: { top: 0.2, bottom: 0.2 },
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: false,
            },
        });

        chartRef.current = chart;
        const timeData = data.time;

        const macdValues = timeData.map((time, i) => ({
            time,
            value: data.MACD[i],
        })).filter(p => p.value !== undefined && !isNaN(p.value));

        const signalValues = timeData.map((time, i) => ({
            time,
            value: data.MACD_Signal[i],
        })).filter(p => p.value !== undefined && !isNaN(p.value));

        const histRaw = data.MACD_History.filter(v => v !== undefined && !isNaN(v));
        const meanAbsHist = histRaw.reduce((sum, v) => sum + Math.abs(v), 0) / histRaw.length;
        const minThreshold = meanAbsHist * 0.15;

        const histogramData = timeData.map((time, i) => {
            const value = data.MACD_History[i];
            return {
                time,
                value,
                color: value >= 0 ? theme.palette.success.main : theme.palette.error.main,
            };
        }).filter(p => Math.abs(p.value) >= minThreshold);

        // Histogram first so it draws underneath
        const histogramSeries = chart.addSeries(HistogramSeries, {
            priceLineVisible: false,
            base: 0,
            // Optional: play with barWidth, histogramSpacing in CSS for tuning
        });
        histogramSeries.setData(histogramData);

        const macdSeries = chart.addSeries(LineSeries, {
            color: '#2196f3', // Blue
            lineWidth: 1.5,
            priceLineVisible: false,
        });
        macdSeries.setData(macdValues);

        const signalSeries = chart.addSeries(LineSeries, {
            color: '#e040fb', // Magenta/Purple
            lineWidth: 1.5,
            priceLineVisible: false,
        });
        signalSeries.setData(signalValues);

        chart.timeScale().fitContent();

        return () => {
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [data, theme]);

    return (
        <Card variant="outlined" sx={{ width: '100%' }}>
            <CardContent>
                <ChartTitle>
                    Moving Average Convergence/Divergence (MACD)
                </ChartTitle>
                <ChartDescription>
                    Helps identify price trends, measure trend momentum, and identify entry points for buying or selling.
                </ChartDescription>
                <Box ref={chartContainerRef} />
            </CardContent>
        </Card>
    );
};

export default MACDChart;
