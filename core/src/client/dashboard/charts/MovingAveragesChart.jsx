import React, { useEffect, useRef, useState } from 'react';
import {
    Card, CardContent, Box, FormGroup, FormControlLabel, Checkbox, Typography
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { createChart, LineSeries, LineStyle } from 'lightweight-charts';
import ChartTitle from "../components/chart-components/ChartTitle";
import { ChartDescription } from "../components/chart-components/ChartDescription";

const indicatorMetadata = {
    SMA: {
        label: 'SMA',
        color: 'primary.main',
        alwaysVisible: true,
        description: 'Simple Moving Average — a basic average over time.',
    },
    EMA: {
        label: 'EMA',
        color: 'success.main',
        alwaysVisible: true,
        description: 'Exponential Moving Average — reacts faster to price changes.',
    },
    WMA: {
        label: 'WMA',
        color: 'secondary.main',
        description: 'Weighted Moving Average gives more weight to recent data.',
    },
    KAMA: {
        label: 'KAMA',
        color: 'warning.main',
        description: 'Kaufman Adaptive Moving Average adjusts for volatility.',
    },
    BBAND_upper: {
        label: 'BB Upper',
        color: 'error.light',
        dashed: true,
        description: 'Upper Bollinger Band showing potential resistance.',
    },
    BBAND_middle: {
        label: 'BB Middle',
        color: 'info.main',
        description: 'Middle Bollinger Band — the baseline average.',
    },
    BBAND_lower: {
        label: 'BB Lower',
        color: 'error.dark',
        dashed: true,
        description: 'Lower Bollinger Band showing potential support.',
    },
};

const MovingAveragesChart = ({ data }) => {
    const theme = useTheme();
    const chartContainerRef = useRef();
    const chartRef = useRef(null);
    const [visibleIndicators, setVisibleIndicators] = useState(
        Object.keys(indicatorMetadata).filter(key => indicatorMetadata[key].alwaysVisible)
    );

    const toggleIndicator = (key) => {
        const { alwaysVisible } = indicatorMetadata[key];
        if (alwaysVisible) return;

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
        const baseOptions = { lineWidth: 2, priceLineVisible: false };
        const timeData = data.time;

        visibleIndicators.forEach((key) => {
            const meta = indicatorMetadata[key];
            if (!data[key]) return;

            const [palette, shade] = meta.color.split(".");
            const color = theme.palette[palette][shade];

            const series = chart.addSeries(LineSeries, {
                ...baseOptions,
                color,
                lineStyle: meta.dashed ? LineStyle.Dashed : LineStyle.Solid,
            });

            const cleanData = timeData.map((time, i) => ({
                time,
                value: data[key][i],
            })).filter(p => p.value > 0);

            series.setData(cleanData);
        });

        chart.timeScale().fitContent();

        return () => {
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [data, theme, visibleIndicators]);

    return (
        <Card variant="outlined" sx={{ width: '100%' }}>
            <CardContent>
                <ChartTitle>Moving Averages</ChartTitle>
                <ChartDescription>
                    Toggle indicators to better understand price movement patterns.
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

                {visibleIndicators.map((key) => (
                    indicatorMetadata[key]?.description && (
                        <Typography
                            key={key}
                            variant="caption"
                            sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}
                        >
                            • {indicatorMetadata[key].description}
                        </Typography>
                    )
                ))}

                <Box ref={chartContainerRef} />
            </CardContent>
        </Card>
    );
};

export default MovingAveragesChart;
