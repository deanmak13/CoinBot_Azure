import React from 'react';
import ReactDOM from "react-dom/client";
import { Chart } from 'chart.js';
import { CategoryScale, LinearScale, LineElement, BarElement, PointElement } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation'
import Dashboard from './dashboard/DashboardUI';
import reportWebVitals from "./reportWebVitals";

Chart.register(CategoryScale, LinearScale, LineElement, BarElement, PointElement, annotationPlugin);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Dashboard />);

reportWebVitals(console.log);