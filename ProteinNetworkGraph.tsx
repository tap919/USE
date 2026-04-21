import React, { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { ProteinNetwork, ProteinNode, ProteinEdge } from "../services/bioinformaticsService";

interface Props {
  network: ProteinNetwork;
  width?: number;
  height?: number;
  onNodeClick?: (node: ProteinNode) => void;
}

const GROUP_COLORS: Record<string, string> = {
  kinase: "#f43f5e",
  transcription_factor: "#a78bfa",
  receptor: "#34d399",
  enzyme: "#fbbf24",
  structural: "#60a5fa",
  hub: "#f97316",
  default: "#94a3b8",
};

const EDGE_COLORS: Record<string, string> = {
  coexpression: "#4ade80",
  binding: "#60a5fa",
  reaction: "#fbbf24",
  activation: "#34d399",
  inhibition: "#f43f5e",
};

export const ProteinNetworkGraph: React.FC<Props> = ({
  network,
  width = 600,
  height = 500,
  onNodeClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: ProteinNode } | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);

  const render = useCallback(() => {
    if (!svgRef.current || !network.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Defs for glow effect
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Arrow markers
    Object.entries(EDGE_COLORS).forEach(([type, color]) => {
      defs.append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 18)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", color)
        .attr("opacity", 0.7);
    });

    const container = svg.append("g");

    // Zoom
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 4])
        .on("zoom", (e) => container.attr("transform", e.transform))
    );

    const nodes = network.nodes.map((n) => ({ ...n })) as any[];
    const edges = network.edges.map((e) => ({ ...e })) as any[];

    // Force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(edges).id((d: any) => d.id).distance(80).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(25))
      .alphaDecay(0.03);

    simulationRef.current = simulation;

    // Edge groups
    const edgeGroup = container.append("g").attr("class", "edges");
    const link = edgeGroup
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", (d: any) => EDGE_COLORS[d.type] || "#3f3f46")
      .attr("stroke-width", (d: any) => Math.max(1, d.weight * 3))
      .attr("stroke-opacity", 0.5)
      .attr("marker-end", (d: any) => `url(#arrow-${d.type})`);

    // Node groups
    const nodeGroup = container.append("g").attr("class", "nodes");
    const node = nodeGroup
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3.drag<any, any>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on("click", (event, d: any) => {
        setSelectedNode((prev) => (prev === d.id ? null : d.id));
        onNodeClick?.(d);
      })
      .on("mouseenter", (event, d: any) => {
        const rect = svgRef.current!.getBoundingClientRect();
        setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top, node: d });
      })
      .on("mouseleave", () => setTooltip(null));

    // Node circles
    node
      .append("circle")
      .attr("r", (d: any) => 8 + (d.score / 200))
      .attr("fill", (d: any) => GROUP_COLORS[d.group] || GROUP_COLORS.default)
      .attr("fill-opacity", 0.85)
      .attr("stroke", "#18181b")
      .attr("stroke-width", 1.5)
      .style("filter", "url(#glow)");

    // Node labels
    node
      .append("text")
      .text((d: any) => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", (d: any) => -(12 + d.score / 200))
      .attr("font-size", "9px")
      .attr("font-family", "JetBrains Mono, monospace")
      .attr("fill", "#a1a1aa")
      .attr("font-weight", "600")
      .attr("pointer-events", "none");

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [network, width, height, onNodeClick]);

  useEffect(() => {
    render();
    return () => simulationRef.current?.stop();
  }, [render]);

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full h-full bg-zinc-950 rounded-lg"
        style={{ background: "radial-gradient(ellipse at 50% 50%, #0d1117 0%, #09090b 100%)" }}
      />

      {/* Legend */}
      <div className="absolute top-3 left-3 space-y-1 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-lg p-2">
        <p className="text-[8px] font-mono text-zinc-500 uppercase mb-2">Node Type</p>
        {Object.entries(GROUP_COLORS).filter(([k]) => k !== "default").map(([group, color]) => (
          <div key={group} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[8px] font-mono text-zinc-400 capitalize">{group.replace("_", " ")}</span>
          </div>
        ))}
      </div>

      {/* Edge legend */}
      <div className="absolute top-3 right-3 space-y-1 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-lg p-2">
        <p className="text-[8px] font-mono text-zinc-500 uppercase mb-2">Interaction</p>
        {Object.entries(EDGE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-4 h-0.5" style={{ backgroundColor: color }} />
            <span className="text-[8px] font-mono text-zinc-400 capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs pointer-events-none shadow-2xl max-w-[220px]"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="font-mono font-bold text-emerald-400 mb-1">{tooltip.node.label}</p>
          <p className="text-zinc-400 text-[10px] mb-1 capitalize">{tooltip.node.group?.replace("_", " ")}</p>
          <p className="text-zinc-500 text-[10px] leading-relaxed">{tooltip.node.function}</p>
          <div className="mt-2 pt-2 border-t border-zinc-800 flex justify-between">
            <span className="text-[9px] text-zinc-600">STRING score</span>
            <span className="text-[9px] font-mono text-amber-400">{tooltip.node.score}</span>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="absolute bottom-3 left-3 flex gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded px-2 py-1">
          <span className="text-[9px] font-mono text-zinc-500">NODES: </span>
          <span className="text-[9px] font-mono text-emerald-400">{network.nodes.length}</span>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded px-2 py-1">
          <span className="text-[9px] font-mono text-zinc-500">EDGES: </span>
          <span className="text-[9px] font-mono text-cyan-400">{network.edges.length}</span>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded px-2 py-1">
          <span className="text-[9px] font-mono text-zinc-500">SPECIES: </span>
          <span className="text-[9px] font-mono text-amber-400">{network.metadata.species}</span>
        </div>
      </div>
    </div>
  );
};
