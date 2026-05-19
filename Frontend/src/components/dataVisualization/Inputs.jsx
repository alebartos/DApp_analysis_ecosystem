import React from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { Box, TextField, Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useDataView } from "../../context/DataViewContext";
import SearchIcon from "@mui/icons-material/Search";
import DeleteSweepTwoToneIcon from "@mui/icons-material/DeleteSweepTwoTone";

// const data = [
//   { id: 0, smartContract: '0x1234567890123456789012345678901234567890', inputName: 'amount', inputType: "uint256", occurrences: 4234},
//   { id: 1, smartContract: '0x1234567890123456789012345678901234567890', inputName: 'share', inputType: "uint256", occurrences:5650 },
//   { id: 2, smartContract: '0x1234567890123456789012345678901234567890', inputName: 'amount', inputType: "uint256", occurrences: 6344 },
//   { id: 3, smartContract: '0x1234567890123456789012345678901234567890', inputName: 'recipient', inputType: "uint256", occurrences: 2352 },
//   { id: 4, smartContract: '0x1234567890123456789012345678901234567890', inputName: 'spender', inputType: "uint256", occurrences: 1345 },
//   { id: 5, smartContract: '0x1234567890123456789012345678901234567890', inputName: 'subtractedValue', inputType: "uint256", occurrences: 2340 },
// ];

const columns = [
	{ field: "contractAddress", headerName: "Smart Contract", width: 400 },
	{ field: "inputName", headerName: "Input Name", width: 200 },
	{ field: "inputType", headerName: "Input Type", width: 200 },
	{ field: "inputValue", headerName: "Input Value", width: 200 },
];

export default function Inputs({ data }) {
    const inputsGrid = Array.isArray(data?.inputsGrid) ? data?.inputsGrid : [];
    const inputsChart = Array.isArray(data?.inputsChart) ? data?.inputsChart : [];

	const [searchValue, setSearchValue] = React.useState("");
	const [filteredData, setFilteredData] = React.useState(inputsGrid || []);

	return (
		<div>
			<h1>Inputs</h1>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-start",
					width: "100%",
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
                                data: inputsChart.map((item) => item.count),
                            },
                        ]}
                        height={350}
                        width={880}
                        xAxis={[
                            {
                                data: inputsChart.map((item) => item.name),
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
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						width: "100%",
						gap: 2,
						marginBottom: 2,
					}}>
					<TextField
						label="Search by Contract Address"
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
								inputsGrid.filter((item) =>
									item.contractAddress.toLowerCase().includes(searchValue)
								)
							)
						}
						sx={{ width: "fit-content", height: "100%", minHeight: "56px" }}>
						<SearchIcon />
					</Button>
					<Button
						variant="contained"
						onClick={() => {
							setFilteredData(inputsGrid);
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
				<Box
					sx={{
						flexGrow: 1,
						width: "100%",
						height: 400,
					}}>
					<DataGrid
						rows={filteredData.map((item, index) => ({
							id: index,
							...item,
						}))}
						columns={columns}
					/>
				</Box>
			</Box>
		</div>
	);
}
