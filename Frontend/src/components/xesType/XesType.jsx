import React, { useEffect, useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import jp from 'jsonpath';
import useDataContext from "../../context/useDataContext";

function XesType({ name, objectToSet }) {
    const { results } = useDataContext();
    const [objectTypesOptions, setObjectTypesOptions] = useState([]);

    // Function to extract unique keys (excluding numeric keys)
    function getUniqueKeys(json) {
        if (!json) return []; // Prevent errors if jsonData is undefined/null

        const paths = jp.paths(json, '$..*'); // Get all JSON paths
        const keys = new Set();

        paths.forEach(pathArray => {
            if (pathArray.length > 1) { // Ignore root $
                const lastKey = pathArray[pathArray.length - 1];

                // Only add keys that are not purely numeric
                if (isNaN(lastKey)) {
                    keys.add(lastKey);
                }
            }
        });

        return Array.from(keys);
    }

    // Extract keys when `results` change
    useEffect(() => {
        if (results) {
            setObjectTypesOptions(getUniqueKeys(results));
        }
    }, [results]);

    const handleSelectObjectTypeName = (e) => {
        objectToSet({ name, value: e.target.value });
    };

    return (
        <Box display="flex">
            <Box>
                <FormControl fullWidth sx={{ width: 200 }}>
                    <InputLabel>Key</InputLabel>
                    <Select onChange={handleSelectObjectTypeName}>
                        {objectTypesOptions.length > 0 ? (
                            objectTypesOptions.map((key, index) => (
                                <MenuItem key={index} value={key}>{key}</MenuItem>
                            ))
                        ) : (
                            <MenuItem disabled>No Keys Found</MenuItem>
                        )}
                    </Select>
                </FormControl>
            </Box>
        </Box>
    );
}

export default XesType;
