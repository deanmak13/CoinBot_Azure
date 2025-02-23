import React from 'react';
import ReactDOM from "react-dom/client";
import { Chart } from 'chart.js';
import { CategoryScale, LinearScale, LineElement, BarElement, PointElement } from 'chart.js';
import Dashboard from './dashboard/dashboard_ui';
import reportWebVitals from "./reportWebVitals";

Chart.register(CategoryScale, LinearScale, LineElement, BarElement, PointElement);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Dashboard />);

reportWebVitals(console.log);