import React, { useState, useMemo } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, BarChart, Bar
} from "recharts";
import { OmicsDataset, DifferentialGene } from "../services/bioinformaticsService";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props { dataset: OmicsDataset }

// ─── Volcano Plot ─────────────────────────────────────────────────────────────

const VolcanoPlot: React.FC<{ genes: DifferentialGene[] }> = ({ genes }) => {
  const [hoveredGene, setHoveredGene] = useState<DifferentialGene | null>(null);
  const [threshold, setThreshold] = useState({ fc: 1, pval: 0.05 });

  const volcanoData = useMemo(() =>
    genes.map((g) => ({
      ...g,
      x: g.logFC,
      y: Math.min(30, -Math.log10(g.pValue + 1e-300)),
      sig: g.pValue < threshold.pval && Math.abs(g.logFC) > threshold.fc,
    })), [genes, threshold]);

  const upCount = volcanoData.filter((d) => d.sig && d.x > 0).length;
  const downCount = volcanoData.filter((d) => d.sig && d.x < 0).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-[10px] font-mono">
          <span className="text-rose-400">↑ UP: {upCount}</span>
          <span className="text-zinc-500">NS: {genes.length - upCount - downCount}</span>
          <span className="text-cyan-400">↓ DOWN: {downCount}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="text-zinc-500">FC:</span>
          <input
            type="number" value={threshold.fc} step={0.5} min={0.1}
            onChange={(e) => setThreshold((p) => ({ ...p, fc: +e.target.value }))}
            className="w-14 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-300 text-[10px]"
          />
          <span className="text-zinc-500">p:</span>
          <input
            type="number" value={threshold.pval} step={0.01} min={0.001} max={0.1}
            onChange={(e) => setThreshold((p) => ({ ...p, pval: +e.target.value }))}
            className="w-14 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-300 text-[10px]"
          />
        </div>
      </div>
      <div className="h-[300px] relative">
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="x" name="log₂FC" tick={{ fill: "#71717a", fontSize: 10 }} label={{ value: "log₂FC", position: "insideBottom", fill: "#71717a", fontSize: 10 }} />
            <YAxis dataKey="y" name="-log₁₀(p)" tick={{ fill: "#71717a", fontSize: 10 }} label={{ value: "-log₁₀(p)", angle: -90, position: "insideLeft", fill: "#71717a", fontSize: 10 }} />
            <ReferenceLine x={threshold.fc} stroke="#3f3f46" strokeDasharray="4 4" />
            <ReferenceLine x={-threshold.fc} stroke="#3f3f46" strokeDasharray="4 4" />
            <ReferenceLine y={-Math.log10(threshold.pval)} stroke="#3f3f46" strokeDasharray="4 4" />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-zinc-900 border border-zinc-700 rounded p-2 text-[10px] font-mono">
                    <p className="text-emerald-400 font-bold">{d.gene}</p>
                    <p className="text-zinc-400">FC: {d.logFC?.toFixed(3)}</p>
                    <p className="text-zinc-400">p: {d.pValue?.toExponential(2)}</p>
                    <p className={d.regulated === "up" ? "text-rose-400" : d.regulated === "down" ? "text-cyan-400" : "text-zinc-500"}>
                      {d.regulated?.toUpperCase()}
                    </p>
                  </div>
                );
              }}
            />
            <Scatter data={volcanoData} isAnimationActive={false}>
              {volcanoData.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.sig ? (d.x > 0 ? "#f43f5e" : "#22d3ee") : "#27272a"}
                  fillOpacity={d.sig ? 0.9 : 0.5}
                  r={d.sig ? 4 : 2}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      {/* Top genes */}
      <div className="grid grid-cols-2 gap-4 mt-2">
        {["up", "down"].map((dir) => (
          <div key={dir}>
            <p className={`text-[9px] font-mono uppercase mb-2 ${dir === "up" ? "text-rose-400" : "text-cyan-400"}`}>
              Top {dir === "up" ? "Upregulated" : "Downregulated"}
            </p>
            <div className="space-y-1">
              {genes
                .filter((g) => g.regulated === dir && g.pValue < 0.05)
                .sort((a, b) => Math.abs(b.logFC) - Math.abs(a.logFC))
                .slice(0, 5)
                .map((g) => (
                  <div key={g.gene} className="flex justify-between items-center px-2 py-1 rounded bg-zinc-900/50 border border-zinc-800/50">
                    <span className="text-[10px] font-mono font-bold text-zinc-300">{g.gene}</span>
                    <span className={`text-[9px] font-mono ${dir === "up" ? "text-rose-400" : "text-cyan-400"}`}>
                      {g.logFC > 0 ? "+" : ""}{g.logFC.toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── PCA Plot ─────────────────────────────────────────────────────────────────

const PCAPlot: React.FC<{ dataset: OmicsDataset }> = ({ dataset }) => {
  const CONDITION_COLORS = ["#34d399", "#f43f5e", "#a78bfa", "#fbbf24", "#60a5fa"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <span>PC1: {dataset.varianceExplained[0]}% variance</span>
        <span>PC2: {dataset.varianceExplained[1]}% variance</span>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="x" name="PC1" tick={{ fill: "#71717a", fontSize: 10 }} label={{ value: `PC1 (${dataset.varianceExplained[0]}%)`, position: "insideBottom", fill: "#71717a", fontSize: 10 }} />
            <YAxis dataKey="y" name="PC2" tick={{ fill: "#71717a", fontSize: 10 }} label={{ value: `PC2 (${dataset.varianceExplained[1]}%)`, angle: -90, position: "insideLeft", fill: "#71717a", fontSize: 10 }} />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-zinc-900 border border-zinc-700 rounded p-2 text-[10px] font-mono">
                    <p className="text-zinc-300 font-bold">{d.sample}</p>
                    <p className="text-zinc-500">{d.condition}</p>
                  </div>
                );
              }}
            />
            {dataset.conditions.map((cond, ci) => (
              <Scatter
                key={cond}
                name={cond}
                data={dataset.pcaData.filter((d) => d.condition === cond)}
                fill={CONDITION_COLORS[ci % CONDITION_COLORS.length]}
                opacity={0.85}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 justify-center">
        {dataset.conditions.map((cond, ci) => (
          <div key={cond} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CONDITION_COLORS[ci % CONDITION_COLORS.length] }} />
            <span className="text-[10px] font-mono text-zinc-400">{cond}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Mini Heatmap ─────────────────────────────────────────────────────────────

const MiniHeatmap: React.FC<{ dataset: OmicsDataset }> = ({ dataset }) => {
  const rows = dataset.heatmapData.slice(0, 20);
  if (!rows.length) return null;

  const allValues = rows.flatMap((r) => r.samples);
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);

  const normalize = (v: number) => (v - minV) / (maxV - minV + 1e-10);

  const colorScale = (v: number): string => {
    const t = normalize(v);
    if (t < 0.5) {
      const r = Math.round(34 + (2 - 34) * (t * 2));
      const g = Math.round(211 + (34 - 211) * (t * 2));
      const b = Math.round(153 + (16 - 153) * (t * 2));
      return `rgb(${r},${g},${b})`;
    } else {
      const t2 = (t - 0.5) * 2;
      const r = Math.round(2 + (244 - 2) * t2);
      const g = Math.round(34 + (63 - 34) * t2);
      const b = Math.round(16 + (94 - 16) * t2);
      return `rgb(${r},${g},${b})`;
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div className="flex mb-1">
          <div className="w-16" />
          {dataset.sampleNames.map((s) => (
            <div key={s} className="w-5 text-[7px] font-mono text-zinc-600" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", height: 48 }}>
              {s.split("_").pop()}
            </div>
          ))}
        </div>
        {rows.map((row) => (
          <div key={row.gene} className="flex items-center mb-0.5">
            <div className="w-16 text-[9px] font-mono text-zinc-400 text-right pr-2 truncate">{row.gene}</div>
            {row.samples.map((val, si) => (
              <div
                key={si}
                className="w-5 h-4 border-[0.5px] border-zinc-900/30"
                style={{ backgroundColor: colorScale(val) }}
                title={`${row.gene}: ${val.toFixed(1)}`}
              />
            ))}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-3 ml-16">
          <span className="text-[8px] font-mono text-cyan-400">Low</span>
          <div className="h-2 w-24 rounded-full" style={{ background: "linear-gradient(to right, rgb(34,211,153), rgb(2,34,16), rgb(244,63,94))" }} />
          <span className="text-[8px] font-mono text-rose-400">High</span>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const OmicsVisualization: React.FC<Props> = ({ dataset }) => {
  const sigGenes = dataset.differentialFeatures.filter((g) => g.pValue < 0.05);
  const upGenes = sigGenes.filter((g) => g.regulated === "up").length;
  const downGenes = sigGenes.filter((g) => g.regulated === "down").length;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Features", value: dataset.featureCount.toLocaleString(), color: "text-zinc-300" },
          { label: "Significant", value: sigGenes.length.toLocaleString(), color: "text-emerald-400" },
          { label: "Upregulated", value: upGenes.toLocaleString(), color: "text-rose-400" },
          { label: "Downregulated", value: downGenes.toLocaleString(), color: "text-cyan-400" },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 text-center">
            <p className={`text-lg font-mono font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-zinc-600 uppercase mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="volcano">
        <TabsList className="bg-zinc-900 border border-zinc-800 h-8">
          <TabsTrigger value="volcano" className="text-[10px] font-mono data-[state=active]:bg-zinc-800">Volcano</TabsTrigger>
          <TabsTrigger value="pca" className="text-[10px] font-mono data-[state=active]:bg-zinc-800">PCA</TabsTrigger>
          <TabsTrigger value="heatmap" className="text-[10px] font-mono data-[state=active]:bg-zinc-800">Heatmap</TabsTrigger>
        </TabsList>
        <TabsContent value="volcano" className="mt-4">
          <VolcanoPlot genes={dataset.differentialFeatures} />
        </TabsContent>
        <TabsContent value="pca" className="mt-4">
          <PCAPlot dataset={dataset} />
        </TabsContent>
        <TabsContent value="heatmap" className="mt-4">
          <MiniHeatmap dataset={dataset} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
