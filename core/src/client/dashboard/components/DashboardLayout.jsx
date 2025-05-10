import Grid from "@mui/material/Grid2";
import StatCard from "./StatCard";
import CandlestickChart from "../charts/CandlestickChart";
import MovingAveragesChart from "../charts/MovingAveragesChart";
import MACDChart from "../charts/MACDChart";
import RSIChart from "../charts/RSIChart";
import * as React from "react";

const formatCurrency = (val) => `$${Number(val ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})}`;

const DashboardLayout = ({ data, ticker, timeScaleRef }) => {
    const latestPrice = formatCurrency(data?.close?.at(-1));
    const latestSMA = formatCurrency(data?.SMA?.at(-1));
    const latestMACD = `${data?.MACD?.at(-1)?.toFixed(2) ?? '—'}`;
    const latestRSI = `${data?.RSI?.at(-1)?.toFixed(0) ?? '—'}`;

    return (
        <>
            {/* Centered Stat Cards */}
            <Grid container spacing={2} justifyContent="center" sx={{ mb: (theme) => theme.spacing(2), mt: 1 }}>
                <Grid container item spacing={2} xs={12} md={10} lg={8} justifyContent="center">
                    <Grid item xs={6} sm={4} md={3}>
                        <StatCard
                            title="Latest Price"
                            value={latestPrice}
                            interval="Latest Closing"
                            yAxisData={data?.close?.slice(-30) ?? []}
                            xAxisData={data?.time?.slice(-30) ?? []}
                        />
                    </Grid>
                    <Grid item xs={6} sm={4} md={3}>
                        <StatCard
                            title="SMA"
                            value={latestSMA}
                            interval="Latest SMA (Smooth Avg)"
                            yAxisData={data?.SMA?.slice(-30) ?? []}
                            xAxisData={data?.time?.slice(-30) ?? []}
                        />
                    </Grid>
                    <Grid item xs={6} sm={4} md={3}>
                        <StatCard
                            title="MACD"
                            value={latestMACD}
                            interval="Momentum"
                            yAxisData={data?.MACD?.slice(-30) ?? []}
                            xAxisData={data?.time?.slice(-30) ?? []}
                        />
                    </Grid>
                    <Grid item xs={6} sm={4} md={3}>
                        <StatCard
                            title="RSI"
                            value={latestRSI}
                            interval="Relative Strength"
                            yAxisData={data?.RSI?.slice(-30) ?? []}
                            xAxisData={data?.time?.slice(-30) ?? []}
                        />
                    </Grid>
                </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={2} columns={12}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <CandlestickChart data={data} ticker={ticker} timeScaleRef={timeScaleRef} summaryValue={latestPrice} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <MovingAveragesChart data={data} timeScaleRef={timeScaleRef} summaryValue={latestSMA} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <MACDChart data={data} timeScaleRef={timeScaleRef} summaryValue={latestMACD} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <RSIChart data={data} timeScaleRef={timeScaleRef} summaryValue={latestRSI} />
                </Grid>
            </Grid>
        </>
    );
};

export default DashboardLayout;
