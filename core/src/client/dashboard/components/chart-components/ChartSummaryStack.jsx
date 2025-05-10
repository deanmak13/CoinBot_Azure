import Stack from "@mui/material/Stack";
import {Chip, Typography} from "@mui/material";
import React from "react";

const DynamicChip = ({chipLabel}) => {
    if (chipLabel==="") {
        return null
    }
    return (
        <Chip
            size="small"
            label={chipLabel}
            sx={{ ml: 1 }} // Added margin left for spacing
        ></Chip>
    )
}

const ChartSummaryStack = ({latestValue, chipLabel=""}) => {
    return (<Stack
        direction="row"
        spacing={0.5}
        sx={{
            alignItems: 'center',
            justifyContent: 'flex-start',
            mb: 1 // Added margin bottom for spacing
        }}
    >
        <Typography
            component="h2"
            variant="h4"
            sx={{
                color: (theme) => theme.palette.text.primary,
            }}
        >
            {latestValue ?? "N/A"}
        </Typography>
        <DynamicChip chipLabel={chipLabel} />
    </Stack>)
}

export default ChartSummaryStack;