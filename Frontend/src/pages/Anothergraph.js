import React, { useEffect, useRef } from "react";
import Graph from "graphology";
import clusters from "graphology-generators/random/clusters";
import forceAtlas2 from "graphology-layout-forceatlas2";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import ForceSupervisor from "graphology-layout-force/worker";
import circlepack from "graphology-layout/circlepack";
import Sigma from "sigma";
import { EdgeLineProgram, EdgeRectangleProgram } from "sigma/rendering";


const GraphComponent = ({ graphData,nodeFilter, onVisibleNodeCount }) => {
    console.log(graphData)
  const containerRef = useRef(null);
  const fa2LayoutRef = useRef(null);
  const graph = new Graph();

//   if(graphData) {
//     DEFAULT_ARGS = {
//       ...DEFAULT_ARGS,
//       order: graphData.nodes.length,
//       size: graphData.edges.length,
//       clusters: 1,
//     };
//   }
  useEffect(() => {
    // Generate a graph
    const rng = Math.random;
    circlepack.assign(graph, {
      hierarchyAttributes: ["cluster"],
    });
    if(graphData) {
        graphData.nodes.forEach(element => {
            graph.addNode(element.key, {
                label: element.label,
                x: Math.random(),
                y: Math.random(),
                size: 5,
                color: element.attributes.color,
                cluster: element.attributes.cluster,
            });
        });
        graphData.edges.forEach(element => {
            graph.addEdge(element.source,element.target, {
                size: 1,
                color: "#3399FF",
                type:"line"
            });
        })
    }
    circlepack.assign(graph, {
      hierarchyAttributes: ["cluster"],
    });
   
    // graphData.nodes.forEach((node) => {
    //     graph.mergeNodeAttributes(node, {
    //         size: 5,
    //         label: node.label,
    //         color: node.attributes.color,
    //     });
    // });


    // Render the graph
    const renderer = new Sigma(graph, containerRef.current);

    // // Initialize ForceAtlas2 layout
    const sensibleSettings = forceAtlas2.inferSettings(graph);
    const fa2Layout = new FA2Layout(graph, {
      settings: sensibleSettings,
    });
    fa2LayoutRef.current = fa2Layout;
    // const layout = new ForceSupervisor(graph);
    // layout.start();
    // Start layout initially
    fa2Layout.start();

    // Update visible node count
    onVisibleNodeCount(graph.order);

    // Cleanup on unmount
    return () => {
      fa2Layout.kill();
      renderer.kill();
    };
  }, [onVisibleNodeCount]);

  const toggleFA2Layout = () => {
    if (fa2LayoutRef.current.isRunning()) {
      fa2LayoutRef.current.stop();
    } else {
      fa2LayoutRef.current.start();
    }
  };

  return (
    <div>
      <div ref={containerRef} style={{ width: "100%", height: "600px" }} />
      <button onClick={toggleFA2Layout}>Toggle ForceAtlas2 Layout</button>
    </div>
  );
};

export default GraphComponent;