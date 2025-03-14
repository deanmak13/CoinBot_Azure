import React from 'react';
import {Bar} from "react-chartjs-2";
import CardContent from "@mui/material/CardContent";
import Card from "@mui/material/Card";
import {useTheme} from "@mui/material/styles";
import { chartBackgroundPlugin } from './plugins/chartPlugins';

import ChartTitle from "../components/chart-components/ChartTitle";
import {ChartDescription} from "../components/chart-components/ChartDescription";

const MACDChart = ({ data }) => {
    const theme = useTheme();

    const colorPalette = [
        theme.palette.success.main,   // positive histogram bars
        theme.palette.primary.main,   // MACD line
        theme.palette.secondary.main, // Signal line
        theme.palette.error.main,     // negative histogram bars
    ];

    if (!data || !data.MACD || !data.MACD_Signal || !data.MACD_History) return <p>Waiting For MACD Data...</p>;

    const chartData = {
        labels: data.MACD.map((_, index) => index), // Use index for now, but should be timestamps
        datasets: [
            {
                label: "MACD",
                type: "line",
                data: data.MACD,
                borderColor: colorPalette[1],
                borderWidth: 1,
                backgroundColor: 'transparent',
                pointRadius: 0,
            },
            {
                label: "MACD Signal",
                type: "line",
                data: data.MACD_Signal,
                borderColor: colorPalette[2],
                borderWidth: 1,
                backgroundColor: 'transparent',
                pointRadius: 0,
            },
            {
                label: "MACD Histogram",
                type: "bar",
                data: data.MACD_History,
                pointRadius: 0,
                backgroundColor: data.MACD_History.map((val) =>
                    val > 0 ? colorPalette[0] : colorPalette[3]
                ),
            },

        ],
    };
    const options = {
        responsive: true,
        elements: { line: { tension: 0.3 } },
        plugins: {
            legend: {
                labels: {
                    color: theme.palette.text.primary,
                },
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            },
        },
        scales: {
            x: {
                grid: { color: theme.palette.divider },
                ticks: { color: theme.palette.text.secondary },
            },
            y: {
                grid: { color: theme.palette.divider },
                ticks: { color: theme.palette.text.secondary },
            },
        },
    };

    return (
        <Card variant="outlined" sx={{ width: '100%' }}>
            <CardContent>
                <ChartTitle>
                    Moving Average Convergence/Divergence (MACD)
                </ChartTitle>
                <ChartDescription>
                    Helps identify price trends, measure trend momentum, and identify entry points for buying or selling.
                </ChartDescription>
                <Bar data={chartData} options={options} plugins={[chartBackgroundPlugin(theme)]} />
            </CardContent>
        </Card>
    );
};

export default MACDChart;