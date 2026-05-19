import { BarChart } from "@mui/x-charts/BarChart";
import React from "react";
import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useDialogs } from "@toolpad/core/useDialogs";
import StorageHistoryDialog from "./dialogs/StorageHistoryDialog";
const columns = [
	{ field: "variableName", headerName: "Variable Name", width: 400 },
	{ field: "count", headerName: "Occurrences", width: 200 },
];

export default function StorageState({ data }) {
	const dialogs = useDialogs();

	const handleRowClick = async (params) => {
		await dialogs.open(StorageHistoryDialog, {
			variableName: params.row.variableName,
		});
	};

	return (
		<div>
			<h1>Storage State</h1>
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
						minWidth: { md: "400px" },
						display: "flex",
						justifyContent: "center",
					}}>
					<BarChart
						series={[
							{
								data: data.map((item) => item.count),
							},
						]}
						height={350}
						width={880}
						xAxis={[
                            {
                                data: data.map((item) => item.variableName),
                                scaleType: "band",
                                tickLabelStyle:{
                                    angle:45,
                                    fontSize: 12,
                                },
                                height: 60
                            }
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
						rows={data.map((item, index) => ({
							...item,
							id: index,
						}))}
						columns={columns}
						onRowClick={handleRowClick}
					/>
				</Box>
			</Box>
		</div>
	);
}
