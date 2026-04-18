import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { AgentThought } from '../services/agentService';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Brain, Database, TrendingUp, Zap, Network, ArrowRight } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AgentNode {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
  isCore?: boolean;
  x?: number;
  y?: number;
}

interface AgentLink {
  source: string;
  target: string;
  label: string;
  bidirectional?: boolean;
}

// ─── Config ──────────────────────────────────────────────────────────────────
const AGENT_NODES: AgentNode[] = [
  {
    id: "Lead Scientist",
    label: "LEAD SCIENTIST",
    color: "#10b981",
    bgColor: "#10b98115",
    icon: "🧬",
    description: "Oversees genomic pathways & R0 calculation"
  },
  {
    id: "Data Analyst",
    label: "DATA ANALYST",
    color: "#06b6d4",
    bgColor: "#06b6d415",
    icon: "📊",
    description: "Monitors Replicator-Mutator error thresholds"
  },
  {
    id: "Revenue Strategist",
    label: "REV. STRATEGIST",
    color: "#f59e0b",
    bgColor: "#f59e0b15",
    icon: "💰",
    description: "Manages SVI and IBS Bet/Trade modules"
  },
  {
    id: "Growth Agent",
    label: "GROWTH AGENT",
    color: "#8b5cf6",
    bgColor: "#8b5cf615",
    icon: "🚀",
    description: "Expands Reach and Gravity via IBS Media/Play"
  },
  {
    id: "IBS CORE",
    label: "IBS CORE",
    color: "#f43f5e",
    bgColor: "#f43f5e15",
    icon: "⚡",
    description: "Central engine: R0, SVI, Trueness synthesis",
    isCore: true
  }
];

const AGENT_LINKS: AgentLink[] = [
  { source: "Lead Scientist", target: "IBS CORE", label: "genomic signal", bidirectional: true },
  { source: "Data Analyst", target: "IBS CORE", label: "metric stream", bidirectional: true },
  { source: "Revenue Strategist", target: "IBS CORE", label: "SVI update", bidirectional: true },
  { source: "Growth Agent", target: "IBS CORE", label: "reach delta", bidirectional: true },
  { source: "Lead Scientist", target: "Data Analyst", label: "hypothesis", bidirectional: false },
  { source: "Data Analyst", target: "Revenue Strategist", label: "analytics", bidirectional: false },
  { source: "Revenue Strategist", target: "Growth Agent", label: "strategy", bidirectional: false },
  { source: "Growth Agent", target: "Lead Scientist", label: "feedback", bidirectional: false },
];

// Role → icon component map
const ROLE_ICONS: Record<string, React.ReactNode> = {
  "Lead Scientist": <span className="text-lg">🧬</span>,
  "Data Analyst": <span className="text-lg">📊</span>,
  "Revenue Strategist": <span className="text-lg">💰</span>,
  "Growth Agent": <span className="text-lg">🚀</span>,
  "IBS CORE": <span className="text-lg">⚡</span>,
};

// ─── Component ───────────────────────────────────────────────────────────────
interface Props {
  thoughts: AgentThought[];
  isRunning: boolean;
}

