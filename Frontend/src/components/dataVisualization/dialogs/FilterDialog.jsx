import React, { useState } from "react";
import {
    Box,
    Button,
    Typography,
    IconButton,
    Stack,
    InputLabel,
    FilledInput,
    Dialog,
    DialogContent,
    DialogTitle,
    Slide,
    FormControl,
    RadioGroup,
    FormControlLabel,
    Radio,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddBoxIcon from "@mui/icons-material/AddBox";
import { FileUpload } from "@mui/icons-material";
import { HiddenInput } from "../../HiddenInput";
import axios from "axios";
import {useQuery} from "react-query";
import {CollectionDropdown} from "../CollectionDropdown";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="down" ref={ref} {...props} />;
});

function FilterDialog({
        open,
        onClose,
        query,
        setQueryState,
        isLoading,
        onApply,
        onImport
    }) {
    const [addressToAdd, setAddressToAdd] = useState("");
    const [txType, setTxType] = useState(query.internalTxs || "public");
    const [selectedCollections, setSelectedCollections] = useState([]);

    const {isLoading:isLoadingCollections, data:collections,error} = useQuery({
        queryKey: ["collections"],
        queryFn: async ()=> {
            const response = await axios.get("http://localhost:8000/api/collections");
            return response.data;
        }});
    const handleAddAddress = () => {
        if (!addressToAdd) return;

        const newAddresses = addressToAdd
            .split(/[,\s\n]+/)
            .map((addr) => addr.trim())
            .filter(Boolean);

        setQueryState({
            ...query,
            contractAddress: [...(query.contractAddress || []), ...newAddresses],
        });

        setAddressToAdd("");
    };

    const handleDeleteAddress = (idx) => {
        setQueryState({
            ...query,
            contractAddress: query.contractAddress.filter((_, i) => i !== idx),
        });
    };

    const handleResetFilters = () => {
        setQueryState({
            contractAddress: null,
            dateFrom: null,
            dateTo: null,
            fromBlock: null,
            toBlock: null,
            txHash: null,
            internalTxs: "public",
            minOccurrences: null,
            selectedCollection: null,
        });
    };

    if(isLoadingCollections) return (<div>Loading...</div>);
    if(error) return (<div>Error...</div>);


    return (
        <Dialog
            TransitionComponent={Transition}
            keepMounted
            open={open}
            fullWidth
            maxWidth="lg"
            onClose={onClose}
        >
            <DialogTitle>Filters</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={3} sx={{ p: 3 }}>

                    <CollectionDropdown
                        selectedCollections={selectedCollections}
                        setSelectedCollections={setSelectedCollections}
                        collections={collections}
                        query = {query}
                        setQueryState={setQueryState}
                    />

                    {/* Contract Addresses */}
                    <FormControl variant="filled">
                        <InputLabel sx={{ fontWeight: 700, fontSize: "18px" }}>
                            Contract Addresses
                        </InputLabel>

                        <Box display="flex" gap={1} mt={1}>
                            <FilledInput
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="comma, space, or line-break"
                                value={addressToAdd}
                                onChange={(e) => setAddressToAdd(e.target.value)}
                            />

                            <IconButton onClick={handleAddAddress}>
                                <AddBoxIcon color="primary" fontSize="large" />
                            </IconButton>
                        </Box>
                    </FormControl>

                    {query.contractAddress?.length > 0 && (
                        <Box>
                            {query.contractAddress.map((addr, idx) => (
                                <Box
                                    key={idx}
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    py={1}
                                >
                                    <Typography>{addr}</Typography>
                                    <IconButton onClick={() => handleDeleteAddress(idx)}>
                                        <DeleteIcon color="error" />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    )}

                    {/* Transaction Hash */}
                    <FormControl variant="filled">
                        <InputLabel sx={{ fontWeight: 700, fontSize: "18px" }}>
                            Transaction Hash
                        </InputLabel>
                        <FilledInput
                            value={query.txHash || ""}
                            onChange={(e) =>
                                setQueryState({ ...query, txHash: e.target.value })
                            }
                        />
                    </FormControl>

                    {/* Dates */}
                    <Box display="flex" gap={2}>
                        <FormControl variant="filled" fullWidth>
                            <InputLabel>Date From</InputLabel>
                            <FilledInput
                                type="datetime-local"
                                value={query.dateFrom || ""}
                                onChange={(e) =>
                                    setQueryState({ ...query, dateFrom: e.target.value })
                                }
                            />
                        </FormControl>

                        <FormControl variant="filled" fullWidth>
                            <InputLabel>Date To</InputLabel>
                            <FilledInput
                                type="datetime-local"
                                value={query.dateTo || ""}
                                onChange={(e) =>
                                    setQueryState({ ...query, dateTo: e.target.value })
                                }
                            />
                        </FormControl>
                    </Box>

                    {/* Block Range */}
                    <Box display="flex" gap={2}>
                        <FormControl variant="filled" fullWidth>
                            <InputLabel>From Block</InputLabel>
                            <FilledInput
                                type="number"
                                value={query.fromBlock || ""}
                                onChange={(e) =>
                                    setQueryState({ ...query, fromBlock: e.target.value })
                                }
                            />
                        </FormControl>

                        <FormControl variant="filled" fullWidth>
                            <InputLabel>To Block</InputLabel>
                            <FilledInput
                                type="number"
                                value={query.toBlock || ""}
                                onChange={(e) =>
                                    setQueryState({ ...query, toBlock: e.target.value })
                                }
                            />
                        </FormControl>
                    </Box>

                    {/* Min Occurrences */}
                    <FormControl variant="filled">
                        <InputLabel>Min Activity Occurrences</InputLabel>
                        <FilledInput
                            type="number"
                            value={query.minOccurrences || ""}
                            onChange={(e) =>
                                setQueryState({
                                    ...query,
                                    minOccurrences: e.target.value,
                                })
                            }
                        />
                    </FormControl>

                    {/* Transaction Type */}
                    <FormControl>
                        <RadioGroup
                            row
                            value={txType}
                            onChange={(e) => {
                                setTxType(e.target.value);
                                setQueryState({
                                    ...query,
                                    internalTxs: e.target.value,
                                });
                            }}
                        >
                            <FormControlLabel
                                value="public"
                                control={<Radio />}
                                label="Public"
                            />
                            <FormControlLabel
                                value="public+internal"
                                control={<Radio />}
                                label="Public + Internal"
                            />
                            <FormControlLabel
                                value="internal"
                                control={<Radio />}
                                label="Internal"
                            />
                        </RadioGroup>
                    </FormControl>

                    {/* Buttons */}
                    <Box display="flex" gap={2}>
                        <Button
                            variant="contained"
                            onClick={onApply}
                            disabled={isLoading}
                            sx={{
                                height: "50px",
                                backgroundColor: "#66cdaa",
                                "&:hover": { backgroundColor: "#6fa287" },
                            }}
                        >
                            {"Apply Filters"}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={handleResetFilters}
                            disabled={isLoading}
                            sx={{ height: "50px" }}
                        >
                            Reset Filters
                        </Button>
                        <Button
                            component="label"
                            variant="contained"
                            startIcon={<FileUpload />}
                            sx={{
                                height: "50px",
                                minWidth: "200px",
                                backgroundColor: "#86469C",
                                "&:hover": { backgroundColor: "#512960" },
                            }}
                        >
                            Upload Collection
                            <HiddenInput type="file" onChange={onImport} />
                        </Button>
                    </Box>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}

export {FilterDialog};