import {
    Box,
    Button,
    CircularProgress,
    Typography,
    Card,
    CardContent,
    styled,
    Stack, IconButton, TextField,InputLabel,Select,MenuItem,Chip
} from "@mui/material";
import {PlayArrow,Pause } from "@mui/icons-material";
import {ConstructionOutlined, FileUpload, FilterList} from "@mui/icons-material";
import { HiddenInput } from "../components/HiddenInput";
import React, { useEffect, useState, useRef } from "react";
import JsonView from "@uiw/react-json-view";
import { _generateGraph } from "../api/services";
import CustomTypography from "../components/CustomTypography";
import KeyType from '../components/keyType/keyType';
import { SigmaContainer } from "@react-sigma/core";
import FormControl from '@mui/material/FormControl';
import GraphExtraction from "./Graph";
import { MultiGraph } from "graphology";
import { EdgeArrowProgram } from "sigma/rendering";
import { EdgeCurvedArrowProgram } from "@sigma/edge-curve";
import "@react-sigma/core/lib/style.css";
import useDataContext from "../context/useDataContext";
import RadioGroup from "@mui/material/RadioGroup";
//import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import {GraphFilter} from "../components/GraphFilter";
import {useQuery} from "react-query";
import axios from "axios";
import {CollectionDropdown} from "../components/dataVisualization/CollectionDropdown";



const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props} />;
});
const CardContentNoPadding = styled(CardContent)`
    padding-top: 0;
    &:last-child {
        padding-bottom: 0;
    }
`;

