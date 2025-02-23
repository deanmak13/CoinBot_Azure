import React from 'react';
import {CandlestickSeries, createChart, createSeriesMarkers} from "lightweight-charts";
import { useEffect, useRef } from "react";

const formatCandles = (data) => {
    if (!data || !data.time) return [];
    return data.time.map((t, i) => ({
        time: t,
        open: data.open[i],
        high: data.high[i],
        low: data.low[i],
        close: data.close[i],
    }));
};

// TODO: reevaluate the impact of this
const deduplicateCandles = (candles) => {
    const unique = [];
    const seen = new Set();
    candles.forEach((candle) => {
        if (!seen.has(candle.time)) {
            unique.push(candle);
            seen.add(candle.time);
        }
    });
    return unique;
};

const CandlestickChart = ({ candles, patterns=[] }) => {
    const chartContainerRef = useRef();

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, { width: 600, height: 300 });
        const series = chart.addSeries(CandlestickSeries);
        const formattedCandles = formatCandles(candles);
        const uniqueCandles = deduplicateCandles(formattedCandles);
        series.setData(uniqueCandles);

        patterns.forEach((pattern) => {
            createSeriesMarkers(series, [
                {
                    time: pattern.time,
                    position: "aboveBar",
                    color: pattern.type === "Hammer" ? "red" : "blue",
                    shape: pattern.type === "Hammer" ? "arrowDown" : "arrowUp",
                    text: pattern.type,
                },
            ]);
        });

        return () => chart.remove();
    }, [candles, patterns]);

    return <div ref={chartContainerRef} />;
};

export default CandlestickChart;