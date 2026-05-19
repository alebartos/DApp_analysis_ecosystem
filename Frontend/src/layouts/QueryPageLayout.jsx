import React from 'react';
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
import { darkTheme } from "@uiw/react-json-view/dark";
import { Download, Delete } from "@mui/icons-material";
import { _downloadJson } from "../api/services";

const CardContentNoPadding = styled(CardContent)(
    `
    padding-top: 0;
    &:last-child {
        padding-bottom: 0;
    }
    `
);

function QueryPageLayout({ children, loading, setLoading, results, setResults }) {
    const path = window.location.pathname;

    const handleDelete = () => {
        setResults(null);
        window.history.replaceState({}, '', path);
    };

    const downloadJson = async () => {
        if (setLoading) setLoading(true);
        const response = await _downloadJson(results);
        const href = window.URL.createObjectURL(response);
        const anchor = document.createElement('a');
        anchor.href = href;
        anchor.download = "jsonLog.json";
        anchor.click();
        window.URL.revokeObjectURL(href);
        if (setLoading) setLoading(false);
    };

    const hasResults = results && Array.isArray(results) && results.length > 0;

    return (
        <Box display="flex" justifyContent="center" marginTop={2} paddingX={5} height="100%">
            <Grid container spacing={2}>
                <Grid item lg={6} md={12} width="100%">
                    {children}
                </Grid>
                <Grid item lg={6} md={12} width="100%">
                    <Stack spacing={1}>
                        <Card sx={{ minWidth: "500px", height: "500px", backgroundColor: "#202020" }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" padding={2}>
                                <Typography variant="h5" color="#FFFFFF">Contract Logs</Typography>
                                <Button disabled={!hasResults} color="error" onClick={handleDelete} sx={{ padding: 0, '&.Mui-disabled': {color: 'rgba(255, 0, 0, 0.5)'} }}>
                                    <Delete />
                                </Button>
                            </Box>
                            <CardContentNoPadding sx={{ height: "calc(100% - 112px)", overflow: "auto" }}>
                                {
                                    loading ? (
                                        <Box width="100%" height="100%" display="flex" justifyContent="center" alignItems="center">
                                            <CircularProgress />
                                        </Box>
                                    ) : hasResults ? (
                                        <JsonView
                                            value={results}
                                            style={{...darkTheme, fontSize: '14px'}}
                                            collapsed={2}
                                            enableClipboard={false}
                                            displayDataTypes={false}
                                            displayObjectSize={false}
                                        />
                                    ) : (
                                        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                            <Typography variant="h6" color="textSecondary">No data to display</Typography>
                                        </Box>
                                    )
                                }
                            </CardContentNoPadding>
                        </Card>
                        <Box display="flex" justifyContent="space-evenly" alignItems="center" gap={1}>
                            <Button disabled={!hasResults} startIcon={<Download />} onClick={downloadJson} variant="contained" sx={{ padding: 1, width: 120 }}>
                                <Typography variant="h6">JSON</Typography>
                            </Button>
                        </Box>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}

export default QueryPageLayout;
