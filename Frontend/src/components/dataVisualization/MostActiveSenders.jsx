import React from "react";
import { Box, TextField, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useDataView } from "../../context/DataViewContext";
import SearchIcon from "@mui/icons-material/Search";
import DeleteSweepTwoToneIcon from "@mui/icons-material/DeleteSweepTwoTone";
import { useDialogs } from "@toolpad/core/useDialogs";
import { TransactionsDialog } from "./dialogs/TransactionsDialog";

const columns = [
	{ field: "sender", headerName: "Sender", width: 400 },
	{
		field: "numberOfTransactions",
		headerName: "Number of Transactions",
		width: 200,
	},
	{ field: "averageGasUsed", headerName: "Average Gas Used", width: 200 },
];

export default function MostActiveSenders({ data }) {
	const dialogs = useDialogs();

	const [searchValue, setSearchValue] = React.useState("");
	const [filteredData, setFilteredData] = React.useState(data || []);

	const handleRowClick = async (params) => {
		await dialogs.open(TransactionsDialog, {
			sender: params.row.sender,
		});
	};

	return (
		<div>
			<h1>Most Active Senders</h1>
			<Box
				sx={{
					flexGrow: 1,
					width: "100%",
					height: 400,
				}}>
				<Box
					sx={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						gap: 2,
						marginBottom: 2,
					}}>
					<TextField
						label="Search by Sender"
						variant="outlined"
						fullWidth
						value={searchValue}
						placeholder="0x..."
						onChange={(e) => setSearchValue(e.target.value.toLowerCase())}
					/>
					<Button
						variant="contained"
						onClick={() =>
							setFilteredData(
								data.filter((item) =>
									item.sender.toLowerCase().includes(searchValue)
								)
							)
						}
						sx={{ width: "fit-content", height: "100%", minHeight: "56px" }}>
						<SearchIcon />
					</Button>
					<Button
						variant="contained"
						onClick={() => {
							setFilteredData(data);
							setSearchValue("");
						}}
						sx={{
							width: "fit-content",
							backgroundColor: "red",
							color: "white",
							height: "100%",
							minHeight: "56px",
						}}>
						<DeleteSweepTwoToneIcon />
					</Button>
				</Box>
				<DataGrid
					rows={filteredData.map((item, index) => ({
						id: index,
						sender: item.sender || "Unknown",
						numberOfTransactions: item.numberOfTransactions || 0,
						averageGasUsed: item.averageGasUsed || 0,
					}))}
					columns={columns}
					onRowClick={handleRowClick}
				/>
			</Box>
		</div>
	);
}
