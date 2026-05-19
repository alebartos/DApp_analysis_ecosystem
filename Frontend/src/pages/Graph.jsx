import { useEffect, useRef, useState } from "react";
import { useLoadGraph, useRegisterEvents, useSigma } from "@react-sigma/core";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import circlepack from "graphology-layout/circlepack";
import circular from "graphology-layout/circular";
import random from "graphology-layout/random";
import noverlap from "graphology-layout-noverlap";

const GraphExtraction = ({ graphData, edgeRange, onNodeSelected, onVisibleNodeCount,onVisibleEdgeCount, startLayout,layoutType="forceatlas2",layoutConfig={} }) => {
  const loadGraph = useLoadGraph();
  const registerEvents = useRegisterEvents();
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const layoutRef = useRef(null);
  const isGraphLoaded = useRef(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredNeighbors, setHoveredNeighbors] = useState(new Set());


  // Grid Layout Implementation
  const applyGridLayout = () => {
    const nodes = graph.nodes();
    const gridSize = Math.ceil(Math.sqrt(nodes.length));
    const spacing = layoutConfig.gridSpacing || 100;

    nodes.forEach((node, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      graph.setNodeAttribute(node, "x", col * spacing);
      graph.setNodeAttribute(node, "y", row * spacing);
    });
  };

  // Radial Layout Implementation (nodes by degree)
  const applyRadialLayout = () => {
    const nodes = graph.nodes();
    const centerX = 0;
    const centerY = 0;
    
    // Sort nodes by degree (number of connections)
    const nodesByDegree = nodes
      .map(node => ({
        node,
        degree: graph.degree(node)
      }))
      .sort((a, b) => b.degree - a.degree);

    // Place high-degree nodes in center, low-degree on outside
    nodesByDegree.forEach((item, index) => {
      const radius = (index / nodes.length) * 300;
      const angle = (2 * Math.PI * index) / nodes.length;
      
      graph.setNodeAttribute(item.node, "x", centerX + radius * Math.cos(angle));
      graph.setNodeAttribute(item.node, "y", centerY + radius * Math.sin(angle));
    });
  };

  // Hierarchical Layout (by attribute)
  const applyHierarchicalLayout = () => {
    const attribute = layoutConfig.hierarchyAttribute || 'community';
    const levels = new Map();
    
    // Group nodes by attribute
    graph.forEachNode((node, attributes) => {
      const level = attributes[attribute] || 0;
      if (!levels.has(level)) {
        levels.set(level, []);
      }
      levels.get(level).push(node);
    });

    // Arrange levels vertically
    const verticalSpacing = layoutConfig.verticalSpacing || 150;
    const horizontalSpacing = layoutConfig.horizontalSpacing || 80;
    
    Array.from(levels.keys()).sort().forEach((level, levelIndex) => {
      const nodesInLevel = levels.get(level);
      const y = levelIndex * verticalSpacing;
      
      nodesInLevel.forEach((node, nodeIndex) => {
        const x = (nodeIndex - nodesInLevel.length / 2) * horizontalSpacing;
        graph.setNodeAttribute(node, "x", x);
        graph.setNodeAttribute(node, "y", y);
      });
    });
  };

  // Concentric Layout (by community with proper spacing)
  const applyConcentricLayout = () => {
    const communities = new Map();
    
    graph.forEachNode((node, attributes) => {
      const community = attributes.community || 0;
      if (!communities.has(community)) {
        communities.set(community, []);
      }
      communities.get(community).push(node);
    });

    const numCommunities = communities.size;
    const ringSpacing = layoutConfig.ringSpacing || 100;
    
    Array.from(communities.keys()).sort().forEach((community, ringIndex) => {
      const nodes = communities.get(community);
      const radius = (ringIndex + 1) * ringSpacing;
      
      nodes.forEach((node, nodeIndex) => {
        const angle = (2 * Math.PI * nodeIndex) / nodes.length;
        graph.setNodeAttribute(node, "x", radius * Math.cos(angle));
        graph.setNodeAttribute(node, "y", radius * Math.sin(angle));
      });
    });
  };
  

  // Initialize layout based on type
  const initializeLayout = () => {
    if (layoutRef.current) {
      layoutRef.current.stop();
      layoutRef.current = null;
    }

    if (layoutType === "forceatlas2") {
      layoutRef.current = new FA2Layout(graph, {
        settings: {
          gravity: 0.5,
          scalingRatio: 50,
          strongGravityMode: false,
          adjustSizes: true,
        },
      });
    }
  };

  // Apply initial positioning based on layout type
  const applyInitialLayout = () => {
    if (!graph) return;
    switch (layoutType) {
      case "circlepack":
        circlepack.assign(graph, {
          hierarchyAttributes: layoutConfig.hierarchyAttributes || ['community', 'cluster'],
        });
        break;

      case "circular":
        circular.assign(graph, {
          scale: layoutConfig.circularScale || 200,
        });
        if (layoutConfig.preventOverlap !== false) {
          noverlap.assign(graph, {
            maxIterations: 50,
            settings: {
              ratio: 1.2,
              margin: 3,
            }
          });
        }
        break;

      case "grid":
        applyGridLayout();
        break;

      case "radial":
        applyRadialLayout();
        break;

      case "hierarchical":
        applyHierarchicalLayout();
        break;

      case "concentric":
        applyConcentricLayout();
        break;

      case "community-circular":
        const communities = new Map();
        graph.forEachNode((node, attributes) => {
          const community = attributes.community || 0;
          if (!communities.has(community)) {
            communities.set(community, []);
          }
          communities.get(community).push(node);
        });

        const numCommunities = communities.size;
        const mainRadius = layoutConfig.mainRadius || 300;
        let communityIndex = 0;

        communities.forEach((nodes, community) => {
          const angle = (2 * Math.PI * communityIndex) / numCommunities;
          const centerX = mainRadius * Math.cos(angle);
          const centerY = mainRadius * Math.sin(angle);
          
          const subRadius = layoutConfig.subRadius || (50 + nodes.length * 2);
          nodes.forEach((node, i) => {
            const subAngle = (2 * Math.PI * i) / nodes.length;
            graph.setNodeAttribute(node, "x", centerX + subRadius * Math.cos(subAngle));
            graph.setNodeAttribute(node, "y", centerY + subRadius * Math.sin(subAngle));
          });
          
          communityIndex++;
        });
        break;

      case "random":
        random.assign(graph, {
          scale: layoutConfig.randomScale || 200,
        });
        break;

      case "forceatlas2":
      default:
        circlepack.assign(graph, {
          hierarchyAttributes: layoutConfig.hierarchyAttributes || ['community', 'cluster'],
        });
        break;
    }
    graph.forEachNode((node) => {
      graph.mergeNodeAttributes(node, {
        size: 5,
      });
    });
  };

  useEffect(() => {
    sigma.setSetting("renderEdgeLabels", true);
    sigma.setSetting("edgeLabelSize", 14);
    sigma.setSetting("edgeLabelColor", { color: "#000000" });
    sigma.setSetting("edgeLabelWeight", "bold");
    sigma.setSetting("edgeLabelRenderedSizeThreshold", 0);
    
    sigma.setSetting("defaultEdgeType", "straight");
  }, [sigma]);

  // Register events on mount
  useEffect(() => {
    registerEvents({
      downNode: (event) => handleNodeDragStart(event.node),
      moveBody: (event) => handleNodeDragMove(event),
      upNode: () => handleNodeDragEnd(),
      upStage: () => handleNodeDragEnd(),
      clickNode: (event) => handleNodeClick(event.node),
    });

    return () => {
      if (layoutRef.current) {
        layoutRef.current.stop();
      }
    };
  }, [graph, registerEvents]);

  // Load graph data
  useEffect(() => {
    if (!graphData) return;

    loadGraph(graphData);
    
    graph.forEachEdge(edge => {
      const edgeAttrs = graph.getEdgeAttributes(edge);
      
      if (!edgeAttrs.type) {
        graph.setEdgeAttribute(edge, "type", "straight");
      }
      
      if (edgeAttrs.curvature === undefined || edgeAttrs.curvature === null) {
        graph.setEdgeAttribute(edge, "curvature", 0);
      }
    });
    
    applyInitialLayout();
    isGraphLoaded.current = true;

    onVisibleNodeCount(graph.nodes().length);
    onVisibleEdgeCount(graph.edges().length);
  }, [graphData, layoutType]);

  // Initialize layout when type changes
  useEffect(() => {
    if (!graph || !isGraphLoaded.current) return;

    initializeLayout();
    applyInitialLayout();

    return () => {
      if (layoutRef.current) {
        layoutRef.current.stop();
      }
    };
  }, [layoutType]);

  // Start or stop ForceAtlas2 layout
  useEffect(() => {
    if (!layoutRef.current || layoutType !== "forceatlas2") return;

    if (startLayout) {
      layoutRef.current.start();
    } else {
      layoutRef.current.stop();
    }
  }, [startLayout, layoutType]);

  // Handle hover events
  useEffect(() => {
    const handleEnterNode = ({ node }) => {
      setHoveredNode(node);
      setHoveredNeighbors(new Set(graph.neighbors(node)));
    };

    const handleLeaveNode = () => {
      setHoveredNode(null);
      setHoveredNeighbors(new Set());
    };

    sigma.on("enterNode", handleEnterNode);
    sigma.on("leaveNode", handleLeaveNode);

    return () => {
      sigma.off("enterNode", handleEnterNode);
      sigma.off("leaveNode", handleLeaveNode);
    };
  }, [sigma, graph]);

  // Apply hover behavior
  useEffect(() => {
    sigma.setSetting("nodeReducer", (node, data) => {
      const res = { ...data };

      if (hoveredNode && node !== hoveredNode && !hoveredNeighbors.has(node)) {
        res.color = "#f6f6f6";
        res.label = "";
      }

      return res;
    });

    sigma.setSetting("edgeReducer", (edge, data) => {
      const res = { ...data };
      
      if (data.type) {
        res.type = data.type;
      }
      if (data.curvature !== undefined && data.curvature !== null) {
        res.curvature = data.curvature;
      }
      if (data.size !== undefined) {
        res.size = data.size;
      }
      
      if (hoveredNode) {
        if (graph.source(edge) === hoveredNode || graph.target(edge) === hoveredNode) {
          res.hidden = false;
        } else {
          res.hidden = true;
        }
      }
      
      return res;
    });

    sigma.refresh();
  }, [hoveredNode, hoveredNeighbors, sigma, graph]);

  // Handle node filtering
    useEffect(() => {
        if (!graph) return;

        const [min, max] = edgeRange || [];
        const visibleNodeCount = new Set();
        let visibleEdgeCount = 0;

        graph.forEachNode((node) => {
            graph.setNodeAttribute(node, "hidden", true);
        });

        graph.forEachEdge((edge, attributes) => {
            const val = attributes.value;

            const passMin = min === null || val >= min;
            const passMax = max === null || val <= max;

            if (passMin && passMax) {
                graph.setNodeAttribute(graph.source(edge), "hidden", false);
                graph.setNodeAttribute(graph.target(edge), "hidden", false);

                visibleNodeCount.add(graph.source(edge));
                visibleNodeCount.add(graph.target(edge));
                visibleEdgeCount++;
            }
        });

        if (min === null && max === null) {
            graph.forEachNode((node) => {
                graph.setNodeAttribute(node, "hidden", false);
                visibleNodeCount.add(node);
            });
            visibleEdgeCount = graph.edges().length;
        }

        onVisibleNodeCount(visibleNodeCount.size);
        onVisibleEdgeCount(visibleEdgeCount);
    }, [edgeRange, graph, onVisibleNodeCount, onVisibleEdgeCount]);

  // Node drag handlers
  let draggedNode = null;
  let isDragging = false;

  const handleNodeDragStart = (node) => {
    isDragging = true;
    draggedNode = node;
    graph.setNodeAttribute(draggedNode, "highlighted", true);
    sigma.getCamera().disable();
  };

  const handleNodeDragMove = ({ event }) => {
    if (!isDragging || !draggedNode) return;

    const pos = sigma.viewportToGraph(event);
    graph.setNodeAttribute(draggedNode, "x", pos.x);
    graph.setNodeAttribute(draggedNode, "y", pos.y);

    event.preventSigmaDefault();
    event.original.preventDefault();
    event.original.stopPropagation();
  };

  const handleNodeDragEnd = () => {
    if (draggedNode) {
      graph.removeNodeAttribute(draggedNode, "highlighted");
    }
    isDragging = false;
    draggedNode = null;
    sigma.getCamera().enable();
  };

  const handleNodeClick = (node) => {
    onNodeSelected(graph.getNodeAttributes(node).details);
  };

  return null;
};

export default GraphExtraction;