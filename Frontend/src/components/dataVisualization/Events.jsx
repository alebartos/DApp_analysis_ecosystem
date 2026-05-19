import { BarChart } from "@mui/x-charts/BarChart";
import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useDialogs } from "@toolpad/core/useDialogs";
import { EventsDialog } from "./dialogs/EventsDialog";

const columns = [
	{ field: "contractAddress", headerName: "Smart Contract", width: 400 },
	{ field: "eventName", headerName: "Event Name", width: 200 },
	{ field: "count", headerName: "Occurrences", width: 200 },
];

export default function Events({ data }) {
	const dialogs = useDialogs();

	const handleRowClick = async (params) => {
		await dialogs.open(EventsDialog, {
			eventName: params.row.eventName,
		});
	};
	return (
		<div>
			<h1>Events</h1>
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
                                data: data.map((item) => item.eventName),
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
							id: index,
							...item,
							timestamp: new Date(Date.parse(item.timestamp)),
						}))}
						columns={columns}
						onRowClick={handleRowClick}
					/>
				</Box>
			</Box>
		</div>
	);
}
