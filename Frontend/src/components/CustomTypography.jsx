import React from 'react';
import {Typography} from "@mui/material";

function CustomTypography({children}) {
    return (
        <Typography variant="h5">
            {children}
        </Typography>
    )
}

export default CustomTypography;