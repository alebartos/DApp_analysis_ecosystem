import PropTypes from "prop-types";
import { useState, useMemo } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Typography,
	Box,
	Card,
	CardContent,
	Grid,
	Chip,
	IconButton,
	Tabs,
	Tab,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	CircularProgress,
	Alert,
	Pagination,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Switch,
	FormControlLabel,
} from "@mui/material";
import {
	Close as CloseIcon,
	TrendingUp as TrendingUpIcon,
	TrendingDown as TrendingDownIcon,
	Timeline as TimelineIcon,
	Tune as TuneIcon,
} from "@mui/icons-material";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { useQuery } from "react-query";
import axios from "axios";
import { useDataView } from "../../../context/DataViewContext";

const StorageHistoryDialog = ({ open, onClose, payload }) => {
	const [activeTab, setActiveTab] = useState(0);
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(100);
	const [sampleRate, setSampleRate] = useState(1);
	const [showAllChartData, setShowAllChartData] = useState(false);
	const { query } = useDataView();

	const { isLoading, error, data } = useQuery({
		queryKey: ["storageHistory", payload.variableName, page, limit, sampleRate],
		queryFn: () =>
			axios
				.post(
					`http://localhost:8000/api/data/storageState?variableName=${payload.variableName}&limit=${limit}&page=${page}&sampleRate=${sampleRate}`,
					query
				)
				.then((res) => res.data),
		enabled: open && !!payload.variableName,
		keepPreviousData: true,
	});

	const handleTabChange = (event, newValue) => {
		setActiveTab(newValue);
	};

	const handlePageChange = (event, newPage) => {
		setPage(newPage);
	};

	const handleLimitChange = (event) => {
		setLimit(event.target.value);
		setPage(1); // Reset to first page
	};

	const handleSampleRateChange = (event) => {
		setSampleRate(event.target.value);
		setPage(1);
	};

	const formatValue = (value) => {
		if (typeof value === "number") {
			if (value > 1e15) {
				return value.toExponential(2);
			}
			return value.toLocaleString();
		}
		return value;
	};

	const formatTimestamp = (timestamp) => {
		return new Date(timestamp).toLocaleString();
	};

	// Memoize chart data to prevent unnecessary re-renders
	const chartData = useMemo(() => {
		if (!data?.chartData) return [];
		return showAllChartData ? data.chartData : data.chartData.slice(0, 500);
	}, [data?.chartData, showAllChartData]);

	const CustomTooltip = ({ active, payload, label }) => {
		if (active && payload && payload.length) {
			const data = payload[0].payload;
			return (
				<Card sx={{ p: 2, maxWidth: 300 }}>
					<Typography
						variant="subtitle2"
						gutterBottom>
						Block {data.blockNumber}
					</Typography>
					<Typography
						variant="body2"
						color="text.secondary"
						gutterBottom>
						{formatTimestamp(data.timestamp)}
					</Typography>
					<Typography variant="body2">
						<strong>Value:</strong> {formatValue(data.value)}
					</Typography>
					{data.change && (
						<Typography
							variant="body2"
							color={data.change > 0 ? "success.main" : "error.main"}>
							<strong>Change:</strong> {data.change > 0 ? "+" : ""}
							{formatValue(data.change)}
							{data.changePercent && ` (${data.changePercent.toFixed(4)}%)`}
						</Typography>
					)}
					<Typography
						variant="caption"
						display="block"
						sx={{ mt: 1 }}>
						Tx: {data.transactionHash.substring(0, 10)}...
					</Typography>
				</Card>
			);
		}
		return null;
	};

	const renderControls = () => (
		<Box sx={{ mb: 2, p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
			<Box
				display="flex"
				alignItems="center"
				gap={2}
				flexWrap="wrap">
				<TuneIcon color="action" />
				<FormControl
					size="small"
					sx={{ minWidth: 120 }}>
					<InputLabel>Items per page</InputLabel>
					<Select
						value={limit}
						onChange={handleLimitChange}
						label="Items per page">
						<MenuItem value={50}>50</MenuItem>
						<MenuItem value={100}>100</MenuItem>
						<MenuItem value={500}>500</MenuItem>
						<MenuItem value={1000}>1000</MenuItem>
					</Select>
				</FormControl>

				<FormControl
					size="small"
					sx={{ minWidth: 120 }}>
					<InputLabel>Sample Rate</InputLabel>
					<Select
						value={sampleRate}
						onChange={handleSampleRateChange}
						label="Sample Rate">
						<MenuItem value={1}>Every record</MenuItem>
						<MenuItem value={5}>Every 5th</MenuItem>
						<MenuItem value={10}>Every 10th</MenuItem>
						<MenuItem value={50}>Every 50th</MenuItem>
						<MenuItem value={100}>Every 100th</MenuItem>
					</Select>
				</FormControl>

				{activeTab === 0 && (
					<FormControlLabel
						control={
							<Switch
								checked={showAllChartData}
								onChange={(e) => setShowAllChartData(e.target.checked)}
								size="small"
							/>
						}
						label="Show all chart data"
					/>
				)}
			</Box>

			{data && (
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{ mt: 1, display: "block" }}>
					Showing {data.displayedOccurrences} of {data.totalOccurrences} total
					records
					{data.pagination.sampleRate > 1 &&
						` (sampled at 1:${data.pagination.sampleRate})`}
				</Typography>
			)}
		</Box>
	);

	const renderChart = () => {
		if (!chartData || chartData.length === 0) {
			return (
				<Alert
					severity="info"
					sx={{ mt: 2 }}>
					No numeric data available for chart visualization
				</Alert>
			);
		}

		return (
			<Box sx={{ height: 400, mt: 2 }}>
				<ResponsiveContainer
					width="100%"
					height="100%">
					<LineChart data={chartData}>
						<CartesianGrid stroke="transparent" />
						<XAxis
							dataKey="blockNumber"
							type="number"
							scale="linear"
							domain={["dataMin", "dataMax"]}
							tickFormatter={(value) => `Block ${value}`}
							interval="preserveStartEnd"
							angle={-45}
							textAnchor="end"
							height={60}
							tickCount={chartData.length <= 100 ? chartData.length : 3}
						/>
						<YAxis
							tickFormatter={(value) => formatValue(value)}
							domain={["dataMin", "dataMax"]}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Line
							type="monotone"
							dataKey="value"
							stroke="#1976d2"
							strokeWidth={2}
							dot={
								chartData.length <= 100
									? { fill: "#1976d2", strokeWidth: 2, r: 4 }
									: false
							}
							activeDot={{ r: 6, stroke: "#1976d2", strokeWidth: 2 }}
						/>
					</LineChart>
				</ResponsiveContainer>
				<Typography
					variant="body2"
					color="text.secondary"
					sx={{ mt: 1, textAlign: "center" }}>
					Showing {chartData.length} data points
					{!showAllChartData &&
						data?.chartData?.length > 500 &&
						` (limited from ${data.chartData.length})`}
				</Typography>
			</Box>
		);
	};

	const renderStats = () => {
		if (!data?.valueRange) return null;

		return (
			<Grid
				container
				spacing={2}
				sx={{ mt: 2 }}>
				<Grid
					item
					xs={12}
					md={6}>
					<Card>
						<CardContent>
							<Typography
								variant="h6"
								gutterBottom>
								<TimelineIcon sx={{ mr: 1, verticalAlign: "middle" }} />
								Overview
							</Typography>
							<Typography
								variant="body2"
								gutterBottom>
								<strong>Total Occurrences:</strong>{" "}
								{data.totalOccurrences.toLocaleString()}
							</Typography>
							<Typography
								variant="body2"
								gutterBottom>
								<strong>Currently Showing:</strong>{" "}
								{data.displayedOccurrences.toLocaleString()}
							</Typography>
							<Typography
								variant="body2"
								gutterBottom>
								<strong>Variable Type:</strong>{" "}
								{data.history[0]?.variableType || "Unknown"}
							</Typography>
							<Typography variant="body2">
								<strong>Time Range:</strong>
								<br />
								{formatTimestamp(data.timeRange.start)} to{" "}
								{formatTimestamp(data.timeRange.end)}
							</Typography>
						</CardContent>
					</Card>
				</Grid>

				{data.valueRange.type === "numeric" && (
					<Grid
						item
						xs={12}
						md={6}>
						<Card>
							<CardContent>
								<Typography
									variant="h6"
									gutterBottom>
									{data.valueRange.totalChange >= 0 ? (
										<TrendingUpIcon
											sx={{
												mr: 1,
												verticalAlign: "middle",
												color: "success.main",
											}}
										/>
									) : (
										<TrendingDownIcon
											sx={{
												mr: 1,
												verticalAlign: "middle",
												color: "error.main",
											}}
										/>
									)}
									Numeric Stats
								</Typography>
								<Typography
									variant="body2"
									gutterBottom>
									<strong>Min Value:</strong> {formatValue(data.valueRange.min)}
								</Typography>
								<Typography
									variant="body2"
									gutterBottom>
									<strong>Max Value:</strong> {formatValue(data.valueRange.max)}
								</Typography>
								<Typography
									variant="body2"
									gutterBottom>
									<strong>Average:</strong>{" "}
									{formatValue(data.valueRange.average)}
								</Typography>
								<Typography
									variant="body2"
									gutterBottom>
									<strong>Total Change:</strong>{" "}
									{formatValue(data.valueRange.totalChange)}
								</Typography>
								<Chip
									label={
										data.valueRange.isMonotonic ? "Monotonic" : "Fluctuating"
									}
									color={data.valueRange.isMonotonic ? "success" : "warning"}
									size="small"
									sx={{ mt: 1 }}
								/>
							</CardContent>
						</Card>
					</Grid>
				)}
			</Grid>
		);
	};

	const renderTable = () => {
		if (!data?.history) return null;

		return (
			<Box>
				<TableContainer
					component={Paper}
					sx={{ mt: 2, maxHeight: 400 }}>
					<Table
						stickyHeader
						size="small">
						<TableHead>
							<TableRow>
								<TableCell>Block Number</TableCell>
								<TableCell>Timestamp</TableCell>
								<TableCell>Value</TableCell>
								<TableCell>Change</TableCell>
								<TableCell>Function</TableCell>
								<TableCell>Transaction</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{data.history.map((item, index) => (
								<TableRow
									key={`${item.transactionHash}-${index}`}
									hover>
									<TableCell>{item.blockNumber}</TableCell>
									<TableCell>{formatTimestamp(item.timestamp)}</TableCell>
									<TableCell>
										<Typography
											variant="body2"
											component="span"
											sx={{ fontFamily: "monospace" }}>
											{formatValue(item.variableValue)}
										</Typography>
									</TableCell>
									<TableCell>
										{item.change && (
											<Typography
												variant="body2"
												color={item.change > 0 ? "success.main" : "error.main"}>
												{item.change > 0 ? "+" : ""}
												{formatValue(item.change)}
												{item.changePercent && (
													<Typography
														variant="caption"
														display="block">
														({item.changePercent.toFixed(4)}%)
													</Typography>
												)}
											</Typography>
										)}
									</TableCell>
									<TableCell>
										<Chip
											label={item.functionName}
											size="small"
											variant="outlined"
										/>
									</TableCell>
									<TableCell>
										<Typography
											variant="caption"
											sx={{ fontFamily: "monospace" }}>
											{item.transactionHash.substring(0, 10)}...
										</Typography>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>

				{data.pagination && data.pagination.totalPages > 1 && (
					<Box
						display="flex"
						justifyContent="center"
						sx={{ mt: 2 }}>
						<Pagination
							count={data.pagination.totalPages}
							page={page}
							onChange={handlePageChange}
							color="primary"
							showFirstButton
							showLastButton
						/>
					</Box>
				)}
			</Box>
		);
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="xl"
			fullWidth
			PaperProps={{ sx: { height: "90vh" } }}>
			<DialogTitle>
				<Box
					display="flex"
					alignItems="center"
					justifyContent="space-between">
					<Typography variant="h6">
						Storage History: <code>{payload.variableName}</code>
					</Typography>
					<IconButton
						onClick={onClose}
						size="small">
						<CloseIcon />
					</IconButton>
				</Box>
			</DialogTitle>

			<DialogContent dividers>
				{isLoading && (
					<Box
						display="flex"
						justifyContent="center"
						alignItems="center"
						minHeight={200}>
						<CircularProgress />
					</Box>
				)}

				{error && (
					<Alert
						severity="error"
						sx={{ mt: 2 }}>
						Error loading storage history: {error.message}
					</Alert>
				)}

				{data && (
					<>
						{renderControls()}

						<Tabs
							value={activeTab}
							onChange={handleTabChange}
							sx={{ borderBottom: 1, borderColor: "divider" }}>
							<Tab
								label={`Chart View (${data.chartData?.length || 0} points)`}
							/>
							<Tab label={`Table View (${data.displayedOccurrences} rows)`} />
							<Tab label="Statistics" />
						</Tabs>

						{activeTab === 0 && renderChart()}
						{activeTab === 1 && renderTable()}
						{activeTab === 2 && renderStats()}
					</>
				)}
			</DialogContent>

			<DialogActions>
				<Button onClick={onClose}>Close</Button>
			</DialogActions>
		</Dialog>
	);
};

StorageHistoryDialog.propTypes = {
	onClose: PropTypes.func.isRequired,
	open: PropTypes.bool.isRequired,
	payload: PropTypes.shape({
		variableName: PropTypes.string,
	}).isRequired,
};

export default StorageHistoryDialog;
