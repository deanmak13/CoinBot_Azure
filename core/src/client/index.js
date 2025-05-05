import React from 'react';
import ReactDOM from "react-dom/client";
import {
    Chart,
    CategoryScale,
    LinearScale,
    TimeScale,
    LineElement,
    BarElement,
    PointElement,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chartjs-adapter-date-fns';

import Dashboard from './dashboard/DashboardUI';
import reportWebVitals from "./reportWebVitals";

// Register all chart components you're using
Chart.register(
    CategoryScale,
    LinearScale,
    TimeScale,
    LineElement,
    BarElement,
    PointElement,
    annotationPlugin
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Dashboard />);

reportWebVitals(console.log);
