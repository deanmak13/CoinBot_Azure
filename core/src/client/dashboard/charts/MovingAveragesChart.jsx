import React, { useEffect, useRef, useState } from 'react';
import { createChart, LineSeries, LineStyle } from 'lightweight-charts';
import {
    Card, CardContent, Box, FormGroup, FormControlLabel, Checkbox, Typography
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ChartTitle from "../components/chart-components/ChartTitle";
import { ChartDescription } from "../components/chart-components/ChartDescription";
import ChartSummaryStack from "../components/chart-components/ChartSummaryStack";

const indicatorMetadata = {
    SMA: { label: 'SMA', color: 'primary.main', alwaysVisible: true },
    EMA: { label: 'EMA', color: 'success.main', alwaysVisible: true },
    WMA: { label: 'WMA', color: 'secondary.main' },
    KAMA: { label: 'KAMA', color: 'warning.main' },
    BBAND_upper: { label: 'BB Upper', color: 'error.light', dashed: true },
    BBAND_middle: { label: 'BB Middle', color: 'info.main' },
    BBAND_lower: { label: 'BB Lower', color: 'error.dark', dashed: true },
};

const MovingAveragesChart = ({ data, timeScaleRef, summaryValue, ticker = "N/A"  }) => {
    const theme = useTheme();
    const chartContainerRef = useRef();
    const chartRef = useRef();
    const [visibleIndicators, setVisibleIndicators] = useState(['SMA', 'EMA']);

    const toggleIndicator = (key) => {
        const meta = indicatorMetadata[key];
        if (meta.alwaysVisible) return;
        setVisibleIndicators(prev =>
            prev.includes(key) ? prev.filter(i => i !== key) : [...prev, key]
        );
    };

    useEffect(() => {
        if (!data?.time || !data?.SMA || !data?.EMA) return;

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

        const timeData = data.time;
        const baseOptions = { lineWidth: 2, priceLineVisible: false };

        visibleIndicators.forEach((key) => {
            const meta = indicatorMetadata[key];
            if (!data[key]) return;
            const [palette, shade] = meta.color.split(".");
            const color = theme.palette[palette][shade];
            chart.addSeries(LineSeries, {
                ...baseOptions,
                color,
                lineStyle: meta.dashed ? LineStyle.Dashed : LineStyle.Solid,
            }).setData(
                timeData.map((time, i) => ({ time, value: data[key][i] }))
                    .filter(p => p.value > 0)
            );
        });

        timeScale.scrollToPosition(0, true);

        return () => {
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [data, theme, visibleIndicators, timeScaleRef]);

    return (
        <Card variant="outlined" sx={{ width: '100%' }}>
            <CardContent>
                <ChartTitle>Moving Averages</ChartTitle>
                <ChartSummaryStack latestValue={summaryValue} chipLabel={ticker}/>
                <ChartDescription>
                    Helps to level the price data over a specified period by creating a constantly updated average price.
                </ChartDescription>

                <FormGroup row sx={{ mb: 1 }}>
                    {Object.entries(indicatorMetadata).map(([key, meta]) => {
                        const [palette, shade] = meta.color.split(".");
                        const color = theme.palette[palette][shade];
                        return (
                            <FormControlLabel
                                key={key}
                                control={
                                    <Checkbox
                                        checked={visibleIndicators.includes(key)}
                                        disabled={meta.alwaysVisible}
                                        onChange={() => toggleIndicator(key)}
                                        sx={{ color: color, '&.Mui-checked': { color: color } }}
                                    />
                                }
                                label={meta.label}
                            />
                        );
                    })}
                </FormGroup>

                <Box ref={chartContainerRef} />
            </CardContent>
        </Card>
    );
};

export default MovingAveragesChart;
