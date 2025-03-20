import React from 'react';
import { Typography } from '@mui/material';

const ChartTitle = ({ children }) => {
    return (
        <Typography
            component="h4"
            variant="h8"
            sx={{
                color: (theme) => theme.palette.text.primary,
                fontWeight: 'bold',
                mb: 0.3,
            }}
        >
            {children}
        </Typography>
    );
};

export default ChartTitle;