const NetworkGraph = () => {
    const [selectedNode, setSelectedNode] = useState(null);
    const [rawData,setRawData] = useState(null);
    const { results, setResults } = useDataContext();
    const [running, setRunning] = useState(false);
    const [edgeRange, setEdgeRange] = useState([null, null]);
    const [edgeFilter, setEdgeFilter] = useState("");
    const [colorLegend,setColorLegend]=useState([]);
    const [visibleNodesCount, setVisibleNodeCount]=useState(0);
    const [startLayout,setStartLayout]=useState(false);
    const [visibleEdgeCount, setVisibleEdgeCount]=useState(0);
    const [graphData, setGraphData] = useState({
        nodes: [
        ],
        edges: [
        ],
    });
    const [dataSource, setDataSource] = useState("file");
    const [objectsTypesItem, setObjectsTypesItem] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCollections, setSelectedCollections] = useState([]);
    const [query,setQuery]=useState({});
    const [openDialog,setOpenDialog] = useState(false);
    //layout selection
    const [layoutType, setLayoutType] = useState("forceatlas2");
    const [useAdvancedLayouts, setUseAdvancedLayouts] = useState(true);

    // Layout options for advanced version
    const advancedLayouts = [
        { value: "forceatlas2", label: "Force Atlas 2", animated: true },
        { value: "circlepack", label: "Circle Pack", animated: false },
        { value: "circular", label: "Circular", animated: false },
        { value: "community-circular", label: "Community Circles", animated: false },
        { value: "random", label: "Random", animated: false },
        { value: "grid", label: "Grid", animated: false },
        { value: "radial", label: "Radial", animated: false },
        { value: "hierarchical", label: "Hierarchical", animated: false },
        { value: "concentric", label: "Concentric", animated: false },
    ];
    const currentLayouts = advancedLayouts;
    const currentLayoutInfo = currentLayouts.find(l => l.value === layoutType);   
    const {isLoading:isLoadingCollections, data:collections,error} = useQuery({
        queryKey: ["collections"],
        queryFn: async ()=> {
            const response = await axios.get("http://localhost:8000/api/collections");
            return response.data;
        }});

    const handleChange = (e) => {
        const value = e.target.value;
        setSelectedNode(value === "" ? null : value);
    };
    const handleVisibleNodeCount=(count)=>{
        setVisibleNodeCount(count);
    }
    const hadleVisibleEdgeCount=(count)=>{
        setVisibleEdgeCount(count);
    }

    const handleLoadGraph = () => {
        const newNodes = [
        ];

        const newEdges = [
        ];

        setGraphData({
            nodes: newNodes,
            edges: newEdges,
        });
        setSelectedNode(null);
    };
    const handleLayoutChange = (event) => {
        setLayoutType(event.target.value);
        // Reset animation when changing layouts
        setStartLayout(false);
    };
    const handleLayoutModeChange = (event) => {
        setUseAdvancedLayouts(event.target.value === 'advanced');
        // Reset to a safe layout when switching modes
        setLayoutType("forceatlas2");
        setStartLayout(false);
    };
    const applyFilter = (json)=>{
        const {contractAddress,dateFrom,dateTo,fromBlock,toBlock,funName,sender,txHash,minGasUsed,maxGasUsed} = query;
        if(contractAddress && Array.isArray(contractAddress) && contractAddress.length > 0)
            json = json.filter((tx)=>contractAddress.includes(tx.contractAddress))
        if(funName)
            json = json.filter((tx)=>tx.functionName===funName)
        if(txHash)
            json = json.filter((tx)=>tx.transactionHash===txHash);
        if(sender)
            json = json.filter((tx)=>tx.sender===sender);
        if(dateFrom)
            json = json.filter((tx)=>new Date(tx.timestamp?.$date)>=new Date(dateFrom));
        if(dateTo)
            json = json.filter((tx)=>new Date(tx.timestamp?.$date)<=new Date(dateTo));
        if(fromBlock)
            json = json.filter((tx)=>tx.blockNumber>=fromBlock);
        if(toBlock)
            json = json.filter((tx)=>tx.blockNumber<=toBlock);
        if(minGasUsed)
            json = json.filter((tx)=>tx.gasUsed>=minGasUsed);
        if(maxGasUsed)
            json = json.filter((tx)=>tx.gasUsed<=maxGasUsed);
        return json
    }
    const handleFileChange = (e) => {
        const fileReader = new FileReader();
        fileReader.onload = (event) => {
            const content = event.target.result;
            try {
                const parsed = JSON.parse(content);
                setRawData(parsed);
                setResults(parsed);
            } catch (err) {
                // console.error("Invalid JSON file");
            }
        };
        if (e.target.files[0]) {
            fileReader.readAsText(e.target.files[0]);
        }
        e.target.value = null;
    };
    const handleAddObjectType = () => {
        const newObjectType = { nameFrom: '', nameTo: '' };
        setObjectsTypesItem([...objectsTypesItem, newObjectType]);
    };
    const handleNodeSelected = (node) => {
        setSelectedNode(node);
    };
    const { isLoading,data: dbResults,refetch } = useQuery({
        queryKey: ["dbData", query],
        queryFn: () => axios.post("http://localhost:8000/api/transactions", query).then(res => res.data),
        enabled: dataSource === "database" && query.selectedCollection?.length > 0
    });
    useEffect(() => {
        if (dbResults) setResults(dbResults);
    }, [dbResults]);
    const hadleStartLayout=()=>{
        setStartLayout(!startLayout);
    }
    const generateGraph = () => {
        setLoading(true);
        const startTime = performance.now();
        if(objectsTypesItem.length !== 0){
            _generateGraph(results, objectsTypesItem).then((response) => {
                setLoading(false);
                const nodes = Array.from(response.data.nodes.values());
                const edges = response.data.edges;
                setColorLegend(response.data.colorLegend);
                setEdgeFilter(response.data.edgeFilter);
                setGraphData({nodes:nodes, edges:edges});
                const endTime = performance.now();
                console.log(`Graph creation took ${(endTime - startTime).toFixed(2)} ms`);

                setLoading(false);
            }).catch(err => {
                setLoading(false);
                console.error("Error generating graph:", err);
            });
        }else{
            setLoading(false)
            const endTime = performance.now();
            console.log(`Graph creation took ${(endTime - startTime).toFixed(2)} ms`);
        }
    };

    return (
        <div style={{ height: '100%', width: '100%'}}>
            <FormControl>
                <RadioGroup
                    value={dataSource}
                    onChange={(e)=>{
                        setDataSource(e.target.value);
                    }}
                >
                    <FormControlLabel
                        value="file"
                        control={<Radio />}
                        label="JSON File"
                    />
                    <FormControlLabel
                        value="database"
                        control={<Radio />}
                        label="Database"
                    />
                </RadioGroup>
            </FormControl>
            {dataSource==="file" &&
                <Box display="flex" gap={2} marginBottom={2} style={{ height: '4em' }}>
                    <Button
                        component="label"
                        variant="contained"
                        startIcon={<FileUpload />}
                        sx={{ padding: 1, height: "55px" }}
                    >
                        Upload File
                        <HiddenInput type="file" onChange={handleFileChange} />
                    </Button>
                </Box>
            }
            {dataSource==="database" &&
                <CollectionDropdown
                    selectedCollections={selectedCollections}
                    setSelectedCollections={setSelectedCollections}
                    collections={collections}
                    query = {query}
                    setQueryState={setQuery}
                />
            }
            {/* Top control box */}
            <Box display="flex" gap={2} marginBottom={2} marginTop={3} style={{ height: '4em' }}>


                <IconButton size="large" sx={{color: "#ffb703"}} onClick={() => setOpenDialog(true)}>
                    <FilterList fontSize="large"/>
                </IconButton>
                <GraphFilter
                    open = {openDialog}
                    onClose = {()=>{
                        if(dataSource==="file")
                            setResults(rawData);
                        if(dataSource==="database")
                            refetch();
                        setOpenDialog(false);
                    }}
                    query={query}
                    setQuery={setQuery}
                    isLoading={isLoading}
                    onApply={()=>{
                        if(dataSource==="file") {
                            const filtered = applyFilter([...rawData]);
                            setResults(filtered);
                            setOpenDialog(false);
                        }
                        if(dataSource==="database") {
                            refetch();
                            setOpenDialog(false);
                            console.log(query,dbResults);
                        }
                    }}
                />
                <Stack>
                    <CustomTypography>
                        <Button variant="contained"
                            onClick={handleAddObjectType}
                            sx={{ padding: 1, height: "55px" }}>Add edge</Button>
                    </CustomTypography>


                </Stack>

                <Button
                    variant="contained"
                    onClick={generateGraph}
                    sx={{ padding: 1, height: "55px" }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Generate Graph"}
                </Button>
                <TextField
                    select
                    label="Min Edge Size"
                    SelectProps={{ native: true }}
                    sx={{ width: 150 }}
                    value={edgeRange[0] ?? ""}
                    onChange={(e) =>
                        setEdgeRange([e.target.value ? Number(e.target.value) : null, edgeRange[1]])
                    }
                >
                    <option value=""></option>
                    {edgeFilter &&
                        Array.from(new Set(edgeFilter))
                            .sort((a, b) => a - b)
                            .map((size, index) => (
                                <option key={index} value={size}>
                                    {size}
                                </option>
                            ))}
                </TextField>

                <TextField
                    select
                    label="Max Edge Size"
                    SelectProps={{ native: true }}
                    sx={{ width: 150 }}
                    value={edgeRange[1] ?? ""}
                    onChange={(e) =>
                        setEdgeRange([edgeRange[0], e.target.value ? Number(e.target.value) : null])
                    }
                >
                    <option value=""></option>
                    {edgeFilter &&
                        Array.from(new Set(edgeFilter))
                            .sort((a, b) => a - b)
                            .map((size, index) => (
                                <option key={index} value={size}>
                                    {size}
                                </option>
                            ))}
                </TextField>
                <Typography variant="h6">Visible Nodes: {visibleNodesCount}</Typography>
                <Typography variant="h6">Visible Edges: {visibleEdgeCount}</Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                    <Typography variant="h6">Color Legend</Typography>
                    {Array.from(colorLegend).map((legendItem, index) => (
                        <Box key={index} display="flex" alignItems="center" gap={1}>
                            <Box
                                sx={{
                                    width: 20,
                                    height: 20,
                                    backgroundColor: legendItem.color,
                                    borderRadius: "50%",
                                }}
                            />
                            <Typography variant="body1">{legendItem.keyAssigned}</Typography>
                        </Box>
                    ))}

                </Box>

            </Box>
            
            <Box overflow="auto">
                {objectsTypesItem.map((objectType, index) => (
                    
                    <Box>
                    <KeyType
                        key={`object-type-${index}`}
                        nameFrom={objectType.nameFrom}
                        nameTo={objectType.nameTo}
                        objectToSet={objectType}
                        index={index}
                        setObjectsTypesItem={setObjectsTypesItem}
                    />
                </Box>
                ))}
            </Box>
            <Box
                sx={{
                    mb: 2,
                    p: 2,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    width: '50%',
                }}
            >
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Graph Layout Settings
                </Typography>

                <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">

                    {/* Layout Type Selection */}
                    <FormControl sx={{ minWidth: 250 }}>
                        <InputLabel>Layout Type</InputLabel>
                        <Select
                            value={layoutType}
                            onChange={handleLayoutChange}
                            label="Layout Type"
                        >
                            {currentLayouts.map((layout) => (
                                <MenuItem key={layout.value} value={layout.value}>
                                    {layout.label}
                                    {layout.animated && (
                                        <Chip
                                            label="Animated"
                                            size="small"
                                            sx={{ ml: 1 }}
                                            color="primary"
                                        />
                                    )}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Animation Control (only for animated layouts) */}
                    {currentLayoutInfo?.animated && (
                        <Button
                            variant={startLayout ? "contained" : "outlined"}
                            color={startLayout ? "warning" : "success"}
                            onClick={hadleStartLayout}
                            startIcon={startLayout ? <Pause /> : <PlayArrow />}
                            sx={{ height: "56px" }}
                        >
                            {startLayout ? "Pause Animation" : "Start Animation"}
                        </Button>
                    )}

                </Box>
            </Box>
            {/* Graph itself */}
            <SigmaContainer style={{ height: 'calc(100vh - 200px)', width: '100%' }}
                settings={{
                    edgeProgramClasses: {
                        straight: EdgeArrowProgram,
                        curved: EdgeCurvedArrowProgram,
                    },
                    defaultEdgeType: "straight",
                    renderEdgeLabels: true,
                }}>
                <GraphExtraction selectedNode={selectedNode}
                                 graphData={graphData}
                    //nodeFilter={nodeFilter}
                                 edgeRange={edgeRange}
                                 onNodeSelected={handleNodeSelected}
                                 onVisibleNodeCount={handleVisibleNodeCount}
                                 onVisibleEdgeCount={hadleVisibleEdgeCount}
                                 startLayout={startLayout}
                                 layoutType={layoutType}
                />
                {/* { graphData &&(
          <GraphComponent
          graphData={graphData}
          nodeFilter={nodeFilter}
           onVisibleNodeCount={handleVisibleNodeCount}
           />
        )} */}
            </SigmaContainer>
            {selectedNode && (
                <Stack marginY={3} height="calc(100vh - 300px)" overflow="auto">

                    <JsonView value={selectedNode} style={{ fontSize: '14px' }} width="100%" />

                </Stack>
            )}


        </div>

    );
};


export default NetworkGraph;