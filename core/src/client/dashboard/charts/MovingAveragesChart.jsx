import React from "react";
import { Line } from "react-chartjs-2";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import {useTheme} from "@mui/material/styles";
import { chartBackgroundPlugin } from './plugins/chartPlugins';

import ChartTitle from "../components/chart-components/ChartTitle";
import {ChartDescription} from "../components/chart-components/ChartDescription";

const MovingAveragesChart = ({ data }) => {
    const theme = useTheme();

    const colorPalette = [
        theme.palette.primary.main,     // SMA - Default primary color
        theme.palette.secondary.main,   // WMA - Default secondary color
        theme.palette.success.main,     // EMA - Greenish tone for bullish trends
        theme.palette.warning.main,     // KAMA - Adaptive, using warning yellow
        theme.palette.error.light,      // BB Upper - Lighter red for upper band
        theme.palette.info.main,        // BB Middle - Neutral blue for mid-line
        theme.palette.error.dark,       // BB Lower - Darker red for lower band
    ];


    if (!data || !data.SMA || !data.EMA || !data.WMA) return <p>Waiting For Moving Averages Data...</p>;

    const chartData = {
        labels: data.SMA.map((_, index) => index), // Use index for now, but should be timestamps
        datasets: [
            {
                label: "SMA",
                data: data.SMA,
                borderColor: colorPalette[0],
                fill: false,
            },
            {
                label: "WMA",
                data: data.WMA,
                borderColor: colorPalette[1],
                fill: false,
            },
            {
                label: "EMA",
                data: data.EMA,
                borderColor: colorPalette[2],
                fill: false,
            },
            {
                label: "KAMA",
                data: data.KAMA,
                backgroundColor: colorPalette[3],
                fill: false,
            },
            {
                label: "BB Upper",
                data: data.BBAND_upper,
                backgroundColor: colorPalette[4],
                borderDash: [5, 5],
            },
            {
                label: "BB Middle",
                data: data.BBAND_middle,
                backgroundColor: colorPalette[5],
            },
            {
                label: "BB Lower",
                data: data.BBAND_lower,
                backgroundColor: colorPalette[6],
                borderDash: [5, 5],
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: 'right',
                labels: {
                    color: theme.palette.text.primary,
                    font: { size: 12 },
                },
            },
            tooltip: { mode: "index", intersect: true },
        },
        elements: {
            line: {
                tension: 0.3,
                borderWidth: 1.5,
                backgroundColor: 'transparent',
            },
            point: {
                radius: 0,
            },
        },
        scales: {
            x: {
                ticks: { color: theme.palette.text.secondary },
                grid: { color: theme.palette.divider },
            },
            y: {
                ticks: { color: theme.palette.text.secondary },
                grid: { color: theme.palette.divider },
            },
        },
    };

    // return <Line data={chartData} options={options} />;
    return (
        <Card variant="outlined" sx={{ width: '100%' }}>
        <CardContent>
            <ChartTitle>
                Moving Averages
            </ChartTitle>
            <ChartDescription>
                Helps to level the price data over a specified period by creating a constantly updated average price.
            </ChartDescription>
            <Line data={chartData} options={options} plugins={[chartBackgroundPlugin(theme)]} />
        </CardContent>
        </Card>
    )
};

export default MovingAveragesChart;
