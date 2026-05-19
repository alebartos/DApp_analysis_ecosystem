import React, {useState} from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    Stack,
    styled,
    Typography
} from "@mui/material";
import JsonView from "@uiw/react-json-view";
import {darkTheme} from "@uiw/react-json-view/dark";
import {Download, FileUpload, Delete} from "@mui/icons-material";
import {_downloadCSV, _downloadCSVOCEL, _downloadJson, _downloadJSONOCEL, _downloadOCEL, _xesDownload} from "../api/services";
import useDataContext from "../context/useDataContext";
import {Link} from "react-router";
import {HiddenInput} from "../components/HiddenInput";
import XMLViewer from "react-xml-viewer";

const CardContentNoPadding = styled(CardContent)(
    `
    padding-top: 0;
    &:last-child {
        padding-bottom: 0;
    }
    `
)

const MAX_DISPLAY_SIZE = 49;

const limitJsonSize = (data) => {
    if (!data) return null;

    // Handle array case
    if (Array.isArray(data)) {
        if (data.length > MAX_DISPLAY_SIZE) {
            return [
                ...data.slice(0, MAX_DISPLAY_SIZE),
                {__note: `+ ${data.length - MAX_DISPLAY_SIZE} items`}
            ];
        }
        return data;
    }

    // Handle object case
    if (typeof data === 'object') {
        // Special handling for OCEL structure
        if (data.events || data.objects || data.eventTypes || data.objectTypes) {
            const result = {};

            // Process each key in the OCEL object
            for (const key of Object.keys(data)) {
                // If the value is an array (like events, objects, etc.), limit it
                if (Array.isArray(data[key])) {
                    if (data[key].length > MAX_DISPLAY_SIZE) {
                        result[key] = [
                            ...data[key].slice(0, MAX_DISPLAY_SIZE),
                            {__note: `+ ${data[key].length - MAX_DISPLAY_SIZE} more ${key}`}
                        ];
                    } else {
                        result[key] = data[key];
                    }
                } else {
                    // For non-array values, just copy them
                    result[key] = data[key];
                }
            }
            return result;
        }

        // Normal object handling
        const keys = Object.keys(data);
        if (keys.length > MAX_DISPLAY_SIZE) {
            const limitedObj = {};
            keys.slice(0, MAX_DISPLAY_SIZE).forEach(key => {
                limitedObj[key] = data[key];
            });
            limitedObj.__note = `+ ${keys.length - MAX_DISPLAY_SIZE} properties`;
            return limitedObj;
        }
        return data;
    }

    return data;
};

