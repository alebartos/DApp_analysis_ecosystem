import { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Alert from "@mui/material/Alert";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import axios from "axios";
import { useDataView } from "../../../context/DataViewContext";
import { Box } from "@mui/material";

function TransactionsDialog({ open, onClose, payload }) {
	const [transactionsData, setTransactionsData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const { query } = useDataView();
	const abortControllerRef = useRef(null);

	useEffect(() => {
		// Create new AbortController for each request
		abortControllerRef.current = new AbortController();
		const signal = abortControllerRef.current.signal;

		const fetchData = async () => {
			setLoading(true);
			setError(null);
			try {
				const response = await axios.post(
					`http://localhost:8000/api/data/txs?sender=${payload.sender}`,
					query,
					{ signal } // Pass cancellation signal
				);

				if (signal.aborted) return;

				if (response.status === 200) {
					setTransactionsData(response.data);
				} else {
					setError("Failed to fetch activity data");
				}
			} catch (error) {
				if (error.name !== "CanceledError") {
					setError(error.message || "An error occurred");
				}
			} finally {
				if (!signal.aborted) {
					setLoading(false);
				}
			}
		};

		if (open && payload.sender) {
			fetchData();
		}

		// Cleanup function for aborting requests
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [open, payload.sender, query]);
	return (
		<Dialog
			fullWidth
			maxWidth="xl"
			open={open}
			onClose={() => onClose()}>
			<DialogTitle>Transactions of: {payload.sender}</DialogTitle>
			<DialogContent>
				{loading && <p>Loading sender's transactions...</p>}
				{error && <Alert severity="error">{error}</Alert>}
				{transactionsData && (
					<Box
						sx={{
							width: "100%",
							height: 600,
						}}>
						<RichTreeView items={transactionsData} />
					</Box>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={() => onClose()}>Close</Button>
			</DialogActions>
		</Dialog>
	);
}

TransactionsDialog.propTypes = {
	onClose: PropTypes.func.isRequired,
	open: PropTypes.bool.isRequired,
	payload: PropTypes.shape({
		sender: PropTypes.string,
	}).isRequired,
};

export { TransactionsDialog };
