import React from 'react';
import { FormControl, InputLabel, FilledInput } from "@mui/material";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/it';

const NestedField = ({ label, name, type, value, onChange }) => (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="it">
        <FormControl variant="filled" sx={{ width: '100%' }}>
            {type === 'datetime-local' ? (
                <DateTimePicker
                    name={name}
                    value={value ? dayjs(value) : null} // Ensure the value is a dayjs instance
                    onChange={(newValue) => onChange({ target: { name, value: newValue ? newValue.valueOf() : null } })}
                    renderInput={(params) => <FilledInput {...params} />}
                    label={label}
                />
            ) : (
                <>
                    <InputLabel sx={{ fontWeight: '700', fontSize: '18px' }}>{label}</InputLabel>
                    <FilledInput name={name} value={value} type={type} onChange={onChange} label={label} />
                </>
            )}
        </FormControl>
    </LocalizationProvider>
);

export default NestedField;