function PageLayout({children, loading, setLoading}) {
    const {results, setResults, ocel, setOcel,setXes,xes} = useDataContext()

    const [showOcel, setShowOcel] = useState(false);
    const [showXes, setShowXes] = useState(false);


    const path = window.location.pathname

    const handleShowXes =() =>{
        setShowXes(!showXes)
    }
    const handleDeleteXes=()=>{
        setResults(null)
        setXes({
            xes:null
        })
        window.history.replaceState({}, '', path)
    }
    const handleShowOcel = () => {
        setShowOcel(!showOcel)
    }


    const handleDelete = () => {
        setResults(null)
        setOcel({
            eventTypes: [],
            objectTypes: [],
            events: [],
            objects: []
        })
        window.history.replaceState({}, '', path)
    }
    const handleFileChange = (e) => {
        const fileReader = new FileReader()
        fileReader.onload = (e) => {
            const content = e.target.result
            setResults(JSON.parse(content))
        }
        fileReader.readAsText(e.target.files[0])
        e.target.value = null
    }

    const downloadJson = async () => {
        setLoading && setLoading(true)
        const response = await _downloadJson(results)
        const href = window.URL.createObjectURL(response)
        const anchor = document.createElement('a')
        anchor.href = href
        anchor.download = "jsonLog.json"
        anchor.click()
        window.URL.revokeObjectURL(href)
        setLoading && setLoading(false)
    }

    const downloadCSV = async () => {
        setLoading && setLoading(true)
        const response = await _downloadCSV(results)
        const href = window.URL.createObjectURL(response)
        const anchor = document.createElement('a')
        anchor.href = href
        anchor.download = "jsonLog.csv"
        anchor.click()
        window.URL.revokeObjectURL(href)
        setLoading && setLoading(false)
    }
    const downloadXES = async () => {
        // console.log(results)
        setLoading && setLoading(true)
        try {
            const response = await _xesDownload(xes)
            const href = window.URL.createObjectURL(new Blob([response], { type: 'application/xml' }))
            const anchor = document.createElement('a')
            anchor.href = href
            anchor.download = "log.xes"
            anchor.click()
            window.URL.revokeObjectURL(href)
        } catch (error) {
            console.error("Error downloading XES file:", error)
        } finally {
            setLoading && setLoading(false)
        }
    }
    const downloadOcel = async () => {
        const response = await _downloadOCEL(ocel)
        const href = window.URL.createObjectURL(response)
        const anchor = document.createElement('a')
        anchor.href = href
        anchor.download = "ocel.json"
        anchor.click()
        window.URL.revokeObjectURL(href)
    }

    const downloadJSONOcel = async () => {
        const response = await _downloadJSONOCEL(ocel)
        const href = window.URL.createObjectURL(response)
        const anchor = document.createElement('a')
        anchor.href = href
        anchor.download = "ocel.jsonocel"
        anchor.click()
        window.URL.revokeObjectURL(href)
    }

    const downloadCSVOcel = async () => {
        const response = await _downloadCSVOCEL(ocel)
        const href = window.URL.createObjectURL(response)
        const anchor = document.createElement('a')
        anchor.href = href
        anchor.download = "ocel.csv"
        anchor.click()
        window.URL.revokeObjectURL(href)
    }

    const renderPageButtons=()=>{
        switch(path){
            case "/ocel":
                return(<Box display="flex" justifyContent="space-between" gap={2}>
                                        <Button component="label" variant="contained" startIcon={<FileUpload/>}
                                                sx={{padding: 1, height: "55px"}}>
                                            Upload File
                                            <HiddenInput type="file" onChange={handleFileChange}/>
                                        </Button>
                                        <Button variant="contained" onClick={downloadOcel}
                                                sx={{padding: 1, width: "125px", height: "55px"}}>
                                            <Typography color="white">Download JSON</Typography>
                                        </Button>
                                        <Link to="/">
                                            <Button color="error" variant="contained" onClick={() => {
                                                setOcel({eventTypes: [], objectTypes: [], events: [], objects: []})
                                            }} sx={{padding: 1, width: "125px", height: "55px"}}>
                                                <Typography>BACK</Typography>
                                            </Button>
                                        </Link>
                                        <Button variant="contained" onClick={downloadJSONOcel} sx={{
                                            padding: 1,
                                            width: "125px",
                                            height: "55px",
                                            backgroundColor: "#5316ec"
                                        }}>
                                            <Typography color="white">Download JSONOCEL</Typography>
                                        </Button>
                                        <Button variant="contained" onClick={downloadCSVOcel} sx={{
                                            padding: 1,
                                            width: "125px",
                                            height: "55px",
                                            backgroundColor: "#1dec16"
                                        }}>
                                            <Typography color="white">Download CSV OCEL</Typography>
                                        </Button>
                                    </Box>
                )
            case "/xes":
                return (<Box display="flex" justifyContent="space-between" gap={2}>
                                        <Button component="label" variant="contained" startIcon={<FileUpload/>}
                                                sx={{padding: 1, height: "55px"}}>
                                            Upload File
                                            <HiddenInput type="file" onChange={handleFileChange} />
                                        </Button>
                                            <Button disabled={!results} startIcon={<Download/>} onClick={downloadXES}
                                                    variant="contained" sx={{
                                                padding: 1,
                                                width: 120,
                                                backgroundColor: "#38a651",
                                                '&:hover': {backgroundColor: "#2f6749"}
                                            }}>
                                                <Typography variant="h6">XES</Typography>
                                            </Button>
                                        <Link to="/">
                                            <Button color="error" variant="contained" onClick={() => {setXes({xes: null})}} sx={{padding: 1, width: "125px", height: "55px"}}>
                                                <Typography>BACK</Typography>
                                            </Button>
                                        </Link>
                                    </Box>
                )
            default:
               return( <Box display="flex" justifyContent="space-evenly" alignItems="center" gap={1}>
                                        <Button disabled={!results} startIcon={<Download/>} onClick={downloadJson}
                                                variant="contained" sx={{padding: 1, width: 120}}>
                                            <Typography variant="h6">JSON</Typography>
                                        </Button>
                                        <Button disabled={!results} startIcon={<Download/>} onClick={downloadCSV}
                                                variant="contained" sx={{
                                            padding: 1,
                                            width: 120,
                                            backgroundColor: "#38a651",
                                            '&:hover': {backgroundColor: "#2f6749"}
                                        }}>
                                            <Typography variant="h6">CSV</Typography>
                                        </Button>
                                    </Box>
               )
        }
    }

    return (
        <Box display="flex" justifyContent="center" marginTop={5} paddingX={5} height="100%">
            <Grid container spacing={2}>
                <Grid item lg={6} md={12} width="100%">
                    {children}
                </Grid>
                <Grid item lg={6} md={12} width="100%">
                    <Stack spacing={1}>
                        <Card sx={{minWidth: "500px", height: "500px", backgroundColor: "#202020"}}>
                            <Box height="40px" display="flex" alignItems="center" justifyContent="space-between" padding={2}>
                                <Typography variant="h5" color="#FFFFFF">Contract Logs</Typography>
                                {path === "/ocel" && <Button variant="contained" sx={{padding: 1, width: "130px"}}
                                         onClick={handleShowOcel}>{showOcel ? "Show Logs" : "Show OCEL"}</Button>}
                                <Button disabled={!results} color="error"
                                        onClick={handleDelete} sx={{padding: 0, '&.Mui-disabled': {color: 'rgba(255, 0, 0, 0.5)'}}}>
                                    <Delete/>
                                </Button>
                                {path === "/xes" && <Button variant="contained" sx={{padding: 1, width: "130px"}}
                                         onClick={handleShowXes}>{showXes ? "Show Logs" : "Show XES"}</Button>}
                                <Button disabled={!results} color="error"
                                        onClick={handleDeleteXes} sx={{padding: 0, '&.Mui-disabled': {color: 'rgba(255, 0, 0, 0.5)'}}}>
                                    <Delete/>
                                </Button>
                            </Box>
                            <CardContentNoPadding sx={{ height: "calc(100% - 112px)", overflowY: "auto", overflowX: "auto", whiteSpace: "pre", overflow: "auto"}}>
                                {
                                     loading ? (
                                        <Box width="100%" height="100%" display="flex" justifyContent="center" alignItems="center">
                                            <CircularProgress />
                                        </Box>
                                    ) : showOcel ? (
                                        <JsonView value={ocel} style={{ ...darkTheme, fontSize: '14px' }} width="100%" />
                                    ) : showXes ? (
                                        <Box sx={{
                                            width: "100%",
                                            maxWidth: "100%",
                                            overflowX: "auto",  // Enables horizontal scrolling
                                            whiteSpace: "pre",  // Ensures text does not wrap
                                            backgroundColor: "#1e1e1e", // Optional: Dark theme background
                                            padding: 2
                                        }}>
                                            <Box sx={{
                                                display: "inline-block",  // Ensures the box takes the exact width of the XML content
                                                minWidth: "100%"  // Prevents shrinking
                                            }}>
                                                <XMLViewer xml={xes.xesString || "<empty></empty>"} />
                                            </Box>
                                        </Box>
                                    ) : results && (
                                        <JsonView value={results} style={{ ...darkTheme, fontSize: '14px' }} width="100%" />
                                    )
                                }
                            </CardContentNoPadding>
                        </Card>
                        {
                            renderPageButtons()
                        }
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}

export default PageLayout;
