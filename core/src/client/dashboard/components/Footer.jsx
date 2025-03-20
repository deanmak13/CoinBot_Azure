import React from 'react';
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

export default function Footer () {
    return (
        <Stack
        direction="row"
        spacing={0.5}
        sx={{
            color: 'text.secondary',
            justifyContent: "center",
            alignItems: "center",
        }}
        >
            <Typography variant="caption" component="div">
                (Developed By Dean Makwarimba)
            </Typography>
        </Stack>
    );
}