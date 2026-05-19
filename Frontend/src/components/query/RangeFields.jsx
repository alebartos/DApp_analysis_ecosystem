import React from 'react';
import {Grid} from "@mui/material";
import NestedField from './NestedField';

const RangeFields = ({title, name, from, to, type, onChange}) => (
    <Grid container spacing={2}>
        <Grid item xs={6}>
            <NestedField label={`${title} From`} name={`${name}From`} value={from} type={type} onChange={onChange}/>
        </Grid>
        <Grid item xs={6}>
            <NestedField label={`${title} To`} name={`${name}To`} value={to} type={type} onChange={onChange}/>
        </Grid>
    </Grid>
);

export default RangeFields;
