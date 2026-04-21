import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { CrossDomainInsight, TrendReport } from "../services/bioinformaticsService";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, GitBranch, Zap, Search, Brain, Network } from "lucide-react";

interface SynergyMatrixProps {
  insights: CrossDomainInsight[];
  domains: string[];
}

// ─── Synergy Heatmap ──────────────────────────────────────────────────────────

const synergyColor = (score: number): string => {
  if (score > 0.8) return "#34d399";
  if (score > 0.6) return "#fbbf24";
  if (score > 0.4) return "#f97316";
  return "#3f3f46";
};

const synergyBg = (score: number): string => {
  if (score > 0.8) return "rgba(52,211,153,0.2)";
  if (score > 0.6) return "rgba(251,191,36,0.15)";
  if (score > 0.4) return "rgba(249,115,22,0.12)";
  return "rgba(63,63,70,0.3)";
};

export const CrossDomainSynergyMatrix: React.FC<SynergyMatrixProps> = ({ insights, domains }) => {
  const [selectedPair, setSelectedPair] = useState<CrossDomainInsight | null>(null);

  // Build matrix lookup
  const matrix = useMemo(() => {
    const m: Record<string, Record<string, CrossDomainInsight>> = {};
    domains.forEach((d) => { m[d] = {}; });
    insights.forEach((ins) => {
      m[ins.domains[0]][ins.domains[1]] = ins;
      m[ins.domains[1]][ins.domains[0]] = ins;
    });
    return m;
  }, [insights, domains]);

  const topSynergies = useMemo(
    () => [...insights].sort((a, b) => b.synergyScore - a.synergyScore).slice(0, 5),
    [insights]
  );

  return (
    <div className="space-y-6">
      {/* Matrix grid */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header row */}
          <div className="flex mb-1 ml-28">
            {domains.map((d) => (
              <div key={d} className="w-24 text-[8px] font-mono text-zinc-500 uppercase text-center truncate px-1">{d.split(" ")[0]}</div>
            ))}
          </div>
          {domains.map((rowD) => (
            <div key={rowD} className="flex items-center mb-1">
              <div className="w-28 text-[9px] font-mono text-zinc-400 text-right pr-3 truncate">{rowD}</div>
              {domains.map((colD) => {
                if (rowD === colD) {
                  return (
                    <div key={colD} className="w-24 h-10 mx-0.5 rounded flex items-center justify-center bg-zinc-800/20 border border-zinc-800/50">
                      <div className="w-4 h-px bg-zinc-700" />
                    </div>
                  );
                }
                const ins = matrix[rowD]?.[colD];
                if (!ins) return <div key={colD} className="w-24 h-10 mx-0.5 rounded bg-zinc-900/30" />;
                return (
                  <motion.button
                    key={colD}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPair(ins)}
                    className="w-24 h-10 mx-0.5 rounded flex flex-col items-center justify-center gap-0.5 border transition-all cursor-pointer"
                    style={{ backgroundColor: synergyBg(ins.synergyScore), borderColor: synergyColor(ins.synergyScore) + "40" }}
                  >
                    <span className="text-[11px] font-mono font-bold" style={{ color: synergyColor(ins.synergyScore) }}>
                      {(ins.synergyScore * 100).toFixed(0)}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {ins.trend === "rising" && <TrendingUp className="w-2 h-2 text-emerald-400" />}
                      <span className="text-[7px] font-mono text-zinc-600 uppercase">{ins.trend}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-mono text-zinc-600 uppercase">Synergy:</span>
        {[{ label: "Strong >80", color: "#34d399" }, { label: "Moderate >60", color: "#fbbf24" }, { label: "Low >40", color: "#f97316" }, { label: "Minimal", color: "#3f3f46" }].map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.color + "40", border: `1px solid ${l.color}50` }} />
            <span className="text-[8px] font-mono text-zinc-500">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Selected pair detail */}
      <AnimatePresence>
        {selectedPair && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 rounded-xl border bg-zinc-900/50"
            style={{ borderColor: synergyColor(selectedPair.synergyScore) + "40" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-zinc-200">{selectedPair.domains[0]}</span>
                <GitBranch className="w-4 h-4 text-zinc-500" />
                <span className="text-sm font-mono font-bold text-zinc-200">{selectedPair.domains[1]}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge style={{ backgroundColor: synergyColor(selectedPair.synergyScore) + "20", color: synergyColor(selectedPair.synergyScore), borderColor: "transparent" }}>
                  SYNERGY {(selectedPair.synergyScore * 100).toFixed(1)}
                </Badge>
                <button onClick={() => setSelectedPair(null)} className="text-zinc-600 hover:text-zinc-400 text-xs">✕</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-mono text-zinc-500 uppercase mb-2">Novel Insight</p>
                <p className="text-xs text-zinc-300 leading-relaxed italic">"{selectedPair.novelInsight}"</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {selectedPair.sharedConcepts.map((c) => (
                    <Badge key={c} variant="outline" className="text-[8px] border-zinc-700 text-zinc-500">{c}</Badge>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[8px] text-zinc-600 uppercase">Correlation r</p>
                    <p className="text-xs font-mono text-amber-400">{selectedPair.correlationCoef.toFixed(3)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-zinc-600 uppercase">2026 Citations</p>
                    <p className="text-xs font-mono text-cyan-400">{selectedPair.citations}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-mono text-zinc-500 uppercase mb-2">Publication Trend</p>
                <div className="h-[100px]">
                  <ResponsiveContainer>
                    <AreaChart data={selectedPair.trendData.map((v, i) => ({ year: 2020 + i, citations: v }))}>
                      <defs>
                        <linearGradient id="synGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={synergyColor(selectedPair.synergyScore)} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={synergyColor(selectedPair.synergyScore)} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="year" hide />
                      <YAxis hide />
                      <Area type="monotone" dataKey="citations" stroke={synergyColor(selectedPair.synergyScore)} fill="url(#synGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top synergies ranking */}
      <div>
        <p className="text-[10px] font-mono text-zinc-500 uppercase mb-3">Top Cross-Domain Synergies</p>
        <div className="space-y-2">
          {topSynergies.map((ins, i) => (
            <motion.button
              key={i}
              whileHover={{ x: 4 }}
              onClick={() => setSelectedPair(ins)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all text-left"
            >
              <span className="text-[10px] font-mono text-zinc-600 w-4">0{i + 1}</span>
              <div className="flex-1">
                <p className="text-[11px] font-mono font-bold text-zinc-300">{ins.domains[0]} × {ins.domains[1]}</p>
                <p className="text-[9px] text-zinc-600 truncate">{ins.novelInsight}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] font-mono font-bold" style={{ color: synergyColor(ins.synergyScore) }}>
                  {(ins.synergyScore * 100).toFixed(0)}%
                </p>
                <p className={`text-[8px] font-mono ${ins.trend === "rising" ? "text-emerald-400" : ins.trend === "declining" ? "text-rose-400" : "text-zinc-500"}`}>
                  {ins.trend}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Trend Intelligence Engine ────────────────────────────────────────────────

interface TrendIntelligenceProps { trends: TrendReport[] }

export const TrendIntelligencePanel: React.FC<TrendIntelligenceProps> = ({ trends }) => {
  const [selectedTrend, setSelectedTrend] = useState<TrendReport | null>(trends[0] || null);

  const YEARS = ["2020", "2021", "2022", "2023", "2024", "2025", "2026"];

  const trendChartData = selectedTrend
    ? YEARS.map((year, i) => ({
        year,
        citations: [
          selectedTrend.citations2020, selectedTrend.citations2021, selectedTrend.citations2022,
          selectedTrend.citations2023, selectedTrend.citations2024, selectedTrend.citations2025,
          selectedTrend.citations2026,
        ][i],
      }))
    : [];

  const momentumColor = (m: number) => m > 0.7 ? "#34d399" : m > 0.4 ? "#fbbf24" : "#f43f5e";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Trend list */}
      <div>
        <p className="text-[10px] font-mono text-zinc-500 uppercase mb-3">Detected Trends</p>
        <ScrollArea className="h-[400px] pr-2">
          <div className="space-y-2">
            {trends.map((trend, i) => (
              <motion.button
                key={i}
                whileHover={{ x: 2 }}
                onClick={() => setSelectedTrend(trend)}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  selectedTrend === trend
                    ? "bg-zinc-800/50 border-emerald-500/30"
                    : "bg-zinc-900/30 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono font-bold text-zinc-200 truncate">{trend.topic}</p>
                    <p className="text-[9px] text-zinc-500 mt-0.5">{trend.domain}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${trend.momentum * 100}%`, backgroundColor: momentumColor(trend.momentum) }}
                        />
                      </div>
                      <span className="text-[9px] font-mono" style={{ color: momentumColor(trend.momentum) }}>
                        {(trend.momentum * 100).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {trend.keyTerms.slice(0, 3).map((t) => (
                    <span key={t} className="text-[7px] font-mono px-1 py-0.5 rounded bg-zinc-800 text-zinc-500">{t}</span>
                  ))}
                </div>
              </motion.button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Trend detail */}
      {selectedTrend && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-mono font-bold text-zinc-200 mb-1">{selectedTrend.topic}</h4>
            <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-500">{selectedTrend.domain}</Badge>
          </div>

          <div className="h-[200px]">
            <ResponsiveContainer>
              <AreaChart data={trendChartData}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px", fontSize: 10 }}
                  itemStyle={{ color: "#34d399" }}
                />
                <Area type="monotone" dataKey="citations" stroke="#34d399" fill="url(#trendGrad)" strokeWidth={2} dot={{ r: 3, fill: "#34d399" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <p className="text-[8px] text-zinc-600 uppercase mb-1">Momentum Score</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-mono font-bold" style={{ color: momentumColor(selectedTrend.momentum) }}>
                  {(selectedTrend.momentum * 100).toFixed(0)}%
                </p>
                <TrendingUp className="w-4 h-4" style={{ color: momentumColor(selectedTrend.momentum) }} />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <p className="text-[8px] text-zinc-600 uppercase mb-1">Peak Year (Pred.)</p>
              <p className="text-lg font-mono font-bold text-cyan-400">{selectedTrend.peakYear}</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <p className="text-[9px] font-mono text-amber-400 uppercase mb-1">Research Gap Identified</p>
            <p className="text-[11px] text-zinc-300 leading-relaxed">{selectedTrend.researchGap}</p>
          </div>

          <div>
            <p className="text-[9px] font-mono text-zinc-500 uppercase mb-2">Key Terms</p>
            <div className="flex flex-wrap gap-1">
              {selectedTrend.keyTerms.map((t) => (
                <Badge key={t} variant="outline" className="text-[9px] border-zinc-700 text-zinc-400">{t}</Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
