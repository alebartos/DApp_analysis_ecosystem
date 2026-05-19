import React, {useState} from "react";
import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    FilledInput,
    IconButton,
    InputLabel,
    Typography,
    Slide, Stack
} from "@mui/material";
import FormControl from "@mui/material/FormControl";
import AddBoxIcon from "@mui/icons-material/AddBox";
import DeleteIcon from "@mui/icons-material/Delete";
import {Button} from "@mui/material";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="down" ref={ref} {...props} />;
});

function GraphFilter({open,onClose,query,setQuery,isLoading,onApply}){
    const [addressToAdd, setAddressToAdd] = useState("");
    const handleAddAddress = () => {
        if (!addressToAdd) return;

        const newAddresses = addressToAdd
            .split(/[,\s\n]+/)
            .map((addr) => addr.trim())
            .filter(Boolean);

        setQuery({
            ...query,
            contractAddress: [...(query.contractAddress || []), ...newAddresses],
        });

        setAddressToAdd("");
    };
    const handleDeleteAddress = (idx) => {
        setQuery({
            ...query,
            contractAddress: query.contractAddress.filter((_, i) => i !== idx),
        });
    };
    const handleResetFilters = ()=>{
        setQuery({
            selectedCollection:query.selectedCollection
        });
    }
    return (
        <Dialog
            TransitionComponent={Transition}
            keepMounted
            open={open}
            fullWidth
            maxWidth="lg"
            onClose={onClose}
        >
            <DialogTitle>Graph Filters</DialogTitle>
            <DialogContent dividers>

                <Stack spacing={3} sx={{ p: 3 }}>
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
                    <FormControl variant="filled">
                        <InputLabel sx={{ fontWeight: 700, fontSize: "18px" }}>
                            Transaction Hash
                        </InputLabel>
                        <FilledInput
                            value={query.txHash || ""}
                            onChange={(e) =>
                                setQuery({ ...query, txHash: e.target.value })
                            }
                        />
                    </FormControl>
                    <FormControl varian="filled">
                        <InputLabel sx={{ fontWeight: 700, fontSize: "18px" }}>
                            Function Name
                        </InputLabel>
                        <FilledInput
                            value={query.funName || ""}
                            onChange={(e)=>
                                setQuery({...query,funName:e.target.value})
                            }
                        />
                    </FormControl>
                    <FormControl varian="filled">
                        <InputLabel sx={{ fontWeight: 700, fontSize: "18px" }}>
                            Sender
                        </InputLabel>
                        <FilledInput
                            value={query.sender || ""}
                            onChange={(e)=>
                                setQuery({...query,sender:e.target.value})
                            }
                        />
                    </FormControl>
                    <Box display="flex" gap={2}>
                        <FormControl variant="filled" fullWidth>
                            <InputLabel>Min Gas Used</InputLabel>
                            <FilledInput
                                type="number"
                                value={query.minGasUsed || ""}
                                onChange={(e)=>
                                    setQuery({...query,minGasUsed:e.target.value})}
                            />
                        </FormControl>
                        <FormControl variant="filled" fullWidth>
                            <InputLabel>Max Gas Used</InputLabel>
                            <FilledInput
                                type="number"
                                value={query.maxGasUsed || ""}
                                onChange={(e)=>
                                    setQuery({...query,maxGasUsed:e.target.value})}
                            />
                        </FormControl>
                    </Box>
                    <Box display="flex" gap={2}>
                        <FormControl variant="filled" fullWidth>
                            <InputLabel>Date From</InputLabel>
                            <FilledInput
                                type="datetime-local"
                                value={query.dateFrom || ""}
                                onChange={(e) =>
                                    setQuery({ ...query, dateFrom: e.target.value })
                                }
                            />
                        </FormControl>

                        <FormControl variant="filled" fullWidth>
                            <InputLabel>Date To</InputLabel>
                            <FilledInput
                                type="datetime-local"
                                value={query.dateTo || ""}
                                onChange={(e) =>
                                    setQuery({ ...query, dateTo: e.target.value })
                                }
                            />
                        </FormControl>
                    </Box>
                    <Box display="flex" gap={2}>
                        <FormControl variant="filled" fullWidth>
                            <InputLabel>From Block</InputLabel>
                            <FilledInput
                                type="number"
                                value={query.fromBlock || ""}
                                onChange={(e) =>
                                    setQuery({ ...query, fromBlock: Number(e.target.value) })
                                }
                            />
                        </FormControl>

                        <FormControl variant="filled" fullWidth>
                            <InputLabel>To Block</InputLabel>
                            <FilledInput
                                type="number"
                                value={query.toBlock || ""}
                                onChange={(e) =>
                                    setQuery({ ...query, toBlock: Number(e.target.value) })
                                }
                            />
                        </FormControl>
                    </Box>
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
                            onClick={()=>{
                                handleResetFilters();
                                onClose();
                            }}
                            disabled={isLoading}
                            sx={{ height: "50px" }}
                        >
                            Reset Filters
                        </Button>
                    </Box>
                </Stack>
            </DialogContent>

        </Dialog>
    );
}

export {GraphFilter};