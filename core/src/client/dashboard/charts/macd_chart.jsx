import React from 'react';
import {Bar} from "react-chartjs-2";

const MACDChart = ({ data }) => {
    if (!data || !data.MACD || !data.MACD_Signal || !data.MACD_History) return <p>Loading...</p>;

    const chartData = {
        labels: data.MACD.map((_, index) => index), // Use index for now, but should be timestamps
        datasets: [
            {
                label: "MACD",
                type: "line",
                data: data.MACD,
                borderColor: "blue",
                fill: false,
            },
            {
                label: "MACD Signal",
                type: "line",
                data: data.MACD_Signal,
                borderColor: "red",
                fill: false,
            },
            {
                label: "MACD Histogram",
                type: "bar",
                data: data.MACD_History,
                backgroundColor: data.MACD_History.map((val) =>
                    val > 0 ? "green" : "red"
                ),
            },
        ],
    };

    return <Bar data={chartData} />;
};

export default MACDChart;