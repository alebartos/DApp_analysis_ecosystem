import { PieChart } from "@mui/x-charts/PieChart";
import { Box, Typography, Paper, Grid } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { BarChart } from "@mui/x-charts/BarChart";
import { useDialogs } from "@toolpad/core/useDialogs";
import { ActivityDialog } from "./dialogs/ActivityDialog";
import {TransactionDialog} from "./dialogs/TransactionDialog";

const columns = [
	{ field: "smartContract", headerName: "Smart Contract", width: 300 },
	{ field: "count", headerName: "Count", width: 120 },
	{ field: "activity", headerName: "Function", width: 150 },
	{ field: "gasUsed", headerName: "Gas Used", width: 150 },
];

const columnsTransactions = [
    {field: "contractAddress", headerName: "Smart Contract", width: 300},
    {field: "transactionHash", headerName: "Transaction Hash", width: 300},
    {field: "functionName", headerName: "Function", width: 150},
    {field: "blockNumber", headerName:"Block Number", width: 150},
    {field:"gasUsed", headerName: "Gas Used", width: 200},
]

export default function GasUsed({ data }) {

	const dialogs = useDialogs();
    const gasUsed = Array.isArray(data.gasUsed) ? data.gasUsed : [];
    const dataTransactions = Array.isArray(data.transaction) ? data.transaction : [];
	// console.log(gasUsed)
	// console.log(dataTransactions)
	const handleRowClick = async (params) => {
		await dialogs.open(ActivityDialog, {
			activity: params.row.activity,
		});
	};

    const handleRowClickTransaction = async (params)=>{
        await dialogs.open(TransactionDialog,{
            txHash: params.row.transactionHash,
        });
    }

	return (
		<Box sx={{ p: 3 }}>
            <Box sx={{ height: 400, width: "100%" }}>
                <DataGrid
                    rows = {dataTransactions.map((item, index) =>({
                            id: index,
                            ...item,
                        })
                    )}
                    onRowClick={handleRowClickTransaction}
                    columns={columnsTransactions}
                    pageSize={10}
                    sx={{
                        "& .MuiDataGrid-row:hover": {
                            cursor: "pointer",
                        },
                    }}
                />
            </Box>
			<Box sx={{ mb: 2 }}>
				<Typography
					variant="h4"
					component="h1"
					gutterBottom>
					Gas Usage Analysis
				</Typography>
				<Typography
					variant="body1"
					color="text.secondary">
					Avg Gas Used per Transaction:{" "}
					<strong>
						{(gasUsed.reduce((acc, item) => acc + item.gasUsed, 0) / gasUsed.length).toFixed(0)}
					</strong>
				</Typography>
			</Box>
			{/* Charts Section */}
			<Grid
				container
				spacing={3}
				sx={{ mb: 4 }}>
				{/* Pie Chart */}
				<Grid
					item
					xs={12}
					lg={6}>
					<Paper sx={{ p: 3, height: "100%" }}>
						<Typography
							variant="h6"
							gutterBottom>
							Gas Distribution
						</Typography>
						<Box sx={{ display: "flex", justifyContent: "center" }}>
							<PieChart
								series={[
									{
										data: gasUsed.map((item, index) => ({
											id: index,
											value: item.gasUsed,
											label: item.activity,
										})),
										innerRadius: 30,
										outerRadius: 120,
										paddingAngle: 2,
									},
								]}
								width={400}
								height={300}
								slotProps={{
									legend: {
										direction: "column",
										position: { vertical: "middle", horizontal: "right" },
									},
								}}
							/>
						</Box>
					</Paper>
				</Grid>

				{/* Bar Chart */}
				<Grid
					item
					xs={12}>
					<Paper sx={{ p: 3 }}>
						<Typography
							variant="h6"
							gutterBottom>
							Function Occurrencies
						</Typography>
						<Box sx={{ width: "100%", overflowX: "auto" }}>
							<BarChart
								series={[
									{
										data: gasUsed.map((item) => item.count),
										label: "Transaction Count",
									},
								]}
								height={350}
								width={880}
								xAxis={[
									{
										data: gasUsed.map((item) => item.activity),
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
								margin={{ left: 10, right: 10, top: 40, bottom: 80 }}
							/>
						</Box>
					</Paper>
				</Grid>
			</Grid>
			{/* Data Table */}
			<Paper sx={{ p: 3 }}>
				<Typography
					variant="h6"
					gutterBottom>
					Breakdown
				</Typography>
				<Box sx={{ height: 400, width: "100%" }}>
					<DataGrid
						rows={gasUsed.map((item, index) => ({
							...item,
							smartContract: item.contract || "N/A",
							id: index,
						}))}
						columns={columns}
						onRowClick={handleRowClick}
						pageSize={10}
						disableSelectionOnClick
						sx={{
							"& .MuiDataGrid-row:hover": {
								cursor: "pointer",
							},
						}}
					/>
				</Box>
			</Paper>
		</Box>
	);
}
