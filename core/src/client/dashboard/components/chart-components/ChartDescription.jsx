import React from 'react';
import { Typography } from '@mui/material';

export const ChartDescription = ({children}) => {
    return (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {children}
        </Typography>
    );
};