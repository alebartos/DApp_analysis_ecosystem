import React, {useState} from 'react';
import {Box, Typography, IconButton} from "@mui/material";
import NestedField from './NestedField';
import {Delete} from '@mui/icons-material';
import AddQueryButton from './AddQueryButton';

const StorageStateForm = ({storageState, setStorageState}) => {
    const [showStorageState, setShowStorageState] = useState(false);
    // TODO: Uncomment the following line to enable error handling
    // const [error, setError] = useState('');

    const handleAddInput = () => {
        setShowStorageState(true);
    }

    // TODO: Comment and uncomment the following block to enable checking of variable type
    const handleStorageStateChange = (event) => {
        const {name, value} = event.target;
        setStorageState({...storageState, [name]: value});
    };

    // TODO: Uncomment the following block to enable checking of variable type
    // const handleStorageStateChange = (event) => {
    //     const {name, value} = event.target;
    //
    //     if (name === 'variableValue') {
    //         if (value && !storageState.type) {
    //             setError('Type is required');
    //         } else {
    //             setError('');
    //             const storageStateType = storageState.type;
    //             let valueToAdd = value
    //             if (storageStateType.includes('mapping')) {
    //                 const storageStateTypeSplit = storageStateType.split(',');
    //                 const type = storageStateTypeSplit[storageStateTypeSplit.length-1]
    //                 if (type.includes("int")) {
    //                     valueToAdd = Number(value)
    //                 } else if (type.includes("bool")) {
    //                     valueToAdd = value === 'true'
    //                 }
    //             } else {
    //                 valueToAdd = storageState.type.includes('int') ? Number(value) : storageState.type.includes('bool') ? value === 'true' : value;
    //             }
    //             setStorageState({ ...storageState, [name]: valueToAdd});
    //         }
    //     } else {
    //         setStorageState({ ...storageState, [name]: value });
    //     }
    // };

    const handleDeleteStorageState = () => {
        setStorageState({variableName: '', type: '', variableValue: '', variableRawValue: ''});
        setShowStorageState(false);
        // TODO: Uncomment the following line to enable error handling
        // setError('')
    };

    return (
        <Box>
            <Typography variant="h6">Storage State</Typography>
            {showStorageState ? (
                <Box mb={2} display="flex" alignItems="center">
                    <Box flexGrow={1}>
                        <NestedField label="Variable Name" name="variableName" value={storageState.variableName}
                                     onChange={handleStorageStateChange}/>
                        <NestedField label="Type" name="type" value={storageState.type}
                                     onChange={handleStorageStateChange}/>
                        <NestedField label="Variable Value" name="variableValue" value={storageState.variableValue}
                                     onChange={handleStorageStateChange}/>
                        <NestedField label="Variable Raw Value" name="variableRawValue"
                                     value={storageState.variableRawValue} onChange={handleStorageStateChange}/>
                        {/*TODO: Uncomment the following line to enable error handling*/}
                        {/*{error && <Typography color="error">{error}</Typography>}*/}
                    </Box>
                    <IconButton onClick={handleDeleteStorageState} color="error">
                        <Delete/>
                    </IconButton>
                </Box>
            ) : (
                <AddQueryButton label="Add Storage State" onClick={handleAddInput}/>
            )}
        </Box>
    );
};

export default StorageStateForm;
