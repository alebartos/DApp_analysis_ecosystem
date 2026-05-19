import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import {FileUpload,FilterList} from "@mui/icons-material"
import { HiddenInput } from "../components/HiddenInput";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import GasUsed from "../components/dataVisualization/GasUsed";
import Events from "../components/dataVisualization/Events";
import Call from "../components/dataVisualization/Call";
import Inputs from "../components/dataVisualization/Inputs";
import MostActiveSenders from "../components/dataVisualization/MostActiveSenders";
import StorageState from "../components/dataVisualization/StorageState";
import Time from "../components/dataVisualization/Time";
import {
    Button,
    CircularProgress,
    Typography,
    IconButton,
    Stack,
    InputLabel,
    FilledInput,
    Dialog,DialogContent, DialogTitle,
    Slide
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddBoxIcon from "@mui/icons-material/AddBox";
import { getData,importJSONToDB } from "../api/services";
import { useDataView } from "../context/DataViewContext";
import { useQuery, useQueryClient } from "react-query";
import {FilterDialog} from "../components/dataVisualization/dialogs/FilterDialog";
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';

/*const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="down" ref={ref} {...props} />;
});*/


const tabs = [
	{
		label: "Transaction",
		value: 0,
		type: "gasUsed",
		component: (data) => <GasUsed data={data} />,
	},
	{
		label: "Sender",
		value: 1,
		type: "mostActiveSenders",
		component: (data) => <MostActiveSenders data={data} />,
	},
	{
		label: "Time",
		value: 2,
		type: "time",
		component: (data) => <Time data={data} />,
	},
	{
		label: "Input",
		value: 3,
		type: "inputs",
		component: (data) => <Inputs data={data} />,
	},
	{
		label: "Event",
		value: 4,
		type: "events",
		component: (data) => <Events data={data} />,
	},
	{
		label: "Internal call",
		value: 5,
		type: "call",
		component: (data) => <Call data={data} />,
	},
	{
		label: "State Variable",
		value: 6,
		type: "storageState",
		component: (data) => <StorageState data={data} />,
	},
];

export default function DataViewPage() {
	const { selectedTab, setSelectedTabState, query, setQueryState } =
		useDataView();

	const { isLoading, data, error, refetch } = useQuery({
		queryKey: ["data", selectedTab, query],
		queryFn: () =>
			getData({
				type: tabs[selectedTab].type,
				query: query ?? null,
			}).then((r) => {
				return r.data;
			}),
        enabled: false
	});

    const [openDialog,setOpenDialog] = useState(false);

	console.log({ isLoading, data, error });

	const queryClient = useQueryClient();
	const invalidateQuery = () => {
		queryClient.invalidateQueries({ queryKey: ["data"] });
	};

	const handleImportJsonToDB=(e)=>{
		const fileReader = new FileReader();
		fileReader.onload = (event) => {
			const content = event.target.result;
			importJSONToDB(content)
		};
		if (e.target.files[0]) {
			fileReader.readAsText(e.target.files[0]);
		}
		e.target.value = null;
	}

    useEffect(()=>{
        refetch();
        },[selectedTab]);

	return (
		<div>
			<Box sx={{ width: "100%" }} >
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <IconButton size="large" sx={{color: "#ffb703"}} onClick={() => setOpenDialog(true)}>
                        <FilterList fontSize="large"/>
                    </IconButton>

                    <FilterDialog
                        open={openDialog}
                        onClose={() => setOpenDialog(false)}
                        query={query}
                        setQueryState={setQueryState}
                        isLoading={isLoading}
                        onApply={() => {
                            invalidateQuery();
                            refetch();
                            setOpenDialog(false);
                        }}
                        onImport={handleImportJsonToDB}
                    />

					<Tabs
						value={selectedTab}
						onChange={(_, newValue) => setSelectedTabState(newValue)}
						aria-label="tabs">
						{tabs.map((tab, index) => (
							<Tab
								key={index}
								label={tab.label}
							/>
						))}
					</Tabs>
				</Box>
				{error && <ErrorState {...error} />}
				{isLoading && <LoadingState />}
				{(!data || (Array.isArray(data) && data.length === 0)) &&
					!isLoading &&
					!error && <EmptyState />}
				{data && (
					<Box sx={{ p: 3 }}>{tabs[selectedTab]?.component(data)}</Box>
				)}
			</Box>
		</div>
	);
}

const ErrorState = ({ error }) => (
	<Box
		sx={{
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			height: "400px",
		}}>
		<p style={{ color: "red" }}>{error}</p>
	</Box>
);

const LoadingState = () => (
	<Box
		sx={{
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			height: "400px",
		}}>
		<CircularProgress />
	</Box>
);

const EmptyState = () => {
	const { query } = useDataView();

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "center",
				height: "400px",
			}}>
			<p>No data available for this tab with the selected filters:</p>
			<Box sx={{ maxWidth: "400px", textAlign: "center", mb: 2 }}>
				{query.contractAddress && (
					<p>
						<strong>Contract Address:</strong> {query.contractAddress}
					</p>
				)}
				{query.dateFrom && (
					<p>
						<strong>Date From:</strong>{" "}
						{new Date(query.dateFrom).toLocaleDateString()}
					</p>
				)}
				{query.dateTo && (
					<p>
						<strong>Date To:</strong>{" "}
						{new Date(query.dateTo).toLocaleDateString()}
					</p>
				)}
				{query.fromBlock && (
					<p>
						<strong>From Block:</strong> {query.fromBlock}
					</p>
				)}
				{query.toBlock && (
					<p>
						<strong>To Block:</strong> {query.toBlock}
					</p>
				)}
				{!query.contractAddress &&
					!query.dateFrom &&
					!query.dateTo &&
					!query.fromBlock &&
					!query.toBlock && <p>No filters applied</p>}
			</Box>
			<p>Please adjust your filters or try a different tab.</p>
		</Box>
	);
};
