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
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import Pagination from "@mui/material/Pagination";

function CallsDialog({ open, onClose, payload }) {
	const [page, setPage] = useState(1);
	const [limit] = useState(20);

	const { query } = useDataView();

	const { isLoading, error, data } = useQuery({
        queryKey: [
            "callsData",
            payload.txHash,
            payload.callId,
            page
        ],
		queryFn: () =>
			axios
				.post(
					`http://localhost:8000/api/data/internalTxs?txHash=${payload.txHash}&callId=${payload.callId}&page=${page-1}&limit=${limit}`,
					query
				)
				.then((res) => {
					return res.data;
				}),
		keepPreviousData: true,
        enabled: open && !!payload.txHash,
	});

	useEffect(() => {
		setPage(1);
	}, [open, payload.txHash]);

	return (
		<Dialog
			fullWidth
			maxWidth="xl"
			open={open}
			onClose={() => onClose()}>
			<DialogTitle>Transaction: {payload.txHash}</DialogTitle>
			<DialogContent>
				{isLoading && <p>Loading calls data...</p>}
				{error && <Alert severity="error">{error}</Alert>}
				{data && (
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
								Showing calls for page: {page}
							</Typography>
							{data.totalPages > 1 && (
								<Pagination
									count={data.totalPages}
									page={page}
									onChange={(_, newPage) => setPage(newPage)}
									showFirstButton
									showLastButton
								/>
							)}
						</Box>
						<Box
							sx={{
								width: "100%",
								height: 600,
							}}>
							<RichTreeView items={data.items} />
						</Box>
					</>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={() => onClose()}>Close</Button>
			</DialogActions>
		</Dialog>
	);
}

CallsDialog.propTypes = {
	onClose: PropTypes.func.isRequired,
	open: PropTypes.bool.isRequired,
	payload: PropTypes.shape({
        txHash: PropTypes.string,
        contractAddress: PropTypes.string,
        sender: PropTypes.string,
        activity: PropTypes.string,
        depth: PropTypes.number,
	}).isRequired,
};

export { CallsDialog };
