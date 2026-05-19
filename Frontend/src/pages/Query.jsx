import React, {useEffect, useState} from 'react';
import {
    Box,
    Button,
    FormControl, Grid,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Typography
} from "@mui/material";
import {Delete} from '@mui/icons-material';
import LinearProgress from "@mui/material/LinearProgress";
import {_searchTransactionByQuery} from "../api/services";
import NestedField from '../components/query/NestedField';
import RangeFields from '../components/query/RangeFields';
import InputsForm from '../components/query/InputsForm';
import StorageStateForm from '../components/query/StorageStateForm';
import InternalTxsForm from '../components/query/InternalTxsForm';
import EventsForm from '../components/query/EventsForm';
import QueryPageLayout from "../layouts/QueryPageLayout";

function Query() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        transactionHash: '',
        contractAddress: '',
        sender: '',
        gasUsed: '',
        gasUsedFrom: '',
        gasUsedTo: '',
        functionName: '',
        blockNumber: '',
        blockNumberFrom: '',
        blockNumberTo: '',
        timestampFrom: '',
        timestampTo: '',
        inputs: {
            inputName: '',
            type: '',
            inputValue: ''
        },
        storageState: {
            variableName: '',
            type: '',
            variableValue: '',
            variableRawValue: ''
        },
        internalTxs: {
            callType: '',
            to: ''
        },
        events: {
            eventName: ''
        }
    });

    const [results, setResults] = useState([]);

    const handleChange = (event) => {
        const {name, value} = event.target;
        setFormData({...formData, [name]: value});
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setLoading(true);

        const filterEmptyFields = (obj, parentKey = '') => {
            return Object.keys(obj).reduce((acc, key) => {
                const value = obj[key];
                const newKey = parentKey ? `${parentKey}.${key}` : key;

                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    const nestedObject = filterEmptyFields(value, newKey);
                    if (Object.keys(nestedObject).length > 0) {
                        acc = {...acc, ...nestedObject};
                    }
                } else if (value !== '' && value !== null && value !== undefined) {
                    acc[newKey] = value;
                }
                return acc;
            }, {});
        };

        const filteredData = filterEmptyFields(formData);

        filteredData.network = network;

        _searchTransactionByQuery(filteredData)
            .then(response => {
                setResults(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Errore nell\'esecuzione della query:', error);
                setLoading(false);
            });
    };

    const [network, setNetwork] = useState("Mainnet")

    const networks = ["Mainnet", "Sepolia", "Polygon", "Amoy"]

    useEffect(() => {
        switch (network) {
            case "Mainnet":
                break
            case "Sepolia":
                break
            case "Polygon":
                break
            case "Amoy":
                break
            default:
                console.log("Change Network")
        }

    }, [network]);

    const handleNetworkChange = (e) => {
        setNetwork(e.target.value)
    }

    return (
        <Box>
            <QueryPageLayout loading={loading} setLoading={setLoading} results={results} setResults={setResults}>
                <Stack justifyContent="space-evenly" height="100%">
                    <Box display="flex" justifyContent="space-between" gap={5}>
                        <Box width="100%">
                            <Box mb={4} display="flex" justifyContent="space-between">
                                <Typography textAlign="center" variant="h3">
                                    Transaction Extractor
                                </Typography>
                                <FormControl fullWidth sx={{width: 200}}>
                                    <InputLabel>Network</InputLabel>
                                    <Select
                                        variant="outlined"
                                        value={network}
                                        label="name"
                                        onChange={handleNetworkChange}
                                    >
                                        {
                                            networks.map((name, index) => (
                                                <MenuItem key={index} value={name}>
                                                    <Typography>{name}</Typography>
                                                </MenuItem>
                                            ))
                                        }
                                    </Select>
                                </FormControl>
                            </Box>
                            <Stack spacing={2} justifyContent="center">
                                <Box display="flex" alignItems="center" gap={2}>
                                    <NestedField label="Transaction Hash" name="transactionHash" value={formData.transactionHash}
                                                 onChange={handleChange}/>
                                </Box>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <NestedField label="Contract Address" name="contractAddress"
                                                 value={formData.contractAddress} onChange={handleChange}/>
                                </Box>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <NestedField label="Sender" name="sender" value={formData.sender}
                                                 onChange={handleChange}/>
                                </Box>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <RangeFields
                                        title="Gas Used"
                                        name="gasUsed"
                                        from={formData.gasUsedFrom}
                                        to={formData.gasUsedTo}
                                        type="number"
                                        onChange={handleChange}
                                    />
                                </Box>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <NestedField label="Function Name" name="functionName" value={formData.functionName}
                                                 onChange={handleChange}/>
                                </Box>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <RangeFields
                                        title="Block Number"
                                        name="blockNumber"
                                        from={formData.blockNumberFrom}
                                        to={formData.blockNumberTo}
                                        type="number"
                                        onChange={handleChange}
                                    />
                                </Box>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <RangeFields
                                        title="Timestamp"
                                        name="timestamp"
                                        from={formData.timestampFrom}
                                        to={formData.timestampTo}
                                        type="datetime-local"
                                        onChange={handleChange}
                                    />
                                </Box>
                            </Stack>
                        </Box>
                    </Box>
                </Stack>
            </QueryPageLayout>
            <Box marginTop={2} paddingX={5}>
                <Grid container columnSpacing={2}>
                    <Grid item sm={12} md={3}>
                        <InputsForm inputs={formData.inputs}
                                    setInputs={(inputs) => setFormData({...formData, inputs})}/>
                    </Grid>
                    <Grid item sm={12} md={3}>
                        <StorageStateForm storageState={formData.storageState}
                                          setStorageState={(storageState) => setFormData({
                                              ...formData,
                                              storageState
                                          })}/>
                    </Grid>
                    <Grid item sm={12} md={3}>
                        <InternalTxsForm internalTxs={formData.internalTxs}
                                         setInternalTxs={(internalTxs) => setFormData({
                                             ...formData,
                                             internalTxs
                                         })}/>
                    </Grid>
                    <Grid item sm={12} md={3}>
                        <EventsForm events={formData.events}
                                    setEvents={(events) => setFormData({...formData, events})}/>
                    </Grid>
                </Grid>
                <Box display="flex" justifyContent="space-between" gap={2} marginTop={2}>
                    <Button
                        onClick={handleSubmit}
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{
                            padding: 1,
                            height: "40px",
                            backgroundColor: "#66cdaa",
                            '&:hover': {backgroundColor: "#6fa287"}
                        }}
                    >
                        <Box width="100%">
                            {loading ? <LinearProgress/> : <>Search</>}
                        </Box>
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={() => {
                            setFormData({
                                txHash: '',
                                contractAddress: '',
                                sender: '',
                                gasUsed: '',
                                gasUsedFrom: '',
                                gasUsedTo: '',
                                activity: '',
                                blockNumber: '',
                                blockNumberFrom: '',
                                blockNumberTo: '',
                                timestamp: '',
                                timestampFrom: '',
                                timestampTo: '',
                                inputs: {
                                    inputName: '',
                                    type: '',
                                    inputValue: ''
                                },
                                storageState: {
                                    variableName: '',
                                    type: '',
                                    variableValue: '',
                                    variableRawValue: ''
                                },
                                internalTxs: {
                                    callType: '',
                                    to: ''
                                },
                                events: {
                                    eventName: ''
                                }
                            });

                        }}
                        sx={{
                            padding: 1,
                            height: "40px",
                            backgroundColor: "#f44336",
                            '&:hover': {backgroundColor: "#d32f2f"}
                        }}
                        startIcon={<Delete/>}
                    >
                        Clear all fields
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

export default Query;
