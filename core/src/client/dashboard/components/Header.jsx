import Stack from "@mui/material/Stack";
import * as React from "react";
import Typography from "@mui/material/Typography";
import {FormControl, FormLabel, MenuItem, Select} from "@mui/material";
import Box from "@mui/material/Box";

const Header = ({ availableTickers, ticker, setTicker, timeRanges, timeRange, setTimeRange}) => {
    if (!Array.isArray(availableTickers) || !Array.isArray(timeRanges)) {
        return null;
    }

    return (
        <Stack
            direction="row"
            sx={{
                display: { xs: 'none', md: 'flex' },
                width: '100%',
                alignItems: { xs: 'flex-start', md: 'center' },
                justifyContent: 'space-between',
                maxWidth: { sm: '100%', md: '1700px' },
                pt: 1.5,
            }}
            spacing={2}
        >
            <Typography component="h2" variant="h4">
                VIVA Learning - Crypto Core Insights
            </Typography>
            <Stack direction="row" sx={{ gap: 1 }}>
                <Box sx={{ m: 1, minWidth: 180 }}>
                    <FormLabel htmlFor="ticker-select" sx={{ display: 'block', mb: 1, fontSize: '0.75rem' }}>
                        Ticker
                    </FormLabel>
                    <FormControl fullWidth>
                        <Select
                            id="ticker-select"
                            value={ticker}
                            variant="standard"
                            onChange={(e) => setTicker(e.target.value)}
                            sx={{
                                textAlign: 'center',
                                pl: 2, // <-- Add padding-left
                                pr: 2, // <-- padding-right
                                '& .MuiSelect-select': {
                                    textAlign: 'center',
                                    pt: 1
                                }
                            }}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: 300
                                    }
                                }
                            }}
                        >
                            {availableTickers.map((t) => (
                                <MenuItem key={t} value={t}>{t}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box sx={{ m: 1, minWidth: 180 }}>
                    <FormLabel htmlFor="time-select" sx={{ display: 'block', mb: 1, fontSize: '0.75rem' }}>
                        Time Range
                    </FormLabel>
                    <FormControl fullWidth>
                        <Select
                            id="time-select"
                            value={timeRange}
                            variant="standard"
                            onChange={(e) => setTimeRange(e.target.value)}
                            sx={{
                                textAlign: 'center',
                                pl: 2, // <-- Add padding-left
                                pr: 2, // <-- padding-right
                                '& .MuiSelect-select': {
                                    textAlign: 'center',
                                    pt: 1
                                }
                            }}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: 300
                                    }
                                }
                            }}
                        >
                            {timeRanges.map(({ label, value }) => (
                                <MenuItem key={value} value={value}>{label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Stack>
        </Stack>
    );
}

export default Header;