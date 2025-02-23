import React from "react";
import { Line } from "react-chartjs-2";

const MovingAveragesChart = ({ data }) => {
    if (!data || !data.SMA || !data.EMA || !data.WMA) return <p>Loading...</p>;

    const chartData = {
        labels: data.SMA.map((_, index) => index), // Use index for now, but should be timestamps
        datasets: [
            {
                label: "SMA",
                data: data.SMA,
                borderColor: "blue",
                fill: false,
            },
            {
                label: "WMA",
                data: data.WMA,
                borderColor: "green",
                fill: false,
            },
            {
                label: "EMA",
                data: data.EMA,
                borderColor: "red",
                fill: false,
            },
            {
                label: "KAMA",
                data: data.KAMA,
                borderColor: "purple",
                fill: false,
            },
            {
                label: "BB Upper",
                data: data.BBAND_upper,
                borderColor: "orange",
                borderDash: [5, 5],
            },
            {
                label: "BB Middle",
                data: data.BBAND_middle,
                borderColor: "gray",
            },
            {
                label: "BB Lower",
                data: data.BBAND_lower,
                borderColor: "orange",
                borderDash: [5, 5],
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: "top" },
            tooltip: { mode: "index", intersect: false },
        },
        elements: { line: { tension: 0.3 } },
    };

    return <Line data={chartData} options={options} />;
};

export default MovingAveragesChart;
