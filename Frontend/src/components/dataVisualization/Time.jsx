import React, {useState,useMemo} from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { Box } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

export default function Time({ data }) {
    const [lowerDate,setLowerDate] = useState(null);
    const [upperDate,setUpperDate] = useState(null);

    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return [];

        if (lowerDate && upperDate && lowerDate<=upperDate) {
            return data.filter((item) => {
                const d = new Date(item.date);
                return d >= lowerDate && d <= upperDate;
            });
        }

        return data;
    }, [data, lowerDate, upperDate]);

    return (
		<Box sx={{ width: "100%" }}>
			<h1>Gas used and Transaction Count over Time</h1>
            <Box sx={{ display: "flex", gap: 2 }}>
                <DateTimePicker
                    label="Date From"
                    slotProps={{ textField: { size: "small" } }}
                    value={lowerDate}
                    onChange={(newValue)=>setLowerDate(newValue)}
                />
                <DateTimePicker
                    label="Date To"
                    slotProps={{ textField: { size: "small" } }}
                    value={upperDate}
                    onChange={(newValue) => setUpperDate(newValue)}
                />
            </Box>
			<LineChart
				xAxis={[
					{
						data: filteredData.map((item) => new Date(Date.parse(item.date))),
						scaleType: "time",
						tickFormat: (date) => date.toLocaleDateString(),
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
                            if (value >= 100_000) return `${(value / 100_000).toFixed(1)}00K`;
                            if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
                            return value.toString();
                        },
                        width: 60,
                    }
                ]}
				series={[
					{
						data: filteredData.map((item) => item.gasUsed),
						label: "Gas Used",
						color: "#4CAF50", // Green for gas used
					},
				]}
				height={400}
				margin={{ left: 70, right: 30, top: 30, bottom: 60 }}
				skipAnimation={true}
				sx={{
					".MuiLineElement-root": {
						strokeWidth: 4,
					},
					".MuiMarkElement-root": {
						display: "none", // Hide individual points
					},
				}}
			/>
			<LineChart
				xAxis={[
					{
						data: filteredData.map((item) => new Date(Date.parse(item.date))),
						scaleType: "time",
						tickFormat: (date) => date.toLocaleDateString(),
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
                            if (value >= 100_000) return `${(value / 100_000).toFixed(1)}00K`;
                            if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
                            return value.toString();
                        },
                        width: 60,
                    }
                ]}
				series={[
					{
						data: filteredData.map((item) => item.transactionCount),
						label: "Transaction Count",
						color: "#F7931A", // Bitcoin orange
					},
				]}
				height={400}
				margin={{ left: 70, right: 30, top: 30, bottom: 60 }}
				skipAnimation={true}
				sx={{
					".MuiLineElement-root": {
						strokeWidth: 4,
					},
					".MuiMarkElement-root": {
						display: "none", // Hide individual points
					},
				}}
			/>
		</Box>
	);
}
