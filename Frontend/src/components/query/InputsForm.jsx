import React, { useState } from 'react';
import { Box, Typography, IconButton } from "@mui/material";
import NestedField from './NestedField';
import { Delete } from '@mui/icons-material';
import AddQueryButton from "./AddQueryButton";

const InputsForm = ({ inputs, setInputs }) => {
    const [showInputs, setShowInputs] = useState(false);
    const [error, setError] = useState('');

    const handleAddInput = () => {
        setShowInputs(true);
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        if (name === 'inputValue') {
            if (value && !inputs.type) {
                setError('Type is required');
            } else {
                setError('');
                const valueToAdd = inputs.type.includes('int') ? Number(value) : inputs.type.includes('bool') ? value === 'true' : value;
                setInputs({ ...inputs, [name]: valueToAdd});
            }
        } else {
            setInputs({ ...inputs, [name]: value });
        }

    };

    const handleDeleteInput = () => {
        setInputs({ inputName: '', type: '', inputValue: '' });
        setShowInputs(false);
        setError('')
    };

    return (
        <Box>
            <Typography variant="h6">Inputs</Typography>
            {showInputs ? (
                <Box mb={2} display="flex" alignItems="center">
                    <Box flexGrow={1}>
                        <NestedField label="Input Name" name="inputName" value={inputs.inputName} onChange={handleInputChange} />
                        <NestedField label="Type" name="type" value={inputs.type} onChange={handleInputChange} />
                        <NestedField label="Input Value" name="inputValue" value={inputs.inputValue} onChange={handleInputChange} />
                        {error && <Typography color="error">{error}</Typography>}
                    </Box>
                    <IconButton onClick={handleDeleteInput} color="error">
                        <Delete />
                    </IconButton>
                </Box>
            ) : (
                <AddQueryButton label="Add Input" onClick={handleAddInput} />
            )}
        </Box>
    );
};

export default InputsForm;
