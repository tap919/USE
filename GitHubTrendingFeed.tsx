import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import {
  Star, GitFork, ExternalLink, Zap, RefreshCw,
  TrendingUp, Brain, Code, Search, Loader2,
  FlaskConical, Dna, Database, Activity, Network,
  ChevronRight, CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// ─── Types ─────────────────────────────────────────────────────────────────
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  html_url: string;
  topics: string[];
  updated_at: string;
  open_issues_count: number;
}

export interface RepoAnalysis {
  ibs_score: number;
  domain_mapping: string;
  basketball_analog: string;
  biotech_analog: string;
  integration_vector: string;
  r0_impact: string;
  formula_connection: string;
}

export interface InjectedRepo extends GitHubRepo {
  analysis: RepoAnalysis;
}

// ─── Config ─────────────────────────────────────────────────────────────────
const TOPIC_PRESETS = [
  { label: "Bioinformatics", query: "topic:bioinformatics stars:>200", color: "emerald" },
  { label: "Genomics", query: "topic:genomics stars:>500", color: "cyan" },
  { label: "AI Agents", query: "topic:agents topic:llm stars:>1000", color: "violet" },
  { label: "Data Viz", query: "topic:visualization topic:scientific stars:>300", color: "amber" },
  { label: "Simulation", query: "topic:simulation topic:physics stars:>200", color: "rose" },
  { label: "Multi-Agent", query: "crewai OR langraph OR autogen stars:>2000", color: "indigo" },
  { label: "Protein / ML", query: "protein folding machine-learning stars:>1000", color: "pink" },
  { label: "Workflow", query: "topic:workflow topic:pipeline topic:automation stars:>500", color: "orange" },
];

// Trending OPEN SOURCE TOOLS curated list (static, based on real repos)
const TRENDING_TOOLS = [
  {
    name: "LangGraph", stars: "8.2k", repo: "langchain-ai/langgraph",
    desc: "Multi-agent orchestration framework with stateful graph execution.",
    ibs_analog: "Agent Pathway Router", domain: "AI Agents", ibs_score: 94,
    color: "violet", formula: "Agent DAG ≈ Lotka-Volterra Phase Portrait"
  },
  {
    name: "CrewAI", stars: "22k", repo: "crewAIInc/crewAI",
    desc: "Framework for role-based multi-agent collaboration. Trending #1 in agents.",
    ibs_analog: "IBS Agent Roster Manager", domain: "Multi-Agent", ibs_score: 96,
    color: "emerald", formula: "Crew Tasks ≈ Replicator-Mutator Dynamics"
  },
  {
    name: "Scanpy", stars: "2.1k", repo: "scverse/scanpy",
    desc: "Single-cell RNA-seq analysis. The gold standard for transcriptomics.",
    ibs_analog: "Viral Load Signal Parser", domain: "Genomics", ibs_score: 91,
    color: "cyan", formula: "Cell Clusters ≈ Genomic Vector Space L"
  },
  {
    name: "Biopython", stars: "5.0k", repo: "biopython/biopython",
    desc: "Tools for computational molecular biology: sequences, structures, phylogenetics.",
    ibs_analog: "DNA Sequence Analyzer", domain: "Bioinformatics", ibs_score: 89,
    color: "teal", formula: "Sequence Alignment ≈ Pr(fixation) ≈ 2s"
  },
  {
    name: "n8n", stars: "56k", repo: "n8n-io/n8n",
    desc: "Node-based AI workflow automation with 400+ integrations. Self-hostable.",
    ibs_analog: "IBS Module Workflow Bus", domain: "Orchestration", ibs_score: 87,
    color: "rose", formula: "Node Triggers ≈ R0 Cascade Propagation"
  },
  {
    name: "Ollama", stars: "128k", repo: "ollama/ollama",
    desc: "Run LLMs locally. Llama 3, Mistral, DeepSeek — all on your hardware.",
    ibs_analog: "Local Neural Bench Rack", domain: "AI Models", ibs_score: 85,
    color: "amber", formula: "Inference Rate ≈ Replication Tempo (Pace)"
  },
  {
    name: "PyTorch", stars: "88k", repo: "pytorch/pytorch",
    desc: "Flexible deep learning framework. Foundation of modern AI research.",
    ibs_analog: "Gradient Optimization Engine", domain: "ML Framework", ibs_score: 92,
    color: "orange", formula: "Backprop ≈ Selection Coefficient s convergence"
  },
  {
    name: "Grafana", stars: "66k", repo: "grafana/grafana",
    desc: "Open-source analytics and monitoring. Real-time dashboards for any data.",
    ibs_analog: "IBS Telemetry Dashboard", domain: "Observability", ibs_score: 82,
    color: "yellow", formula: "Metric Panels ≈ Module Load Distribution"
  },
  {
    name: "AlphaFold", stars: "14k", repo: "google-deepmind/alphafold",
    desc: "DeepMind's revolutionary protein structure prediction from amino acid sequence.",
    ibs_analog: "Protein 3D Fold Mapper", domain: "Structural Bio", ibs_score: 98,
    color: "indigo", formula: "Fold Energy ≈ Lotka-Volterra Carrying Capacity K"
  },
  {
    name: "Cellpose", stars: "1.8k", repo: "MouseLand/cellpose",
    desc: "Generalist algorithm for cell and nucleus segmentation from microscopy.",
    ibs_analog: "Cell Boundary Tracker", domain: "Imaging / AI", ibs_score: 88,
    color: "pink", formula: "Segmentation Mask ≈ Phase Portrait Boundary"
  },
  {
    name: "Vega-Altair", stars: "9.5k", repo: "altair-viz/altair",
    desc: "Declarative statistical visualization library. Grammar-of-graphics in Python.",
    ibs_analog: "Statistical Signal Painter", domain: "Visualization", ibs_score: 80,
    color: "sky", formula: "Mark Encoding ≈ Genomic Vector Axis Projection"
  },
  {
    name: "GATK", stars: "1.9k", repo: "broadinstitute/gatk",
    desc: "Broad Institute's genome analysis toolkit. Variant discovery at scale.",
    ibs_analog: "Genomic Variant Scout", domain: "Genomics", ibs_score: 93,
    color: "emerald", formula: "Haplotype Caller ≈ Mutation Rate μ Detection"
  },
];

