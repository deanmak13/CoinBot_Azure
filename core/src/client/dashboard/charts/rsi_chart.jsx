import React from 'react';
import {Line} from "react-chartjs-2";

const RSIChart = ({ data }) => {
    if (!data || !data.RSI) return <p>Loading...</p>;

    const chartData = {
        labels: data.RSI.map((_, index) => index), // Use index for now, but should be timestamp
        datasets: [
            {
                label: "RSI",
                data: data.RSI,
                borderColor: "purple",
                fill: false,
            },
        ],
    };

    const options = {
        scales: {
            y: {
                min: 0,
                max: 100,
                grid: { drawBorder: false },
                ticks: {
                    callback: function (value) {
                        if (value === 30) return "Oversold";
                        if (value === 70) return "Overbought";
                        return value;
                    },
                },
            },
        },
    };

    return <Line data={chartData} options={options} />;
};

export default RSIChart;