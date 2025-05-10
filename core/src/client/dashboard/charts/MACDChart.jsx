import React, { useEffect, useRef } from 'react';
import { createChart, LineSeries, HistogramSeries } from 'lightweight-charts';
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Box } from '@mui/material';
import ChartTitle from "../components/chart-components/ChartTitle";
import { ChartDescription } from "../components/chart-components/ChartDescription";
import ChartSummaryStack from "../components/chart-components/ChartSummaryStack";

const MACDChart = ({ data, timeScaleRef, summaryValue }) => {
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
        const timeScale = chart.timeScale();
        if (!timeScaleRef.current) {
            timeScaleRef.current = timeScale;
        } else {
            timeScale.subscribeVisibleTimeRangeChange((range) => {
                if (range) timeScaleRef.current.setVisibleRange(range);
            });
        }

        const timeData = data.time;

        const macdSeries = chart.addSeries(LineSeries, {
            color: '#2196f3',
            lineWidth: 1.5,
            priceLineVisible: false,
        });
        macdSeries.setData(
            timeData.map((time, i) => ({ time, value: data.MACD[i] }))
                .filter(p => p.value !== undefined && !isNaN(p.value))
        );

        const signalSeries = chart.addSeries(LineSeries, {
            color: '#e040fb',
            lineWidth: 1.5,
            priceLineVisible: false,
        });
        signalSeries.setData(
            timeData.map((time, i) => ({ time, value: data.MACD_Signal[i] }))
                .filter(p => p.value !== undefined && !isNaN(p.value))
        );

        const histValues = data.MACD_History.filter(v => v !== undefined && !isNaN(v));
        const meanAbsHist = histValues.reduce((sum, v) => sum + Math.abs(v), 0) / histValues.length;
        const minThreshold = meanAbsHist * 0.15;

        const histogramSeries = chart.addSeries(HistogramSeries, {
            priceLineVisible: false,
            base: 0,
        });

        histogramSeries.setData(timeData.map((time, i) => {
            const value = data.MACD_History[i];
            return {
                time,
                value,
                color: value >= 0 ? theme.palette.success.main : theme.palette.error.main,
            };
        }).filter(p => Math.abs(p.value) >= minThreshold));

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
                <ChartTitle>
                    Moving Average Convergence/Divergence (MACD)
                </ChartTitle>
                <ChartSummaryStack latestValue={summaryValue}/>
                <ChartDescription>
                    Helps identify price trends, measure trend momentum, and identify entry points for buying or selling.
                </ChartDescription>
                <Box ref={chartContainerRef} />
            </CardContent>
        </Card>
    );
};

export default MACDChart;
