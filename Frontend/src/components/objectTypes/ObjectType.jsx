import React from 'react';
import {Box, Button, FormControl, InputLabel, MenuItem, Select, Stack} from "@mui/material";

import CustomTypography from "../CustomTypography";
import DeleteIcon from "@mui/icons-material/Delete";

function ObjectType({
                        objectTypesToMap,
                        setObjectTypesToMap,
                        setObjectsTypesItem,
                        objectsTypesItem,
                        objectType,
                        index
                    }) {

    const handleRemoveObject = (object) => {
        setObjectsTypesItem(objectsTypesItem.filter(item => item.name !== object.name))
        setObjectTypesToMap(objectTypesToMap.filter(item => item !== object.name))

    }

    const handleSelectObjectTypeName = (e) => {
        objectType.name = e.target.value
        setObjectTypesToMap([...objectTypesToMap, objectType.name])
    }

    const objectTypesOptions = ["contractAddress", "txHash", "sender", "input", "stateVariable", "event", "internalTx"]

    return (
        <Box display="flex">
            <Box>
                <CustomTypography>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"{"}
                </CustomTypography>
                <Box display="flex" gap={1} alignItems="center" marginTop={1}>
                    <CustomTypography>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"name":
                    </CustomTypography>
                    <Stack spacing={1}>
                        <FormControl fullWidth sx={{width: 200}}>
                            <InputLabel>Key</InputLabel>
                            <Select
                                name={`${index}`}
                                value = {objectType.name}
                                label="name"
                                onChange={(e) => handleSelectObjectTypeName(e)}
                                variant='outlined'
                            >
                                {
                                    objectTypesOptions.map((name, index) => (
                                        <MenuItem key={index} value={name}>{name}</MenuItem>
                                    ))
                                }
                            </Select>
                        </FormControl>
                    </Stack>
                    <CustomTypography>
                        ,
                    </CustomTypography>
                </Box>
                <CustomTypography>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"attributes": []
                <CustomTypography>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"}"}{index !== objectsTypesItem.length - 1 && ","}
                </CustomTypography>
                </CustomTypography>
            </Box>
            <Box marginTop={8} marginLeft={2}>
                <Button onClick={() => handleRemoveObject(objectType)}>
                    <DeleteIcon sx={{fontSize: 30, color: "red"}}/>
                </Button>
            </Box>
        </Box>
    )
}

export default ObjectType;