export const AgentOrchestration: React.FC<Props> = ({ thoughts, isRunning }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [pulseLinks, setPulseLinks] = useState<Set<string>>(new Set());
  const [dimensions, setDimensions] = useState({ w: 600, h: 400 });

  // Track active agent from latest thought
  useEffect(() => {
    if (thoughts.length > 0) {
      const role = thoughts[0].role;
      setActiveAgent(role);

      // Find links involving this agent and pulse them
      const activeLinks = AGENT_LINKS
        .filter(l => l.source === role || l.target === role)
        .map(l => `${l.source}→${l.target}`);
      setPulseLinks(new Set(activeLinks));

      const timer = setTimeout(() => {
        setActiveAgent(null);
        setPulseLinks(new Set());
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [thoughts]);

  // Observe container size
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const e = entries[0];
      if (e) setDimensions({ w: e.contentRect.width, h: e.contentRect.height });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // D3 Draw
  useEffect(() => {
    if (!svgRef.current || dimensions.w < 10) return;

    const { w, h } = dimensions;
    const cx = w / 2;
    const cy = h / 2;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${w} ${h}`);

    // Layout: 4 agents in a ring, IBS CORE in center
    const ringRadius = Math.min(w, h) * 0.35;
    const nodePositions: Record<string, { x: number; y: number }> = {
      "IBS CORE": { x: cx, y: cy },
      "Lead Scientist": { x: cx + ringRadius * Math.cos(-Math.PI / 2), y: cy + ringRadius * Math.sin(-Math.PI / 2) },
      "Data Analyst": { x: cx + ringRadius * Math.cos(0), y: cy + ringRadius * Math.sin(0) },
      "Revenue Strategist": { x: cx + ringRadius * Math.cos(Math.PI / 2), y: cy + ringRadius * Math.sin(Math.PI / 2) },
      "Growth Agent": { x: cx + ringRadius * Math.cos(Math.PI), y: cy + ringRadius * Math.sin(Math.PI) },
    };

    const nodeMap = Object.fromEntries(
      AGENT_NODES.map(n => [n.id, { ...n, ...nodePositions[n.id] }])
    );

    // ── Defs: arrow marker & glow filter ──
    const defs = svg.append("defs");

    AGENT_NODES.forEach(n => {
      const f = defs.append("filter").attr("id", `glow-${n.id.replace(/\s/g, "")}`);
      f.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "blur");
      const merge = f.append("feMerge");
      merge.append("feMergeNode").attr("in", "blur");
      merge.append("feMergeNode").attr("in", "SourceGraphic");
    });

    defs.append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#3f3f46");

    defs.append("marker")
      .attr("id", "arrowhead-active")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#10b981");

    // ── Links ──
    const linkGroup = svg.append("g").attr("class", "links");

    AGENT_LINKS.forEach(link => {
      const src = nodeMap[link.source];
      const tgt = nodeMap[link.target];
      if (!src || !tgt) return;

      const key = `${link.source}→${link.target}`;
      const isActive = pulseLinks.has(key);
      const isAnyActive = activeAgent !== null;

      const opacity = isAnyActive ? (isActive ? 1 : 0.15) : 0.4;
      const color = isActive ? "#10b981" : "#3f3f46";
      const strokeW = isActive ? 1.5 : 1;

      const path = linkGroup.append("path")
        .attr("d", () => {
          const dx = tgt.x! - src.x!;
          const dy = tgt.y! - src.y!;
          const mid = { x: (src.x! + tgt.x!) / 2 - dy * 0.15, y: (src.y! + tgt.y!) / 2 + dx * 0.15 };
          return `M${src.x},${src.y} Q${mid.x},${mid.y} ${tgt.x},${tgt.y}`;
        })
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", strokeW)
        .attr("stroke-dasharray", isActive ? "none" : "3 4")
        .attr("opacity", opacity)
        .attr("marker-end", isActive ? "url(#arrowhead-active)" : "url(#arrowhead)");

      // Animated signal pulse on active links
      if (isActive && isRunning) {
        const totalLength = (path.node() as SVGPathElement)?.getTotalLength?.() || 100;
        const pulse = linkGroup.append("circle")
          .attr("r", 3)
          .attr("fill", "#10b981")
          .attr("opacity", 0.9);

        const animate = () => {
          pulse.attr("cx", src.x!).attr("cy", src.y!);
          pulse.transition()
            .duration(700)
            .ease(d3.easeLinear)
            .attrTween("transform", function () {
              const pathEl = path.node() as SVGPathElement;
              return function (t) {
                if (!pathEl) return "";
                const len = pathEl.getTotalLength();
                const p = pathEl.getPointAtLength(t * len);
                return `translate(${p.x - src.x!},${p.y - src.y!})`;
              };
            })
            .on("end", () => {
              if (isActive) animate();
            });
        };
        animate();
      }
    });

    // ── Nodes ──
    AGENT_NODES.forEach(n => {
      const pos = nodePositions[n.id];
      if (!pos) return;

      const isActive = activeAgent === n.id;
      const isCore = n.isCore;
      const nodeR = isCore ? 28 : 22;
      const glowId = `glow-${n.id.replace(/\s/g, "")}`;

      const g = svg.append("g")
        .attr("transform", `translate(${pos.x},${pos.y})`)
        .style("cursor", "pointer");

      // Outer pulse ring (active only)
      if (isActive) {
        g.append("circle")
          .attr("r", nodeR + 12)
          .attr("fill", "none")
          .attr("stroke", n.color)
          .attr("stroke-width", 1)
          .attr("opacity", 0.25);

        g.append("circle")
          .attr("r", nodeR + 6)
          .attr("fill", "none")
          .attr("stroke", n.color)
          .attr("stroke-width", 1)
          .attr("opacity", 0.4);
      }

      // Core pulse (always on when running)
      if (isCore && isRunning) {
        g.append("circle")
          .attr("r", nodeR + 8)
          .attr("fill", "none")
          .attr("stroke", n.color)
          .attr("stroke-width", 0.5)
          .attr("opacity", 0.2);
      }

      // Main circle
      g.append("circle")
        .attr("r", nodeR)
        .attr("fill", n.bgColor)
        .attr("stroke", n.color)
        .attr("stroke-width", isActive ? 2.5 : isCore ? 2 : 1.5)
        .attr("filter", isActive ? `url(#${glowId})` : "none");

      // Icon
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", isCore ? 18 : 14)
        .attr("dy", 0)
        .text(n.icon);

      // Label below node
      if (!isCore) {
        g.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", nodeR + 14)
          .attr("font-size", 7)
          .attr("fill", isActive ? n.color : "#52525b")
          .attr("font-family", "monospace")
          .attr("font-weight", isActive ? "bold" : "normal")
          .text(n.label);
      } else {
        g.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", -nodeR - 8)
          .attr("font-size", 8)
          .attr("fill", "#f43f5e")
          .attr("font-family", "monospace")
          .attr("font-weight", "bold")
          .text("IBS CORE");
      }
    });

  }, [activeAgent, pulseLinks, isRunning, dimensions]);

  // Last 5 agent messages for the log panel
  const recentThoughts = thoughts.slice(0, 5);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* ── SVG Canvas ── */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-zinc-950/50 rounded-xl border border-zinc-800 overflow-hidden min-h-[280px]"
      >
        <svg ref={svgRef} className="w-full h-full" />

        {/* Active agent overlay */}
        <AnimatePresence>
          {activeAgent && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 left-3 right-3 p-3 rounded-lg bg-zinc-900/90 border border-emerald-500/30 backdrop-blur-sm flex items-center gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm">
                {ROLE_ICONS[activeAgent]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-mono text-emerald-400 uppercase">{activeAgent} → Active</p>
                {thoughts[0] && (
                  <p className="text-[10px] text-zinc-300 truncate italic">"{thoughts[0].thought.slice(0, 80)}..."</p>
                )}
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Engine status */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800 text-[8px] font-mono">
          <div className={`w-1 h-1 rounded-full ${isRunning ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
          <span className="text-zinc-500">{isRunning ? "ENGINE LIVE" : "STANDBY"}</span>
        </div>
      </div>

      {/* ── Agent Message Log ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800">
          <Network className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Message Bus Log</span>
          <Badge variant="outline" className="ml-auto text-[8px] border-zinc-800 text-zinc-600 h-4">
            {thoughts.length} messages
          </Badge>
        </div>
        <ScrollArea className="h-[160px]">
          <div className="p-3 space-y-2">
            <AnimatePresence initial={false}>
              {recentThoughts.map((t, i) => {
                const node = AGENT_NODES.find(n => n.id === t.role);
                return (
                  <motion.div
                    key={t.timestamp}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2.5"
                  >
                    <span className="text-xs mt-0.5">{node?.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold" style={{ color: node?.color }}>
                          {t.role}
                        </span>
                        <ArrowRight className="w-2 h-2 text-zinc-700" />
                        <span className="text-[8px] font-mono text-zinc-600 uppercase truncate">{t.action}</span>
                        <span className="text-[7px] text-zinc-700 ml-auto shrink-0">
                          {new Date(t.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-500 truncate italic">"{t.thought.slice(0, 90)}"</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {thoughts.length === 0 && (
              <div className="py-8 text-center text-zinc-700">
                <Network className="w-6 h-6 mx-auto mb-2 opacity-30" />
                <p className="text-[9px] font-mono uppercase">Ignite engine to start agent messaging</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ── Agent Status Cards ── */}
      <div className="grid grid-cols-4 gap-2">
        {AGENT_NODES.filter(n => !n.isCore).map(n => {
          const lastThought = thoughts.find(t => t.role === n.id);
          const isActive = activeAgent === n.id;
          return (
            <div
              key={n.id}
              className={`p-2.5 rounded-lg border transition-all ${
                isActive
                  ? "border-opacity-50 bg-opacity-10"
                  : "border-zinc-800 bg-zinc-900/50"
              }`}
              style={isActive ? {
                borderColor: n.color + "50",
                backgroundColor: n.bgColor
              } : {}}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs">{n.icon}</span>
                <span className="text-[8px] font-mono font-bold" style={{ color: isActive ? n.color : "#52525b" }}>
                  {n.label.split(" ")[0]}
                </span>
              </div>
              <p className="text-[8px] text-zinc-600 leading-tight line-clamp-2">
                {lastThought ? lastThought.action.slice(0, 40) + "..." : n.description.slice(0, 40) + "..."}
              </p>
              <div className="mt-1.5 flex items-center gap-1">
                <div
                  className={`w-1 h-1 rounded-full ${isActive ? "animate-pulse" : ""}`}
                  style={{ backgroundColor: isActive ? n.color : "#27272a" }}
                />
                <span className="text-[7px] text-zinc-700">{isActive ? "ACTIVE" : "IDLE"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
