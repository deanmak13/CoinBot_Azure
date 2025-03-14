import React from 'react';
import {Line} from "react-chartjs-2";
import { ChartOptions } from 'chart.js';
import annotationPlugin, { AnnotationOptions } from 'chartjs-plugin-annotation';
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import {useTheme} from "@mui/material/styles";
import { chartBackgroundPlugin } from './plugins/chartPlugins';
import {ChartDescription} from "../components/chart-components/ChartDescription";

const RSIChart = ({ data }) => {
    const theme = useTheme();

    const colorPalette = [
        theme.palette.primary["100"],
        theme.palette.primary["200"],
        theme.palette.primary["300"],
        theme.palette.primary["400"],
        theme.palette.primary["500"],
        theme.palette.primary["600"],
        theme.palette.primary["700"],
    ];

    if (!data || !data.RSI) return <p>Waiting For RSI Data...</p>;



    const chartData = {
        labels: data.RSI.map((_, index) => index), // Use index for now, but should be timestamp
        datasets: [
            {
                label: "RSI",
                data: data.RSI,
                borderColor: theme.palette.primary.main,
                borderWidth: 1,
                backgroundColor: 'transparent',
                pointRadius: 0,
                tension: 0.3,
                fill: false,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: { mode: 'index', intersect: false },
            annotation: {
                annotations: {
                    overboughtLine: {
                        type: 'line',
                        yMin: 70,
                        yMax: 70,
                        borderColor: theme.palette.error.main,
                        borderWidth: 1,
                        borderDash: [5, 5],
                    },
                    oversoldLine: {
                        type: 'line',
                        yMin: 30,
                        yMax: 30,
                        borderColor: theme.palette.success.main,
                        borderWidth: 1,
                        borderDash: [5, 5],
                    },
                },
            },
        },
        scales: {
            x: {
                ticks: { color: theme.palette.text.secondary },
                grid: { color: theme.palette.divider },
            },
            y: {
                min: 0,
                max: 100,
                grid: { drawBorder: false, color: theme.palette.divider },
                ticks: {
                    color: theme.palette.text.secondary,
                    callback: function (value) {
                        if (value === 30) return "Oversold";
                        if (value === 70) return "Overbought";
                        return value;
                    },
                },
            },
        },
    };

    return (
        <Card variant="outlined" sx={{ width: '100%' }}>
            <CardContent>
                <Typography component="h2" variant="subtitle2" sx={{ color: 'text.primary' }} gutterBottom>
                    Relative Strength Index (RSI)
                </Typography>
                <ChartDescription>
                    Measures the speed and magnitude of a security's recent price changes to detect overbought or oversold conditions in the price of that security.
                </ChartDescription>
                <Line data={chartData} options={options} plugins={[chartBackgroundPlugin(theme)]}/>
            </CardContent>
        </Card>
    );
};

export default RSIChart;