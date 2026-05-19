import React, { useEffect, useState } from 'react';
import { Box,Button, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import jp from 'jsonpath';
import useDataContext from '../../context/useDataContext';

function KeyType({ nameFrom, nameTo, objectToSet, index,setObjectsTypesItem }) {
    const { results } = useDataContext();
    const [objectTypesOptions, setObjectTypesOptions] = useState([]);
    objectToSet.index = index;
    const alpha="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    // Extract unique keys (excluding numeric and mongo keys)
   function getUniqueKeys(json) {
    if (!json) return [];
    for(const tx of json){
        if (tx.internalTxs !== undefined) {
            tx.calls = tx.internalTxs;
            delete tx.internalTxs;
        }
    }
    const keys = new Set();
    function traverse(obj, path = []) {
        if (obj === null || obj === undefined) return;

        if (Array.isArray(obj)) {
            obj.forEach(item => traverse(item, path));
        } 
        else if (typeof obj === 'object') {
            Object.keys(obj).forEach(key => {
                if (isNaN(key) && !key.startsWith('_') && !key.startsWith('$')) {
                    const newPath = [...path, key];

                    // Normalize path for saving
                    const normalizedPath = normalizeCallsPath(newPath);
                    keys.add(normalizedPath.join('.'));

                    // Always keep traversing with the REAL path
                    traverse(obj[key], newPath);
                }
            });
        }
    }

    traverse(json);
    return Array.from(keys).sort();
}

function normalizeCallsPath(path) {
    const result = [];
    let seenCalls = false;

    for (const key of path) {
        if (key === "calls") {
            if (!seenCalls) {
                result.push("calls");
                seenCalls = true;
            }
        } else {
            result.push(key);
        }
    }

    return result;
}


    useEffect(() => {
        if (results) {
            setObjectTypesOptions(getUniqueKeys(results));
        }
    }, [results]);
    const handleRemoveObject=(e)=>{
        setObjectsTypesItem(prev => prev.filter(item => item.index !== e.index))
    }
    const handleSelectObjectTypeNameFrom = (e) => {
        objectToSet.nameFrom=nameFrom
        objectToSet.from = e.target.value;
    };

    const handleSelectObjectTypeNameTo = (e) => {
        objectToSet.nameTo=nameTo
        objectToSet.to = e.target.value;
    };


    return (
        <Box display="flex" gap={2} >
            <FormControl fullWidth sx={{ width: 200 }}>
                <InputLabel id={`label-from-${index}`}>{nameFrom}</InputLabel>
                <Select
                    labelId={`label-from-${index}`}
                    id={`select-from-${index}`}
                    onChange={handleSelectObjectTypeNameFrom}
                    defaultValue=""
                >
                    {objectTypesOptions.length > 0 ? (
                        objectTypesOptions.map((key, i) => (
                            <MenuItem key={`${nameFrom}-${i}`} value={key}>{key}</MenuItem>
                        ))
                    ) : (
                        <MenuItem disabled>No Keys Found</MenuItem>
                    )}
                </Select>
            </FormControl>

            <FormControl fullWidth sx={{ width: 200 }}>
                <InputLabel id={`label-to-${index}`}>{nameTo}</InputLabel>
                <Select
                    labelId={`label-to-${index}`}
                    id={`select-to-${index}`}
                    onChange={handleSelectObjectTypeNameTo}
                    defaultValue=""
                >
                    {objectTypesOptions.length > 0 ? (
                        objectTypesOptions.map((key, i) => (
                            <MenuItem key={`${nameTo}-${i}`} value={key}>{key}</MenuItem>
                        ))
                    ) : (
                        <MenuItem disabled>No Keys Found</MenuItem>
                    )}
                </Select>
            </FormControl>
            <Box>
                <Typography marginTop={2}>{alpha.charAt(index)}</Typography>
            </Box>
            <Box marginTop={1} >
                <Button onClick={() => handleRemoveObject(objectToSet)}>
                    <DeleteIcon sx={{fontSize: 30, color: "red"}}/>
                </Button>
            </Box>
        </Box>

    );
}

export default KeyType;
