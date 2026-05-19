import { BarChart } from "@mui/x-charts/BarChart";
import React from "react";
import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useDialogs } from "@toolpad/core/useDialogs";
import { CallsDialog } from "./dialogs/CallsDialog";


const columns = [
    {field: "transactionHash", headerName: "Transaction Hash",width:400},
    {field: "contractAddress", headerName: "Contract Address",width:400},
    {field: "activity", headerName: "Function Name",width:300},
];

export default function Call({data}) {
    const dialogs = useDialogs();
    const chart = Array.isArray(data?.call) ? data.call : [];
    const dataGrid = Array.isArray(data?.dataGrid) ? data.dataGrid : [];


    const handleRowClick = async (params) => {
        await dialogs.open(CallsDialog, {
            txHash: params.row.transactionHash,
            callId: params.row.callId,
        });
    };
    return (
        <div>
            <h1>Call</h1>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                }}>
                <Box
                    sx={{
                        width: "100%",
                        minWidth: {md: "400px"},
                        display: "flex",
                        justifyContent: "center",
                    }}>
                    <BarChart
                        series={[
                            {
                                data: chart.map((item) => item.count),
                            },
                        ]}
                        height={350}
                        width={880}
                        xAxis={[
                            {
                                data: chart.map((item) => item.callType),
                                scaleType: "band",
                                tickLabelStyle:{
                                    angle:45,
                                    fontSize: 12,
                                },
                                height: 60
                            },
                        ]}
                        yAxis={[
                            {
                                valueFormatter: (value) => {
                                    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
                                    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
                                    return value.toString();
                                },
                                width: 50,
                            }
                        ]}
                    />
                </Box>
                <Box
                    sx={{
                        flexGrow: 1,
                        width: "100%",
                        height: 400,
                    }}>
                    <DataGrid
                        rows = {(dataGrid || []).map((item,index)=> ({
                            id: index,
                            ...item,
                        }))}
                        columns={columns}
                        onRowClick={handleRowClick}
                    />
                </Box>
            </Box>
        </div>
    );
}