// ─── Lang Color Map ──────────────────────────────────────────────────────────
const LANG_COLORS: Record<string, string> = {
  Python: "bg-blue-500/20 text-blue-400 border-blue-500/20",
  JavaScript: "bg-yellow-500/20 text-yellow-400 border-yellow-500/20",
  TypeScript: "bg-sky-500/20 text-sky-400 border-sky-500/20",
  Jupyter: "bg-orange-500/20 text-orange-400 border-orange-500/20",
  R: "bg-indigo-500/20 text-indigo-400 border-indigo-500/20",
  C: "bg-zinc-500/20 text-zinc-400 border-zinc-500/20",
  "C++": "bg-zinc-500/20 text-zinc-400 border-zinc-500/20",
  Java: "bg-red-500/20 text-red-400 border-red-500/20",
  Rust: "bg-orange-600/20 text-orange-500 border-orange-600/20",
  Go: "bg-cyan-500/20 text-cyan-400 border-cyan-500/20",
  Shell: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
};

// ─── Component ───────────────────────────────────────────────────────────────
interface Props {
  onInject: (repo: InjectedRepo) => void;
  injectedIds: Set<number | string>;
}

export const GitHubTrendingFeed: React.FC<Props> = ({ onInject, injectedIds }) => {
  const [repos, setRepos] = useState<(GitHubRepo & { analysis?: RepoAnalysis; analyzing: boolean })[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(TOPIC_PRESETS[0]);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [viewMode, setViewMode] = useState<"live" | "curated">("curated");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRepos = useCallback(async (query: string) => {
    setLoading(true);
    setRepos([]);
    try {
      const res = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=9`,
        { headers: { Accept: "application/vnd.github.v3+json" } }
      );
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      const data = await res.json();
      if (data.items) {
        setRepos(data.items.map((r: GitHubRepo) => ({ ...r, analyzing: false })));
      }
    } catch (err) {
      toast.error("GitHub API unavailable — check rate limits or network");
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeRepo = async (repo: GitHubRepo) => {
    setRepos(prev => prev.map(r => r.id === repo.id ? { ...r, analyzing: true } : r));
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Analyze this GitHub repo for the IBS Ultimate Science Engine.
          
Repo: ${repo.full_name}
Description: ${repo.description}
Language: ${repo.language}
Topics: ${(repo.topics || []).join(", ")}
Stars: ${repo.stargazers_count}

The IBS engine:
- Maps NBA stats (R0, Gravity, Trueness, SVI) to biotech pathways
- Uses formulas: R0=(Gravity×3PAr×Pace)/DRtg, Replicator-Mutator dynamics, Lotka-Volterra
- Runs multi-agent analysis (Lead Scientist, Data Analyst, Revenue Strategist, Growth Agent)
- Scientific domains: biotech, physics, chemistry, astronomy, geology, anatomy

Respond ONLY in valid JSON, no markdown:
{
  "ibs_score": 0-100,
  "domain_mapping": "which IBS domain (1-2 words)",
  "basketball_analog": "5-word NBA/basketball metaphor for this tool",
  "biotech_analog": "5-word biotech/molecular metaphor for this tool",
  "integration_vector": "one sentence: how to plug this into the IBS engine",
  "r0_impact": "how this tool would change the R0 score (positive/negative/neutral + reason)",
  "formula_connection": "which IBS formula this tool most resembles (equation ≈ concept)"
}`,
        config: { responseMimeType: "application/json" }
      });
      let text = response.text || "{}";
      // Strip possible markdown code fences
      text = text.replace(/```json|```/g, "").trim();
      const analysis: RepoAnalysis = JSON.parse(text);
      setRepos(prev => prev.map(r => r.id === repo.id ? { ...r, analysis, analyzing: false } : r));
      toast.success(`${repo.name} analyzed — IBS Score: ${analysis.ibs_score}`);
    } catch (err) {
      setRepos(prev => prev.map(r => r.id === repo.id ? { ...r, analyzing: false } : r));
      toast.error(`Analysis failed for ${repo.name}`);
    }
  };

  const analyzeAll = async () => {
    setAnalyzingAll(true);
    for (const repo of repos) {
      if (!repo.analysis) await analyzeRepo(repo);
    }
    setAnalyzingAll(false);
    toast.success("All repos analyzed via Gemini AI");
  };

  useEffect(() => {
    if (viewMode === "live") fetchRepos(selectedTopic.query);
  }, [selectedTopic, viewMode, fetchRepos]);

  const filteredTools = TRENDING_TOOLS.filter(t =>
    searchQuery === "" ||
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ── Mode Toggle ── */}
      <div className="flex items-center gap-4">
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode("curated")}
            className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase transition-all ${
              viewMode === "curated" ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-400"
            }`}
          >
            🌟 Curated Tools
          </button>
          <button
            onClick={() => { setViewMode("live"); if (repos.length === 0) fetchRepos(selectedTopic.query); }}
            className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase transition-all ${
              viewMode === "live" ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-400"
            }`}
          >
            🔴 Live GitHub API
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-xs bg-zinc-900 border border-zinc-800 rounded-lg px-3">
          <Search className="w-3 h-3 text-zinc-600" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="filter tools..."
            className="flex-1 bg-transparent text-[10px] font-mono text-zinc-400 py-1.5 outline-none placeholder:text-zinc-700"
          />
        </div>

        {viewMode === "live" && (
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={analyzeAll}
              disabled={analyzingAll || repos.length === 0}
              className="text-[10px] font-mono h-7 border-zinc-800 bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            >
              {analyzingAll ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Brain className="w-3 h-3 mr-1.5" />}
              ANALYZE ALL
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRepos(selectedTopic.query)}
              disabled={loading}
              className="text-[10px] font-mono h-7 border-zinc-800"
            >
              <RefreshCw className={`w-3 h-3 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              REFRESH
            </Button>
          </div>
        )}
      </div>

      {/* ── Curated Tools View ── */}
      {viewMode === "curated" && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Tools Indexed", value: TRENDING_TOOLS.length, color: "text-emerald-400" },
              { label: "Avg IBS Score", value: Math.round(TRENDING_TOOLS.reduce((a, t) => a + t.ibs_score, 0) / TRENDING_TOOLS.length), color: "text-cyan-400" },
              { label: "Domains", value: new Set(TRENDING_TOOLS.map(t => t.domain)).size, color: "text-amber-400" },
              { label: "Stars (Total)", value: "450k+", color: "text-pink-400" },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
                <p className={`text-xl font-mono font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-zinc-600 uppercase mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredTools.map((tool, i) => {
                const isInjected = injectedIds.has(tool.name);
                return (
                  <motion.div
                    key={tool.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className={`bg-zinc-900 border-zinc-800 h-full flex flex-col hover:border-zinc-600 transition-all ${
                      isInjected ? "border-emerald-500/30 bg-emerald-500/5" : ""
                    }`}>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`text-[8px] h-4 px-1.5 bg-zinc-800 text-zinc-400 border-zinc-700`}>
                                {tool.domain}
                              </Badge>
                              <Badge className={`text-[8px] h-4 px-1.5 ${
                                tool.ibs_score >= 90 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" :
                                tool.ibs_score >= 80 ? "bg-amber-500/20 text-amber-400 border-amber-500/20" :
                                "bg-zinc-800 text-zinc-500 border-zinc-700"
                              }`}>
                                IBS {tool.ibs_score}
                              </Badge>
                            </div>
                            <CardTitle className="text-sm font-bold text-zinc-200">{tool.name}</CardTitle>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-mono text-amber-400 flex items-center gap-1">
                              <Star className="w-2.5 h-2.5" />
                              {tool.stars}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 flex-1 flex flex-col gap-3">
                        <p className="text-[10px] text-zinc-500 leading-relaxed">{tool.desc}</p>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[9px]">
                            <span className="text-zinc-600">🏀 NBA Analog</span>
                            <span className="text-amber-400 italic font-mono">{tool.ibs_analog}</span>
                          </div>
                          <div className="flex justify-between text-[9px]">
                            <span className="text-zinc-600">🧬 Formula Link</span>
                            <span className="text-cyan-400 font-mono text-[8px]">{tool.formula}</span>
                          </div>
                          <Progress value={tool.ibs_score} className="h-0.5 bg-zinc-800 mt-1" />
                        </div>

                        <div className="mt-auto flex gap-2">
                          <a
                            href={`https://github.com/${tool.repo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-800 hover:bg-zinc-800 transition-colors text-[9px] text-zinc-500"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            GitHub
                          </a>
                          <Button
                            size="sm"
                            disabled={isInjected}
                            onClick={() => {
                              onInject({
                                id: i,
                                name: tool.name,
                                full_name: tool.repo,
                                description: tool.desc,
                                stargazers_count: parseInt(tool.stars.replace("k", "000").replace(".", "")),
                                forks_count: 0,
                                language: "Python",
                                html_url: `https://github.com/${tool.repo}`,
                                topics: [tool.domain.toLowerCase()],
                                updated_at: new Date().toISOString(),
                                open_issues_count: 0,
                                analysis: {
                                  ibs_score: tool.ibs_score,
                                  domain_mapping: tool.domain,
                                  basketball_analog: tool.ibs_analog,
                                  biotech_analog: tool.formula,
                                  integration_vector: `Integrate ${tool.name} as a core pipeline module`,
                                  r0_impact: "positive — increases replication fidelity",
                                  formula_connection: tool.formula
                                }
                              });
                              toast.success(`${tool.name} injected into experiment pipeline`);
                            }}
                            className={`flex-1 h-7 text-[9px] font-mono ${
                              isInjected
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-500 text-white"
                            }`}
                          >
                            {isInjected ? (
                              <><CheckCircle2 className="w-2.5 h-2.5 mr-1" /> INJECTED</>
                            ) : (
                              <><Zap className="w-2.5 h-2.5 mr-1" /> INJECT INTO ENGINE</>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Live GitHub API View ── */}
      {viewMode === "live" && (
        <div className="space-y-4">
          {/* Topic selector */}
          <div className="flex gap-2 flex-wrap">
            {TOPIC_PRESETS.map(t => (
              <button
                key={t.label}
                onClick={() => setSelectedTopic(t)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-all ${
                  selectedTopic.label === t.label
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                    : "bg-zinc-800/50 border-zinc-800 text-zinc-500 hover:border-zinc-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-zinc-600 mx-auto" />
                <p className="text-[10px] font-mono text-zinc-600 uppercase">Fetching from GitHub API...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repos.map((repo, i) => {
                const isInjected = injectedIds.has(repo.id);
                return (
                  <motion.div
                    key={repo.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className={`bg-zinc-900 border-zinc-800 h-full flex flex-col hover:border-zinc-600 transition-all ${
                      isInjected ? "border-emerald-500/30" : ""
                    }`}>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start mb-2">
                          <Badge className={`text-[8px] h-4 px-1.5 border ${LANG_COLORS[repo.language || ""] || "bg-zinc-800 text-zinc-500 border-zinc-700"}`}>
                            {repo.language || "Unknown"}
                          </Badge>
                          {repo.analysis && (
                            <Badge className={`text-[8px] h-4 px-1.5 ${
                              repo.analysis.ibs_score >= 80 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" :
                              "bg-amber-500/20 text-amber-400 border-amber-500/20"
                            }`}>
                              IBS {repo.analysis.ibs_score}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xs font-mono text-zinc-300 leading-snug">
                          {repo.full_name}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="p-4 pt-0 flex-1 flex flex-col gap-3">
                        <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">
                          {repo.description || "No description available."}
                        </p>

                        <div className="flex items-center gap-4 text-[9px] text-zinc-600">
                          <span className="flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 text-amber-500" />
                            {(repo.stargazers_count / 1000).toFixed(1)}k
                          </span>
                          <span className="flex items-center gap-1">
                            <GitFork className="w-2.5 h-2.5" />
                            {(repo.forks_count / 1000).toFixed(1)}k
                          </span>
                          {(repo.topics || []).slice(0, 2).map(t => (
                            <span key={t} className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-500">{t}</span>
                          ))}
                        </div>

                        {/* AI Analysis Panel */}
                        {repo.analyzing ? (
                          <div className="p-2 rounded bg-zinc-800/50 border border-zinc-800 flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                            <span className="text-[9px] text-zinc-500 font-mono">Gemini analyzing...</span>
                          </div>
                        ) : repo.analysis ? (
                          <div className="p-3 rounded bg-zinc-800/40 border border-zinc-700/50 space-y-2">
                            <div className="grid grid-cols-2 gap-1">
                              <div>
                                <p className="text-[8px] text-zinc-600 uppercase mb-0.5">Domain</p>
                                <p className="text-[9px] text-cyan-400 font-mono">{repo.analysis.domain_mapping}</p>
                              </div>
                              <div>
                                <p className="text-[8px] text-zinc-600 uppercase mb-0.5">R0 Impact</p>
                                <p className="text-[9px] text-amber-400 font-mono truncate">{repo.analysis.r0_impact.split("—")[0].trim()}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-[8px] text-zinc-600 uppercase mb-0.5">🏀 NBA Analog</p>
                              <p className="text-[9px] text-amber-400 italic">"{repo.analysis.basketball_analog}"</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-zinc-600 uppercase mb-0.5">Formula</p>
                              <p className="text-[9px] text-pink-400 font-mono">{repo.analysis.formula_connection}</p>
                            </div>
                            <Progress value={repo.analysis.ibs_score} className="h-0.5 bg-zinc-700" />
                            <p className="text-[9px] text-zinc-500 leading-tight">{repo.analysis.integration_vector}</p>
                          </div>
                        ) : null}

                        <div className="mt-auto flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-6 text-[9px] font-mono border-zinc-800"
                            onClick={() => analyzeRepo(repo)}
                            disabled={repo.analyzing || !!repo.analysis}
                          >
                            {repo.analysis ? (
                              <><CheckCircle2 className="w-2.5 h-2.5 mr-1 text-emerald-500" /> SCORED</>
                            ) : (
                              <><Brain className="w-2.5 h-2.5 mr-1" /> AI ANALYZE</>
                            )}
                          </Button>
                          {repo.analysis && !isInjected && (
                            <Button
                              size="sm"
                              className="flex-1 h-6 text-[9px] font-mono bg-indigo-600 hover:bg-indigo-500 text-white"
                              onClick={() => {
                                onInject({ ...repo, analysis: repo.analysis! });
                                toast.success(`${repo.name} injected into pipeline`);
                              }}
                            >
                              <TrendingUp className="w-2.5 h-2.5 mr-1" />
                              INJECT
                            </Button>
                          )}
                          {isInjected && (
                            <span className="flex-1 h-6 flex items-center justify-center text-[9px] font-mono text-emerald-400">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> IN PIPELINE
                            </span>
                          )}
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-6 w-7 flex items-center justify-center border border-zinc-800 rounded hover:bg-zinc-800 transition-colors"
                          >
                            <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

              {repos.length === 0 && !loading && (
                <div className="col-span-3 py-20 text-center text-zinc-600">
                  <Code className="w-10 h-10 mx-auto mb-4 opacity-20" />
                  <p className="text-xs font-mono uppercase">No repos loaded — select a topic or refresh</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
