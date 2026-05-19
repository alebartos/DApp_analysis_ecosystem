import { BarChart } from '@mui/x-charts/BarChart';
import React from 'react';
import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useDataView } from "../../context/DataViewContext";

const columns = [
  { field: 'contract', headerName: 'Smart Contract', width: 400 },
  { field: 'activity', headerName: 'Activity', width: 200 },
  { field: 'count', headerName: 'Count', width: 200 },
];

export default function Activity() {
    const { data } = useDataView();
    return (
      <div>
        <h1>Activity</h1>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 2
        }}>
          <Box sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}>
          <BarChart
            series={[
            {
              data: data ? data.map((item) => item.count) : [],
            },
            ]}
            height={290}
            width={400}
            xAxis={[{ data: data ? data.map((item) => item.activity) : [] }]}
          />
          </Box>
          <Box sx={{
           width: '100%',
           height: 400
          }}>
          <DataGrid rows={
            data ? data.map((item, index) => ({
            ...item,
            id: index,
            count: item.count || 0,
            })) : []
          } columns={columns} />
          </Box>
        </Box>
      </div>
    )
}
