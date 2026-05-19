import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Alert from "@mui/material/Alert";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import axios from "axios";
import { useDataView } from "../../../context/DataViewContext";
import { Box } from "@mui/material";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Pagination from "@mui/material/Pagination";

const formatValue = (key, value) => {
	if (
		typeof value === "string" &&
		(value.startsWith("0x") ||
			/^[0-9a-fA-F]{40}$/.test(value.replace("0x", "")))
	) {
		return (
			<Tooltip
				title={value}
				placement="top">
				<Typography
					component="span"
					variant="body2"
					sx={{ fontFamily: "monospace", color: "text.secondary" }}>
					{value}
				</Typography>
			</Tooltip>
		);
	}
	if (typeof value === "number" && value > 1e18) {
		return (
			<Typography
				component="span"
				variant="body2"
				sx={{ fontFamily: "monospace", color: "primary.main" }}>
				{value.toExponential(2)} (raw: {value.toLocaleString()})
			</Typography>
		);
	}
	if (typeof value === "boolean") {
		return (
			<Typography
				component="span"
				variant="body2"
				sx={{
					color: value ? "success.main" : "error.main",
					fontWeight: "bold",
				}}>
				{String(value)}
			</Typography>
		);
	}
	if (typeof value === "object" && value !== null) {
		return (
			<pre
				style={{
					whiteSpace: "pre-wrap",
					wordWrap: "break-word",
					padding: "8px",
					borderRadius: "4px",
					fontSize: "0.8em",
					maxHeight: "150px",
					overflowY: "auto",
				}}>
				{JSON.stringify(value, null, 2)}
			</pre>
		);
	}
	return (
		<Typography
			component="span"
			variant="body2">
			{String(value)}
		</Typography>
	);
};

function EventsDialog({ open, onClose, payload }) {
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(10);
	const { query } = useDataView();

	const { isFetching, error, data } = useQuery({
		queryKey: ["eventsData"],
		queryFn: () =>
			axios
				.post(
					`http://localhost:8000/api/data/events?eventName=${payload.eventName}`,
					query
				)
				.then((res) => res.data),
	});

	const totalPages = data ? Math.ceil(data.length / itemsPerPage) : 0;
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentEvents = data ? data.slice(startIndex, endIndex) : [];

	const handlePageChange = (_, value) => {
		setCurrentPage(value);
	};

	useEffect(() => {
		setCurrentPage(1);
	}, [open, payload.eventName]);

	return (
		<Dialog
			fullWidth
			maxWidth="xl"
			open={open}
			onClose={() => onClose()}>
			<DialogTitle>Events of: {payload.eventName}</DialogTitle>
			<DialogContent>
				{isFetching && <p>Loading events data...</p>}
				{error && <Alert severity="error">{error}</Alert>}
				{data && !isFetching && (
					<>
						<Box
							sx={{
								mb: 2,
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}>
							<Typography
								variant="body2"
								color="text.secondary">
								Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of{" "}
								{data.length} events
							</Typography>
							{totalPages > 1 && (
								<Pagination
									count={totalPages}
									page={currentPage}
									onChange={handlePageChange}
									color="primary"
									size="small"
								/>
							)}
						</Box>
						<Box sx={{ maxHeight: "calc(100vh - 300px)", overflowY: "auto" }}>
							{currentEvents.map((event, index) => (
								<Accordion
									key={`${event.transactionHash}-${index}`}
									sx={{ mb: 1 }}>
									<AccordionSummary
										expandIcon={<ExpandMoreIcon />}
										aria-controls={`panel${index}-content`}
										id={`panel${index}-header`}>
										<Typography
											variant="subtitle1"
											component="div">
											<Box
												component="span"
												sx={{ fontWeight: "bold" }}>
												Event: {event.eventName}
											</Box>
											<Box
												component="span"
												sx={{
													ml: 2,
													color: "text.secondary",
													fontSize: "0.9em",
												}}>
												(Tx:{" "}
												<Tooltip
													title={event.transactionHash}
													placement="top">
													<span>{event.transactionHash}</span>
												</Tooltip>
												)
											</Box>
										</Typography>
									</AccordionSummary>
									<AccordionDetails>
										<Paper
											variant="outlined"
											sx={{ p: 2, mb: 2 }}>
											<Typography
												variant="h6"
												gutterBottom>
												Transaction Context
											</Typography>
											<Typography variant="body2">
												<strong>Hash</strong>: {event.transactionHash}
											</Typography>
											<Typography variant="body2">
												<strong>Block Number</strong>: {event.blockNumber}
											</Typography>
											<Typography variant="body2">
												<strong>Timestamp</strong>:{" "}
												{event.timestamp
													? new Date(event.timestamp).toLocaleString()
													: "N/A"}
											</Typography>
											<Typography variant="body2">
												<strong>Contract Address</strong>:{" "}
												{event.contractAddress}
											</Typography>
											<Typography variant="body2">
												<strong>Sender</strong>: {event.sender}
											</Typography>
										</Paper>

										<Paper
											variant="outlined"
											sx={{ p: 2 }}>
											<Typography
												variant="h6"
												gutterBottom>
												Event Values
											</Typography>
											{Object.keys(event.eventValues).length > 0 ? (
												Object.entries(event.eventValues).map(
													([key, value]) => (
														<Box
															key={key}
															sx={{
																display: "flex",
																alignItems: "flex-start",
																mb: 0.5,
															}}>
															<Typography
																variant="body2"
																sx={{
																	minWidth: "120px",
																	fontWeight: "bold",
																	mr: 1,
																}}>
																{key}:
															</Typography>
															{formatValue(key, value)}
														</Box>
													)
												)
											) : (
												<Typography
													variant="body2"
													color="text.secondary">
													No specific event values found.
												</Typography>
											)}
										</Paper>
									</AccordionDetails>
								</Accordion>
							))}
						</Box>
						{totalPages > 1 && (
							<Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
								<Pagination
									count={totalPages}
									page={currentPage}
									onChange={handlePageChange}
									color="primary"
								/>
							</Box>
						)}
					</>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={() => onClose()}>Close</Button>
			</DialogActions>
		</Dialog>
	);
}

EventsDialog.propTypes = {
	onClose: PropTypes.func.isRequired,
	open: PropTypes.bool.isRequired,
	payload: PropTypes.shape({
		eventName: PropTypes.string,
	}).isRequired,
};

export { EventsDialog };
