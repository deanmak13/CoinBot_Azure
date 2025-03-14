import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import React from 'react';
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import {alpha} from "@mui/material/styles";
import Stack from "@mui/material/Stack";

import subscribeToWebsocketPublisher from "../websocket/websocket_subscriber";
import Header from "./components/Header";
import RealTimeGrid from "./components/RealTimeGrid";
import Footer from "./components/Footer";
import AppTheme from "./shared-theme/AppTheme";

const Dashboard = () => {
    const realTimeData = subscribeToWebsocketPublisher("ws://localhost:3001")

    return (
        <AppTheme>
            <CssBaseline enableColorScheme />
            <Box sx={{ display: 'flex' }}>
                {/* Main content */}
                <Box
                    component="main"
                    sx={(theme) => ({
                        flexGrow: 1,
                        backgroundColor: theme.vars
                            ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
                            : alpha(theme.palette.background.default, 1),
                        overflow: 'auto',
                    })}
                >
                    <Stack
                        spacing={2}
                        sx={{
                            alignItems: 'center',
                            mx: 3,
                            pb: 5,
                            mt: { xs: 8, md: 0 },
                        }}
                    >
                        <Header/>
                        <RealTimeGrid data={realTimeData}/>
                        <Footer/>
                    </Stack>
                </Box>
            </Box>
        </AppTheme>
    )
};

export default Dashboard;
