import MovingAveragesChart from "../charts/MovingAveragesChart";

import Typography from "@mui/material/Typography";
import * as React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import MACDChart from "../charts/MACDChart";
import CandlestickChart from "../charts/CandlestickChart";
import RSIChart from "../charts/RSIChart";

export default function RealTimeGrid({data}) {
    return (
        <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
            {/* cards */}
            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                Real Time Overview
            </Typography>
            <Grid
                container
                spacing={2}
                columns={12}
                sx={{ mb: (theme) => theme.spacing(2) }}
            >
                <Grid size={{ xs: 12, md: 12 }}>
                    <CandlestickChart data={data} patterns={[]} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <MovingAveragesChart data={data} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <MACDChart data={data} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <RSIChart data={data}/>
                </Grid>
            </Grid>
        </Box>
    )
}