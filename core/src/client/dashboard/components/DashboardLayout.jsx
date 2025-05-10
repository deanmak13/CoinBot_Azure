import Grid from "@mui/material/Grid2";
import StatCard from "./StatCard";
import CandlestickChart from "../charts/CandlestickChart";
import MovingAveragesChart from "../charts/MovingAveragesChart";
import MACDChart from "../charts/MACDChart";
import RSIChart from "../charts/RSIChart";
import * as React from "react";


const DashboardLayout = ({ data, ticker, timeScaleRef }) => {
    return (
    <Grid container spacing={2} columns={12} sx={{ mb: (theme) => theme.spacing(2) }}>
        <Grid item xs={3}>
            <StatCard
                title="Latest Price"
                value={`$${Number(data?.close?.at(-1) ?? 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`}
                interval="Latest Closing"
                yAxisData={data?.close?.slice(-30) ?? []}
                xAxisData={data?.time?.slice(-30) ?? []}
            />
        </Grid>

        <Grid item xs={3}>
            <StatCard
                title="SMA"
                value={`$${Number(data?.SMA?.at(-1) ?? 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`}
                interval="Latest SMA (Smooth Avg)"
                yAxisData={data?.SMA?.slice(-30) ?? []}
                xAxisData={data?.time?.slice(-30) ?? []}
            />
        </Grid>

        <Grid item xs={3}>
            <StatCard
                title="MACD"
                value={`${data?.MACD?.at(-1)?.toFixed(2) ?? '—'}`}
                interval="Momentum"
                yAxisData={data?.MACD?.slice(-30) ?? []}
                xAxisData={data?.time?.slice(-30) ?? []}
            />
        </Grid>

        <Grid item xs={3}>
            <StatCard
                title="RSI"
                value={`${data?.RSI?.at(-1)?.toFixed(0) ?? '—'}`}
                interval="Relative Strength"
                yAxisData={data?.RSI?.slice(-30) ?? []}
                xAxisData={data?.time?.slice(-30) ?? []}
            />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
            <CandlestickChart data={data} ticker={ticker} timeScaleRef={timeScaleRef} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
            <MovingAveragesChart data={data} timeScaleRef={timeScaleRef} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
            <MACDChart data={data} timeScaleRef={timeScaleRef} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
            <RSIChart data={data} timeScaleRef={timeScaleRef} />
        </Grid>
    </Grid>)
}

export default DashboardLayout;