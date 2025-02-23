import React from 'react';
import MovingAveragesChart from "./charts/moving_averages_chart";
import MACDChart from "./charts/macd_chart";
import RSIChart from "./charts/rsi_chart";
import CandlestickChart from "./charts/candlestick_chart";
import subscribeToWebsocketPublisher from "../websocket/websocket_subscriber";

const Dashboard = () => {
    const realTimeData = subscribeToWebsocketPublisher("ws://localhost:3001")

    return (
        <div className="p-6 bg-gray-900 text-white">
            <h1 className="text-3xl font-bold mb-4">Live Trading Dashboard</h1>
            {realTimeData ? (
                <div className="grid grid-cols-2 gap-4">
                    <MovingAveragesChart data={realTimeData}/>
                    <MACDChart data={realTimeData}/>
                    <RSIChart data={realTimeData}/>
                    <CandlestickChart candles={realTimeData} patterns={[]} />
                </div>
            ) : (
                <p>Waiting for live data...</p>
            )}
        </div>
    );
};

export default Dashboard;
