import Stack from "@mui/material/Stack";
import * as React from "react";
import Typography from "@mui/material/Typography";


const Header = ({}) => {
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
        </Stack>
    );
}

export default Header;