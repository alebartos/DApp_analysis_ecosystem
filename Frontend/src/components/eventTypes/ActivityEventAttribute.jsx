import React from 'react';
import {Box, FormControl, InputLabel, MenuItem, Select, Stack} from "@mui/material";
import CustomTypography from "../CustomTypography";

function ActivityEventAttribute() {

    const attributes = ["gasUsed", "blockNumber", "sender"]

    return (
        attributes.map((attribute, index) => (
            <Box key={index}>
                <Box display="flex" alignItems="center">
                    <Box>
                        <CustomTypography>
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"{"}
                        </CustomTypography>
                        <Box display="flex" gap={1} alignItems="center">
                            <CustomTypography>
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"name":
                            </CustomTypography>
                            <Stack>
                                <FormControl disabled fullWidth sx={{width: 200}}>
                                    <InputLabel>Key</InputLabel>
                                    <Select
                                        variant="outlined"
                                        value={attribute}
                                        label="name"
                                    >
                                        <MenuItem value={attribute}
                                                  sx={{width: 400, overflow: "auto"}}>{attribute}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Box>
                        <Box display="flex" gap={1} alignItems="center" marginTop={1}>
                            <CustomTypography>
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"type":
                            </CustomTypography>
                            <Stack>
                                <FormControl disabled fullWidth sx={{width: 200}}>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        variant="outlined"
                                        value={attribute === "gasUsed" || attribute === "blockNumber" ? "integer" : "string"}
                                        label="name"
                                    >
                                        <MenuItem value={attribute === "gasUsed" || attribute === "blockNumber" ? "integer" : "string"}
                                                  sx={{width: 400, overflow: "auto"}}>{attribute === "gasUsed" || attribute === "blockNumber" ? "integer" : "string"}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Box>
                    </Box>
                </Box>
                <CustomTypography>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"}"}{index !== attributes.length - 1 && ","}
                </CustomTypography>
            </Box>
        ))
    )
}

export default ActivityEventAttribute;