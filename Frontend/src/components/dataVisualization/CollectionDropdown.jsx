import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    Chip,
    Box,
} from "@mui/material";

function CollectionDropdown({ selectedCollections, setSelectedCollections, collections, query, setQueryState }) {
    const handleChange = (event) => {
        const {
            target: { value },
        } = event;
        setSelectedCollections(
            typeof value === 'string' ? value.split(',') : value
        );
        setQueryState({
            ...query,
            selectedCollection: value
        });
    };

    return (
        <FormControl variant="filled" fullWidth>
            <InputLabel sx={{ fontWeight: 700, fontSize: "18px" }}>
                Select Collections
            </InputLabel>
            <Select
                multiple
                value={selectedCollections}
                onChange={handleChange}
                renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                        ))}
                    </Box>
                )}
                variant="filled">
                {collections?.map((collection) => (
                    <MenuItem key={collection} value={collection}>
                        <Checkbox checked={selectedCollections.indexOf(collection) > -1} />
                        <ListItemText primary={collection} />
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

export {CollectionDropdown};