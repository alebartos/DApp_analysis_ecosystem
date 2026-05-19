import React, {useState} from 'react';
import {Box, Typography, IconButton} from "@mui/material";
import NestedField from './NestedField';
import {Delete} from '@mui/icons-material';
import AddQueryButton from './AddQueryButton';

const InternalTxsForm = ({internalTxs, setInternalTxs}) => {
    const [showInternalTxs, setShowInternalTxs] = useState(false);

    const handleAddInput = () => {
        setShowInternalTxs(true);
    }

    const handleInternalTxsChange = (event) => {
        const {name, value} = event.target;
        setInternalTxs({...internalTxs, [name]: value});
    };

    const handleDeleteInternalTxs = () => {
        setInternalTxs({callType: '', to: ''});
        setShowInternalTxs(false);
    };

    return (
        <Box>
            <Typography variant="h6">Internal Transactions</Typography>
            {showInternalTxs ? (
                <Box mb={2} display="flex" alignItems="center">
                    <Box flexGrow={1}>
                        <NestedField label="Call Type" name="callType" value={internalTxs.callType}
                                     onChange={handleInternalTxsChange}/>
                        <NestedField label="To" name="to" value={internalTxs.to} onChange={handleInternalTxsChange}/>
                    </Box>
                    <IconButton onClick={handleDeleteInternalTxs} color="error">
                        <Delete/>
                    </IconButton>
                </Box>
            ) : (
                <AddQueryButton label="Add Internal Transaction" onClick={handleAddInput}/>
            )}
        </Box>
    );
};

export default InternalTxsForm;
