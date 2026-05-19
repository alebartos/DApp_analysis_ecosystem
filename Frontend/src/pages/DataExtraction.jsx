import React, {useState, useEffect} from 'react';
import {
    Alert,
    Box,
    Button, Checkbox, Chip, Dialog, DialogContent, DialogTitle,
    FilledInput,
    FormControl, IconButton, Input,
    InputLabel, MenuItem, Select, Slide, Slider, Snackbar,
    Stack, TextField,
    Typography,
} from "@mui/material";
import LinearProgress from "@mui/material/LinearProgress";

import {_sendData} from "../api/services";
import PageLayout from "../layouts/PageLayout";

import {HiddenInput} from "../components/HiddenInput";
import {FileUpload, FilterList} from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddBoxIcon from "@mui/icons-material/AddBox";
import {DateTimePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {DemoContainer} from "@mui/x-date-pickers/internals/demo";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {Link} from "react-router";
import useDataContext from '../context/useDataContext';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="down" ref={ref} {...props} />;
});

function HomePage() {

    dayjs.extend(utc)

    const defaultDate = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate()
    const defaultTime = new Date().getHours() + ':' + new Date().getMinutes()

    const {setResults} = useDataContext()

    const [contractName, setContractName] = useState("CakeOFT")
    const [contractAddress, setContractAddress] = useState("0x152649eA73beAb28c5b49B26eb48f7EAD6d4c898")
    const [impl_contract, setImplContractAddress] = useState("0x152649eA73beAb28c5b49B26eb48f7EAD6d4c898")
    const [fromBlock, setFromBlock] = useState("18698008")
    const [toBlock, setToBlock] = useState("18698323")

    const [network, setNetwork] = useState("Mainnet")
    const [extractionType,setExtractionType]=useState("OnlyDefault");
    const [loading, setLoading] = useState(false)
    const [smartContract, setSmartContract] = useState(null)

    const [error, setError] = useState()

    const [openFilters, setOpenFilters] = useState(false)

    const [filterGasUsed, setFilterGasUsed] = useState(false)
    const [gasUsed, setGasUsed] = useState([0, 1000000])
    const [filterGasPrice, setFilterGasPrice] = useState(false)
    const [gasPrice, setGasPrice] = useState([0, 10000000000])
    const [filterTimestamp, setFilterTimestamp] = useState(false)
    const [timestamp, setTimestamp] = useState([dayjs.utc(defaultDate + 'T' + defaultTime), dayjs.utc(defaultDate + 'T' + defaultTime)])
    const [senders, setSenders] = useState([])
    const [senderToAdd, setSenderToAdd] = useState("")
    const [functions, setFunctions] = useState([])
    const [functionToAdd, setFunctionToAdd] = useState("")
    const [activeFilter, setActiveFilter] = useState(new Set())

    const sendData = async () => {
        setLoading(true)

        const filters = {
            gasUsed: filterGasUsed ? gasUsed : null,
            gasPrice: filterGasPrice ? gasPrice : null,
            timestamp: filterTimestamp ? timestamp : null,
            senders: senders,
            functions: functions
        }
        let parameterForExtraction=extractionTypes.indexOf(extractionType)
        const oldParams = {
            contractName, contractAddress, impl_contract, fromBlock, toBlock, network, smartContract, filters,parameterForExtraction
        }
        const response = await _sendData({oldParams})
        if (response.status === 200) {
            setResults(response.data)
            setLoading(false)
        } else {
            setError(response.data)
            setLoading(false)
        }
    }

    const networks = ["Mainnet", "Sepolia", "Polygon", "Amoy"]  
    // the extractionTypes are mapped in this format OnlyDeafult=0,StorageState=1,Exetended=2
    const extractionTypes = ["Events-storage-internalExtended","Events-storage-internalPartial","Events"]

    useEffect(() => {
        switch (network) {
            case "Mainnet":
                setContractName("CakeOFT")
                setContractAddress("0x152649eA73beAb28c5b49B26eb48f7EAD6d4c898")
                setFromBlock("18698008")
                setToBlock("18698323")
                break
            case "Sepolia":
                setContractName("emergencyResponsePlan")
                setContractAddress("0xD4c4C6562cb70188d019C106D3C6305E74530247")
                setFromBlock("5713209")
                setToBlock("5713239")
                break
            case "Polygon":
                setContractName("")
                setContractAddress("")
                setFromBlock("")
                setToBlock("")
                break
            case "Amoy":
                setContractName("EmergencyResponsePlan")
                setContractAddress("0xD2FC7b1589b0F55f56105b7aE38D1Cc61C360DC5")
                setFromBlock("10949056")
                setToBlock("10949424")
                break
            default:
                console.log("Change Network")
        }

    }, [network, smartContract]);

    const deletItemFromSet = (item) => {
        setActiveFilter(prevState => {
            const newSet = new Set(prevState)
            newSet.delete(item)
            return newSet
        })
    }

    const addItemToSet = (item) => {
        setActiveFilter(prevState => {
            const newSet = new Set(prevState)
            newSet.add(item)
            return newSet
        })
    }

    const handleNetworkChange = (e) => {
        setNetwork(e.target.value)
    }
    const handelExtractionTypeChange = (e) => {
        setExtractionType(e.target.value)
    }

    const handleContractUpload = (e) => {
        const file = e.target.files[0]
        setSmartContract(file)
        e.target.value = null
    }

    window.onclick = function (event) {
        setError(null)
    }

    const handleGasUsedBlur = () => {
        if (gasUsed[0] < 0) setGasUsed([0, gasUsed[1]])
        if (gasUsed[1] < 0) setGasUsed([gasUsed[0], 0])
    }

    const handleGasUsedChange = (event, newValue) => {
        if (!Array.isArray(newValue)) return
        setGasUsed([newValue[0], newValue[1]])
    }

    const handleGasUsedCheck = () => {
        if (!filterGasUsed) {
            addItemToSet("gasUsed")
        } else {
            deletItemFromSet("gasUsed")
        }
        setFilterGasUsed(!filterGasUsed)
    }

    const handleGasPriceChange = (event, newValue) => {
        if (!Array.isArray(newValue)) return
        setGasPrice([newValue[0], newValue[1]])
    }

    const handleGasPriceBlur = () => {
        if (gasPrice[0] < 0) setGasPrice([0, gasPrice[1]])
        if (gasPrice[1] < 0) setGasPrice([gasPrice[0], 0])
    }

    const handleGasPriceCheck = () => {
        if (!filterGasPrice) {
            addItemToSet("gasPrice")
        } else {
            deletItemFromSet("gasPrice")
        }
        setFilterGasPrice(!filterGasPrice)
    }

    const handleTimestampCheck = () => {
        if (!filterTimestamp) {
            addItemToSet("timestamp")
        } else {
            deletItemFromSet("timestamp")
        }
        setFilterTimestamp(!filterTimestamp)
    }

    const handleAddSenders = () => {
        setSenders([...senders, senderToAdd.toLowerCase()])
        setSenderToAdd("")
        addItemToSet("senders")
    }

    const handleAddFunctions = () => {
        setFunctions([...functions, functionToAdd])
        setFunctionToAdd("")
        addItemToSet("functions")
    }

    const handleDeleteSender = (e) => {
        const newSenders = senders.filter(sender => sender !== e.currentTarget.name.toLowerCase())
        setSenders(newSenders)
        if (newSenders.length === 0) {
            deletItemFromSet("senders")
        }
    }

    const handleDeleteFunction = (e) => {
        const newFunctions = functions.filter(func => func !== e.currentTarget.name)
        setFunctions(newFunctions)
        if (newFunctions.length === 0) {
            deletItemFromSet("functions")
        }
    }

    const handleDeleteFilter = (filter) => {
        deletItemFromSet(filter)
        if (filter === "gasUsed") {
            setFilterGasUsed(false)
        }
        if (filter === "gasPrice") {
            setFilterGasPrice(false)
        }
        if (filter === "timestamp") {
            setFilterTimestamp(false)
        }
        if (filter === "senders") {
            setSenders([])
        }
        if (filter === "functions") {
            setFunctions([])
        }
    }

    const addContractAddress = (e) => {
        setContractAddress(e.target.value)
        
    }
    const addImpleContractAddress = (e) => {
        setImplContractAddress(e.target.value)
    }

    return (
        <>
            <Snackbar open={error} anchorOrigin={{vertical: 'top', horizontal: 'center'}}>
                <Alert severity="error" variant="filled" sx={{width: "100%"}}>
                    {error}
                </Alert>
            </Snackbar>
            <Dialog
                TransitionComponent={Transition}
                keepMounted
                open={openFilters}
                onClose={() => setOpenFilters(false)}
                maxWidth=""
            >
                <DialogTitle>
                    Filters
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" justifyContent="space-between" gap={3}>
                        <Box width={550}>
                            {/*Gas Used*/}
                            <Box display="flex" alignItems="center">
                                <Checkbox checked={filterGasUsed} onChange={handleGasUsedCheck}/>
                                <Typography fontWeight={700}>Gas Used</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" gap={1}>
                                <Input
                                    disabled={!filterGasUsed}
                                    value={gasUsed[0]}
                                    onChange={(e) => setGasUsed([e.target.value, gasUsed[1]])}
                                    onBlur={handleGasUsedBlur}
                                    type="number"
                                    inputProps={{
                                        step: 50,
                                        min: 0,
                                    }}
                                />
                                <Input
                                    disabled={!filterGasUsed}
                                    value={gasUsed[1]}
                                    onChange={(e) => setGasUsed([gasUsed[0], e.target.value])}
                                    onBlur={handleGasUsedBlur}
                                    type="number"
                                    inputProps={{
                                        step: 50,
                                        min: 0,
                                    }}
                                />
                            </Box>
                            <Slider
                                disabled={!filterGasUsed}
                                value={gasUsed}
                                onChange={handleGasUsedChange}
                                max={1000000}
                            />
                            {/*GAS PRICE*/}
                            <Box display="flex" alignItems="center">
                                <Checkbox checked={filterGasPrice} onChange={handleGasPriceCheck}/>
                                <Typography fontWeight={700}>Gas Price</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" gap={1}>
                                <Input
                                    disabled={!filterGasPrice}
                                    value={gasPrice[0]}
                                    onChange={(e) => setGasPrice([e.target.value, gasPrice[1]])}
                                    onBlur={handleGasPriceBlur}
                                    type="number"
                                    inputProps={{
                                        step: 50,
                                        min: 0,
                                    }}
                                />
                                <Input
                                    disabled={!filterGasPrice}
                                    value={gasPrice[1]}
                                    onChange={(e) => setGasPrice([gasPrice[0], e.target.value])}
                                    onBlur={handleGasPriceBlur}
                                    type="number"
                                    inputProps={{
                                        step: 50,
                                        min: 0,
                                    }}
                                />
                            </Box>
                            <Slider
                                disabled={!filterGasPrice}
                                value={gasPrice}
                                onChange={handleGasPriceChange}
                                max={10000000000}
                            />
                        </Box>
                        <Box>
                            <Box height={42} display="flex" alignItems="center">
                                <Typography fontWeight={700}>Senders</Typography>
                            </Box>
                            <Box height={100} overflow="auto">
                                <Box display="flex" gap={1}>
                                    <TextField value={senderToAdd}
                                               onChange={(event) => setSenderToAdd(event.target.value)}/>
                                    <IconButton onClick={handleAddSenders}>
                                        <AddBoxIcon color="primary" fontSize="large"/>
                                    </IconButton>
                                </Box>
                                {
                                    senders.map((sender, index) => (
                                        <Box key={index} display="flex" justifyContent="space-between"
                                             alignItems="center">
                                            <Typography width={220} overflow="hidden"
                                                        textOverflow="ellipsis">{sender}</Typography>
                                            <IconButton name={sender} onClick={(e) => handleDeleteSender(e)}>
                                                <DeleteIcon color="error" fontSize="medium"/>
                                            </IconButton>
                                        </Box>
                                    ))
                                }
                            </Box>
                        </Box>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="baseline" gap={3} marginTop={2}>
                        <Box width={550}>
                            <Box display="flex" alignItems="center">
                                <Checkbox checked={filterTimestamp}
                                          onChange={handleTimestampCheck}/>
                                <Typography fontWeight={700}>Timestamp</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between" gap={1}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DemoContainer components={['DateTimePicker']}>
                                        <DateTimePicker value={timestamp[0]}
                                                        onChange={(newValue) => setTimestamp([newValue, timestamp[1]])}
                                                        label="Start" disabled={!filterTimestamp}/>
                                    </DemoContainer>
                                </LocalizationProvider>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DemoContainer components={['DateTimePicker']}>
                                        <DateTimePicker value={timestamp[1]}
                                                        onChange={(newValue) => setTimestamp([timestamp[0], newValue])}
                                                        label="End" disabled={!filterTimestamp}/>
                                    </DemoContainer>
                                </LocalizationProvider>
                            </Box>
                        </Box>
                        <Box>
                            <Box height={42} display="flex" alignItems="center">
                                <Typography fontWeight={700}>Functions</Typography>
                            </Box>
                            <Box height={100} overflow="auto">
                                <Box display="flex" gap={1}>
                                    <TextField value={functionToAdd}
                                               onChange={(event) => setFunctionToAdd(event.target.value)}/>
                                    <IconButton onClick={handleAddFunctions}>
                                        <AddBoxIcon color="primary" fontSize="large"/>
                                    </IconButton>
                                </Box>
                                {
                                    functions.map((func, index) => (
                                        <Box key={index} display="flex" justifyContent="space-between"
                                             alignItems="center">
                                            <Typography width={220} overflow="hidden"
                                                        textOverflow="ellipsis">{func}</Typography>
                                            <IconButton name={func} onClick={(e) => handleDeleteFunction(e)}>
                                                <DeleteIcon color="error" fontSize="medium"/>
                                            </IconButton>
                                        </Box>
                                    ))
                                }
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
            <PageLayout loading={loading} setLoading={setLoading}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <IconButton size="large" sx={{color: "#ffb703"}} onClick={() => setOpenFilters(true)}>
                        <FilterList fontSize="large"/>
                    </IconButton>
                    {
                        [...activeFilter].map((filter, index) => (
                            <Chip key={index} color="error" name={filter} label={filter}
                                  onDelete={() => handleDeleteFilter(filter)}/>
                        ))
                    }
                    <FormControl fullWidth sx={{width: 200}}>
                        <InputLabel>Network</InputLabel>
                        <Select
                            variant="outlined"
                            value={network}
                            label="name"
                            onChange={(e) => handleNetworkChange(e)}
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
                    <FormControl fullWidth sx={{width: 200}}>
                        <InputLabel>ExtractionType</InputLabel>
                        <Select
                            variant="outlined"
                            value={extractionType}
                            label="name"
                            onChange={(e) => handelExtractionTypeChange(e)}
                        >
                            {
                                extractionTypes.map((name, index) => (
                                    <MenuItem key={index} value={name}>
                                        <Typography>{name}</Typography>
                                    </MenuItem>
                                ))
                            }
                        </Select>
                    </FormControl>
                </Box>
                <Stack justifyContent="space-between" height="calc(100% - 59px)">
                    <Box width="100%">
                        <Typography textAlign="center" variant="h3">
                            Data Extraction
                        </Typography>
                        <Stack spacing={2} justifyContent="center">
                            <FormControl variant="filled">
                                <InputLabel sx={{fontWeight: "700", fontSize: "18px"}}>Contract Name</InputLabel>
                                <FilledInput value={contractName} label="Contract Name"
                                             onChange={(e) => setContractName(e.target.value)}/>
                            </FormControl>
                            <FormControl variant="filled">
                                <InputLabel sx={{fontWeight: "700", fontSize: "18px"}}>Contract Address</InputLabel>
                                <FilledInput value={contractAddress} label="Contract Address"
                                             onChange={(e) => addContractAddress(e)}/>
                            </FormControl>
                            <FormControl variant="filled">
                               <InputLabel sx={{fontWeight: "700", fontSize: "18px"}}>Implementation contract address</InputLabel>
                               <FilledInput value={impl_contract} label="Implementation address"
                                            onChange={(e) => addImpleContractAddress(e)}/>
                            </FormControl>
                            <FormControl variant="filled">
                                <InputLabel sx={{fontWeight: "700", fontSize: "18px"}}>From Block</InputLabel>
                                <FilledInput value={fromBlock} label="From Block"
                                             onChange={(e) => setFromBlock(e.target.value)}/>
                            </FormControl>
                            <FormControl variant="filled">
                                <InputLabel sx={{fontWeight: "700", fontSize: "18px"}}>To Block</InputLabel>
                                <FilledInput value={toBlock} label="To Block"
                                             onChange={(e) => setToBlock(e.target.value)}/>
                            </FormControl>
                        </Stack>
                        <Stack>
                            <Box height="35px" display="flex" alignItems="center" width="50%" gap={2}>
                                {smartContract &&
                                    <>
                                        <Typography>{smartContract.name}</Typography>
                                        <Button sx={{color: "#de1616", '&:hover': {backgroundColor: "rgba(245,133,133,0.5)"}}} onClick={() => setSmartContract(null)}>
                                            <DeleteIcon sx={{color: "red"}}/>
                                        </Button>
                                    </>
                                }
                            </Box>
                            <Box display="flex" gap={1}>
                                <Button fullWidth component="label" startIcon={<FileUpload/>} variant="contained"
                                        disabled={loading}
                                        sx={{
                                            padding: 1,
                                            height: "40px",
                                            backgroundColor: "#86469C",
                                            '&:hover': {backgroundColor: "#512960"}
                                        }}
                                >
                                    Upload Smart Contract
                                    <HiddenInput type="file" accept=".sol" onChange={handleContractUpload}/>
                                </Button>
                                <Button fullWidth variant="contained" disabled={loading} onClick={sendData}
                                        sx={{
                                            padding: 1,
                                            height: "40px",
                                            backgroundColor: "#66cdaa",
                                            '&:hover': {backgroundColor: "#6fa287"}
                                        }}>
                                    <Box width="100%">
                                        {loading ?
                                            <LinearProgress/>
                                            :
                                            <>
                                                Extract Data
                                            </>
                                        }
                                    </Box>
                                </Button>
                            </Box>
                        </Stack>
                    </Box>
                </Stack>
            </PageLayout>
        </>
    )
}

export default HomePage;

