import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Dna, Search, Network, GitMerge, Beaker, BarChart3, Zap, RefreshCw, ChevronRight, BookOpen, Atom, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  runBlastAnalysis, runGOEnrichmentAnalysis, runPathwayAnalysis, buildProteinNetwork,
  generateOmicsDataset, computeCrossDomainSynergies, detectScientificTrends,
  searchNCBI, searchUniProt,
  BlastHit, GoTerm, Pathway, ProteinNetwork, OmicsDataset, CrossDomainInsight, TrendReport,
} from "../services/bioinformaticsService";
import { ProteinNetworkGraph } from "./ProteinNetworkGraph";
import { OmicsVisualization } from "./OmicsVisualization";
import { CrossDomainSynergyMatrix, TrendIntelligencePanel } from "./CrossDomainSynergyMatrix";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const SCIENTIFIC_DOMAINS = ["Biotechnology", "Physics", "Chemistry", "Astronomy", "Geology", "Anatomy & Physiology"];

const EXAMPLE_GENES = ["TP53", "BRCA1", "BRCA2", "EGFR", "KRAS", "MYC", "PIK3CA", "AKT1", "PTEN", "CDK4"];
const EXAMPLE_SEQUENCES = {
  protein: "MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGPDEAPRMPEAAPPVAPAPAAPTPAAPAPAPSWPLSSSVPSQKTYPQGLNGTVNLFRNLNK",
  nucleotide: "ATGGAGGAGCCGCAGTCAGATCCTAGCATAGTGAGTCCAAAGAAGAAACCACTGGATGGAGAATATTTCACCCTTCAGATCCGTGGGCGTGAGCGCTTCGAGATGTTCCGAGAGCTGAATGAG",
};

// ─── BLAST Results ────────────────────────────────────────────────────────────

const BlastResults: React.FC<{ hits: BlastHit[] }> = ({ hits }) => (
  <div className="space-y-1">
    <div className="grid grid-cols-6 gap-2 px-3 py-2 text-[9px] font-mono text-zinc-600 uppercase border-b border-zinc-800">
      <span className="col-span-2">Description</span>
      <span className="text-center">Score</span>
      <span className="text-center">E-value</span>
      <span className="text-center">Identity</span>
      <span className="text-center">Coverage</span>
    </div>
    {hits.map((hit, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.05 }}
        className="grid grid-cols-6 gap-2 px-3 py-2.5 hover:bg-zinc-800/30 rounded border border-transparent hover:border-zinc-800 transition-all cursor-pointer"
      >
        <div className="col-span-2 min-w-0">
          <p className="text-[10px] font-mono font-bold text-cyan-400 truncate">{hit.accession}</p>
          <p className="text-[9px] text-zinc-500 truncate">{hit.organism}</p>
        </div>
        <div className="text-center">
          <span className="text-[10px] font-mono text-emerald-400">{hit.score}</span>
        </div>
        <div className="text-center">
          <span className="text-[10px] font-mono text-amber-400">{hit.eValue < 1e-100 ? "0.0" : hit.eValue.toExponential(1)}</span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <div className="h-1 rounded-full bg-zinc-800 overflow-hidden w-8">
              <div className="h-full rounded-full bg-rose-500" style={{ width: `${hit.identity}%` }} />
            </div>
            <span className="text-[9px] font-mono text-rose-400">{hit.identity}%</span>
          </div>
        </div>
        <div className="text-center">
          <span className="text-[10px] font-mono text-purple-400">{hit.coverage}%</span>
        </div>
      </motion.div>
    ))}
  </div>
);

// ─── GO Enrichment Chart ──────────────────────────────────────────────────────

const GOEnrichmentChart: React.FC<{ terms: GoTerm[] }> = ({ terms }) => {
  const [namespace, setNamespace] = useState<string>("all");
  const NS_COLORS = {
    biological_process: "#34d399",
    molecular_function: "#a78bfa",
    cellular_component: "#60a5fa",
  };

  const filtered = namespace === "all" ? terms : terms.filter((t) => t.namespace === namespace);
  const chartData = filtered.slice(0, 10).map((t) => ({
    name: t.name.length > 35 ? t.name.slice(0, 35) + "…" : t.name,
    enrichment: t.foldEnrichment,
    pValue: -Math.log10(t.pValue),
    namespace: t.namespace,
    geneCount: t.geneCount,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {["all", "biological_process", "molecular_function", "cellular_component"].map((ns) => (
          <button
            key={ns}
            onClick={() => setNamespace(ns)}
            className={`px-2 py-1 rounded text-[9px] font-mono border transition-all uppercase ${
              namespace === ns ? "bg-zinc-700 border-zinc-600 text-zinc-200" : "border-zinc-800 text-zinc-600 hover:border-zinc-700"
            }`}
          >
            {ns === "all" ? "ALL" : ns.replace("_", " ").replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#71717a", fontSize: 8 }} label={{ value: "Fold Enrichment", position: "insideBottom", fill: "#71717a", fontSize: 9 }} />
            <YAxis type="category" dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 8 }} width={180} />
            <Tooltip
              contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
              formatter={(val: any, name: any, props: any) => [
                <span className="font-mono text-emerald-400">{Number(val).toFixed(2)}×</span>,
                "Fold Enrichment"
              ]}
            />
            <Bar dataKey="enrichment" radius={[0, 2, 2, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={NS_COLORS[d.namespace as keyof typeof NS_COLORS] || "#3f3f46"} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4">
        {Object.entries(NS_COLORS).map(([ns, color]) => (
          <div key={ns} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-[8px] font-mono text-zinc-500 capitalize">{ns.replace(/_/g, " ").slice(0, 2).toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Pathway Results ──────────────────────────────────────────────────────────

const PathwayResults: React.FC<{ pathways: Pathway[] }> = ({ pathways }) => {
  const CATEGORY_COLORS: Record<string, string> = {
    Metabolism: "#fbbf24", Signaling: "#f43f5e", Immune: "#34d399",
    "Cell Cycle": "#a78bfa", default: "#60a5fa",
  };

  return (
    <div className="space-y-2">
      {pathways.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[p.category] || CATEGORY_COLORS.default }} />
                <p className="text-[11px] font-mono font-bold text-zinc-200 truncate">{p.name}</p>
              </div>
              <p className="text-[9px] text-zinc-500 leading-relaxed">{p.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {p.genes.slice(0, 6).map((g) => (
                  <span key={g} className="text-[8px] font-mono px-1 py-0.5 rounded bg-zinc-800 text-zinc-400">{g}</span>
                ))}
                {p.genes.length > 6 && <span className="text-[8px] font-mono text-zinc-600">+{p.genes.length - 6}</span>}
              </div>
            </div>
            <div className="shrink-0 text-right space-y-1">
              <Badge variant="outline" className="text-[8px] border-zinc-700 text-zinc-500">{p.source}</Badge>
              <p className="text-[9px] font-mono text-amber-400">p={p.pValue.toExponential(1)}</p>
              <p className="text-[9px] font-mono text-zinc-500">{p.geneCount}/{p.totalGenes} genes</p>
            </div>
          </div>
          <div className="mt-2">
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(p.geneCount / p.totalGenes) * 100}%`, backgroundColor: CATEGORY_COLORS[p.category] || CATEGORY_COLORS.default }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ─── NCBI / UniProt Search ────────────────────────────────────────────────────

const DatabaseSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const [db, setDb] = useState<"pubmed" | "uniprot">("pubmed");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setResults([]);
    try {
      if (db === "pubmed") {
        const { ids, count } = await searchNCBI(query, "pubmed", 10);
        setTotalCount(count);
        if (ids.length) {
          toast.success(`Found ${count.toLocaleString()} PubMed articles`);
          setResults(ids.map((id) => ({ id, type: "pubmed" })));
        } else {
          toast.info("No PubMed results. Generating simulated results.");
          setResults(Array.from({ length: 5 }, (_, i) => ({ id: `sim_${i}`, type: "simulated", title: `${query} - Article ${i + 1}`, authors: "Author et al.", year: 2024 - i, journal: "Nature Bioinformatics" })));
        }
      } else {
        const data = await searchUniProt(query, 10);
        setTotalCount(data.length);
        if (data.length) {
          toast.success(`Found ${data.length} UniProt entries`);
          setResults(data.map((d: any) => ({
            id: d.primaryAccession,
            type: "uniprot",
            name: d.uniProtkbId,
            protein: d.proteinDescription?.recommendedName?.fullName?.value || "Unknown",
            organism: d.organism?.scientificName || "Unknown",
            length: d.sequence?.length || 0,
          })));
        } else {
          toast.info("Live API unavailable. Showing simulated UniProt entries.");
          setResults(Array.from({ length: 5 }, (_, i) => ({
            id: `P${String(i + 10000)}`,
            type: "uniprot",
            name: `${query.toUpperCase()}_HUMAN`,
            protein: `${query} protein isoform ${i + 1}`,
            organism: "Homo sapiens",
            length: 300 + i * 50,
          })));
        }
      }
    } catch {
      toast.error("Database query failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex border border-zinc-800 rounded-lg overflow-hidden">
          {(["pubmed", "uniprot"] as const).map((d) => (
            <button key={d} onClick={() => setDb(d)} className={`px-3 py-2 text-[10px] font-mono uppercase transition-all ${db === d ? "bg-zinc-700 text-zinc-200" : "text-zinc-600 hover:text-zinc-400"}`}>
              {d}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={db === "pubmed" ? "Search publications (e.g. CRISPR cancer)..." : "Search proteins (e.g. TP53 human)..."}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 focus:border-cyan-500/50 outline-none"
        />
        <Button onClick={handleSearch} disabled={isLoading} size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs h-9">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {totalCount > 0 && (
        <p className="text-[10px] font-mono text-zinc-500">
          {db.toUpperCase()} → <span className="text-cyan-400">{totalCount.toLocaleString()}</span> results
        </p>
      )}

      <ScrollArea className="h-[280px] pr-2">
        <div className="space-y-2">
          {results.map((r, i) => (
            <motion.div
              key={r.id + i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all"
            >
              {r.type === "pubmed" || r.type === "simulated" ? (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-cyan-400">PMID: {r.id}</span>
                    <Badge variant="outline" className="text-[8px] border-zinc-700 text-zinc-500">PubMed</Badge>
                  </div>
                  {r.title && <p className="text-[11px] text-zinc-300 mt-1 leading-snug">{r.title}</p>}
                  {r.authors && <p className="text-[9px] text-zinc-500 mt-0.5">{r.authors} · {r.year} · {r.journal}</p>}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono font-bold text-emerald-400">{r.id}</p>
                    <p className="text-[11px] text-zinc-300">{r.protein}</p>
                    <p className="text-[9px] text-zinc-500 italic">{r.organism} · {r.length} aa</p>
                  </div>
                  <Badge variant="outline" className="text-[8px] border-zinc-700 text-zinc-500">UniProt</Badge>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

// ─── Main Hub ─────────────────────────────────────────────────────────────────

export const BioinformaticsHub: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState("sequence");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Sequence analysis
  const [sequence, setSequence] = useState(EXAMPLE_SEQUENCES.protein);
  const [seqType, setSeqType] = useState<"protein" | "nucleotide">("protein");
  const [blastHits, setBlastHits] = useState<BlastHit[]>([]);

  // Gene analysis
  const [geneInput, setGeneInput] = useState(EXAMPLE_GENES.slice(0, 6).join(", "));
  const [organism, setOrganism] = useState("Homo sapiens");
  const [goTerms, setGoTerms] = useState<GoTerm[]>([]);
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [network, setNetwork] = useState<ProteinNetwork | null>(null);

  // Omics
  const [omicsType, setOmicsType] = useState<"transcriptomics" | "proteomics" | "metabolomics">("transcriptomics");
  const [condition1, setCondition1] = useState("Control");
  const [condition2, setCondition2] = useState("Treatment");
  const [sampleCount, setSampleCount] = useState(12);
  const [omicsDataset, setOmicsDataset] = useState<OmicsDataset | null>(null);

  // Cross-domain
  const [crossDomainInsights, setCrossDomainInsights] = useState<CrossDomainInsight[]>([]);
  const [trends, setTrends] = useState<TrendReport[]>([]);
  const [hasLoadedCrossDomain, setHasLoadedCrossDomain] = useState(false);

  const setProgress = (step: string, pct: number) => {
    setLoadingStep(step);
    setLoadingProgress(pct);
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleBLAST = useCallback(async () => {
    if (!sequence.trim()) return;
    setIsLoading(true);
    setProgress("Aligning sequence…", 20);
    try {
      setProgress("Querying database…", 60);
      const hits = await runBlastAnalysis(sequence, seqType);
      setBlastHits(hits);
      setProgress("Complete", 100);
      toast.success(`BLAST: ${hits.length} hits found`);
    } catch {
      toast.error("BLAST analysis failed");
    } finally {
      setIsLoading(false);
    }
  }, [sequence, seqType]);

  const handleGeneAnalysis = useCallback(async () => {
    const genes = geneInput.split(/[,\s]+/).map((g) => g.trim()).filter(Boolean);
    if (!genes.length) return;
    setIsLoading(true);
    try {
      setProgress("GO enrichment…", 20);
      const [go, pw, net] = await Promise.all([
        runGOEnrichmentAnalysis(genes, organism),
        runPathwayAnalysis(genes, organism),
        buildProteinNetwork(genes, organism.split(" ")[0].toLowerCase()),
      ]);
      setProgress("Building network…", 70);
      setGoTerms(go);
      setPathways(pw);
      setNetwork(net);
      setProgress("Complete", 100);
      toast.success(`Gene analysis: ${go.length} GO terms, ${pw.length} pathways, ${net.nodes.length} network nodes`);
    } catch {
      toast.error("Gene analysis failed");
    } finally {
      setIsLoading(false);
    }
  }, [geneInput, organism]);

  const handleOmicsAnalysis = useCallback(async () => {
    setIsLoading(true);
    setProgress("Generating multi-omics data…", 30);
    try {
      const dataset = await generateOmicsDataset(omicsType, condition1, condition2, sampleCount);
      setProgress("Running differential analysis…", 70);
      setOmicsDataset(dataset);
      setProgress("Complete", 100);
      toast.success(`${omicsType}: ${dataset.featureCount.toLocaleString()} features analyzed`);
    } catch {
      toast.error("Omics analysis failed");
    } finally {
      setIsLoading(false);
    }
  }, [omicsType, condition1, condition2, sampleCount]);

  const handleCrossDomain = useCallback(async () => {
    setIsLoading(true);
    setProgress("Computing synergy matrix…", 30);
    try {
      const [synergies, trendData] = await Promise.all([
        computeCrossDomainSynergies(SCIENTIFIC_DOMAINS),
        detectScientificTrends(
          SCIENTIFIC_DOMAINS,
          ["machine learning", "single-cell", "CRISPR", "quantum computing", "digital twin", "foundation model"]
        ),
      ]);
      setProgress("Detecting trends…", 75);
      setCrossDomainInsights(synergies);
      setTrends(trendData);
      setHasLoadedCrossDomain(true);
      setProgress("Complete", 100);
      toast.success(`Cross-domain: ${synergies.length} synergies, ${trendData.length} trends detected`);
    } catch {
      toast.error("Cross-domain analysis failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-mono font-bold flex items-center gap-2">
            <Dna className="w-5 h-5 text-cyan-400" />
            BIOINFORMATICS & DATA SCIENCE ENGINE
          </h2>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
            Open-Source Tools: NCBI · UniProt · STRING · PubChem · KEGG · Reactome
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["NCBI", "UniProt", "STRING", "KEGG"].map((db) => (
            <div key={db} className="flex items-center gap-1 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[8px] font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-zinc-400">{db}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg flex items-center gap-3"
          >
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-mono text-cyan-400 uppercase">{loadingStep}</p>
              <Progress value={loadingProgress} className="h-1 mt-1.5 bg-zinc-800" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-900 border border-zinc-800 w-full h-10 flex justify-start p-1 gap-1">
          {[
            { id: "sequence", icon: <Dna className="w-3 h-3" />, label: "BLAST" },
            { id: "genes", icon: <Network className="w-3 h-3" />, label: "GENE ANALYSIS" },
            { id: "omics", icon: <BarChart3 className="w-3 h-3" />, label: "MULTI-OMICS" },
            { id: "crossdomain", icon: <GitMerge className="w-3 h-3" />, label: "CROSS-DOMAIN" },
            { id: "trends", icon: <Atom className="w-3 h-3" />, label: "TRENDS" },
            { id: "databases", icon: <BookOpen className="w-3 h-3" />, label: "DATABASES" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-1.5 text-[10px] font-mono data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-400"
            >
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ─── BLAST ──────────────────────────────────────────────────────── */}
        <TabsContent value="sequence" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-mono flex items-center gap-2">
                    <Dna className="w-4 h-4 text-cyan-400" />
                    SEQUENCE INPUT
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    {(["protein", "nucleotide"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => { setSeqType(t); setSequence(EXAMPLE_SEQUENCES[t]); }}
                        className={`flex-1 py-1.5 rounded text-[10px] font-mono border transition-all ${seqType === t ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "border-zinc-800 text-zinc-600 hover:border-zinc-700"}`}
                      >
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={sequence}
                    onChange={(e) => setSequence(e.target.value)}
                    className="w-full h-40 bg-black border border-zinc-800 rounded-lg p-3 text-[10px] font-mono text-zinc-300 focus:border-cyan-500/50 outline-none leading-relaxed"
                    placeholder="Paste sequence in FASTA format or plain sequence..."
                    spellCheck={false}
                  />
                  <div className="flex items-center justify-between text-[9px] font-mono text-zinc-600">
                    <span>LENGTH: {sequence.replace(/[>\n\s]/g, "").length} {seqType === "protein" ? "aa" : "bp"}</span>
                    <button onClick={() => setSequence(EXAMPLE_SEQUENCES[seqType])} className="text-cyan-600 hover:text-cyan-400">LOAD EXAMPLE</button>
                  </div>
                  <Button onClick={handleBLAST} disabled={isLoading || !sequence.trim()} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                    RUN BLAST
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-mono flex items-center justify-between">
                    <span>BLAST RESULTS</span>
                    {blastHits.length > 0 && <Badge variant="outline" className="text-[9px] border-zinc-700">{blastHits.length} hits</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {blastHits.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <BlastResults hits={blastHits} />
                    </ScrollArea>
                  ) : (
                    <div className="h-[400px] flex flex-col items-center justify-center text-zinc-700 border-2 border-dashed border-zinc-800 rounded-xl">
                      <Dna className="w-12 h-12 opacity-20 mb-4" />
                      <p className="text-xs font-mono uppercase tracking-widest">Enter sequence and run BLAST</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── Gene Analysis ─────────────────────────────────────────────── */}
        <TabsContent value="genes" className="mt-6 space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-mono flex items-center gap-2">
                <Network className="w-4 h-4 text-emerald-400" />
                GENE SET CONFIGURATION
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <p className="text-[9px] font-mono text-zinc-500 uppercase mb-1">Gene List (comma-separated)</p>
                  <textarea
                    value={geneInput}
                    onChange={(e) => setGeneInput(e.target.value)}
                    className="w-full h-16 bg-black border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-300 focus:border-emerald-500/50 outline-none"
                    placeholder="TP53, BRCA1, EGFR, KRAS..."
                  />
                </div>
                <div>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase mb-1">Organism</p>
                  <select
                    value={organism}
                    onChange={(e) => setOrganism(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono text-zinc-300 focus:border-emerald-500/50 outline-none"
                  >
                    {["Homo sapiens", "Mus musculus", "Rattus norvegicus", "Arabidopsis thaliana", "Saccharomyces cerevisiae"].map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {["TP53 BRCA1 BRCA2 EGFR KRAS", "AKT1 PIK3CA PTEN MDM2 RB1", "MYC BCL2 CDKN2A VEGFA MAPK1"].map((preset, i) => (
                      <button key={i} onClick={() => setGeneInput(preset.replace(/ /g, ", "))} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 hover:text-zinc-300 border border-zinc-700">
                        SET {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleGeneAnalysis} disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    ANALYZE
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {(goTerms.length > 0 || pathways.length > 0 || network) ? (
            <Tabs defaultValue="go">
              <TabsList className="bg-zinc-900 border border-zinc-800 h-8">
                <TabsTrigger value="go" className="text-[10px] font-mono data-[state=active]:bg-zinc-800">GO Enrichment</TabsTrigger>
                <TabsTrigger value="pathway" className="text-[10px] font-mono data-[state=active]:bg-zinc-800">Pathways</TabsTrigger>
                <TabsTrigger value="network" className="text-[10px] font-mono data-[state=active]:bg-zinc-800">PPI Network</TabsTrigger>
              </TabsList>
              <TabsContent value="go" className="mt-4">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="pt-6">
                    {goTerms.length > 0 ? <GOEnrichmentChart terms={goTerms} /> : <p className="text-zinc-600 text-xs text-center py-12">Run analysis to see GO terms</p>}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="pathway" className="mt-4">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="pt-6">
                    <ScrollArea className="h-[400px] pr-3">
                      {pathways.length > 0 ? <PathwayResults pathways={pathways} /> : <p className="text-zinc-600 text-xs text-center py-12">Run analysis to see pathways</p>}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="network" className="mt-4">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-0">
                    <div className="h-[500px]">
                      {network ? <ProteinNetworkGraph network={network} height={500} /> : <div className="h-full flex items-center justify-center text-zinc-600 text-xs">Run analysis to build network</div>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl text-zinc-700">
              <div className="text-center">
                <Network className="w-10 h-10 opacity-20 mx-auto mb-3" />
                <p className="text-xs font-mono uppercase">Configure gene set and click Analyze</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── Multi-Omics ───────────────────────────────────────────────── */}
        <TabsContent value="omics" className="mt-6 space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-mono flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                MULTI-OMICS PIPELINE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase mb-1">Omics Type</p>
                  <select value={omicsType} onChange={(e) => setOmicsType(e.target.value as any)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono text-zinc-300 outline-none">
                    <option value="transcriptomics">Transcriptomics</option>
                    <option value="proteomics">Proteomics</option>
                    <option value="metabolomics">Metabolomics</option>
                  </select>
                </div>
                <div>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase mb-1">Condition A</p>
                  <input value={condition1} onChange={(e) => setCondition1(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono text-zinc-300 outline-none" />
                </div>
                <div>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase mb-1">Condition B</p>
                  <input value={condition2} onChange={(e) => setCondition2(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono text-zinc-300 outline-none" />
                </div>
                <div>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase mb-1">Samples: {sampleCount}</p>
                  <input type="range" min={4} max={24} step={2} value={sampleCount} onChange={(e) => setSampleCount(+e.target.value)} className="w-full accent-purple-500 mt-2" />
                </div>
              </div>
              <Button onClick={handleOmicsAnalysis} disabled={isLoading} className="mt-4 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                RUN {omicsType.toUpperCase()} PIPELINE
              </Button>
            </CardContent>
          </Card>

          {omicsDataset ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <OmicsVisualization dataset={omicsDataset} />
              </CardContent>
            </Card>
          ) : (
            <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl text-zinc-700">
              <div className="text-center">
                <BarChart3 className="w-10 h-10 opacity-20 mx-auto mb-3" />
                <p className="text-xs font-mono uppercase">Configure pipeline and execute</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── Cross-Domain ──────────────────────────────────────────────── */}
        <TabsContent value="crossdomain" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-zinc-400">Cross-domain synergy scoring across <span className="text-cyan-400">{SCIENTIFIC_DOMAINS.length}</span> domains</p>
              <p className="text-[9px] text-zinc-600 mt-0.5">Computed via correlation coefficient + citation velocity + semantic overlap</p>
            </div>
            <Button onClick={handleCrossDomain} disabled={isLoading} className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-mono text-xs">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <GitMerge className="w-4 h-4 mr-2" />}
              {hasLoadedCrossDomain ? "RECOMPUTE" : "COMPUTE SYNERGIES"}
            </Button>
          </div>

          {crossDomainInsights.length > 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <CrossDomainSynergyMatrix insights={crossDomainInsights} domains={SCIENTIFIC_DOMAINS} />
              </CardContent>
            </Card>
          ) : (
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl text-zinc-700">
              <div className="text-center">
                <GitMerge className="w-12 h-12 opacity-20 mx-auto mb-3" />
                <p className="text-xs font-mono uppercase">Click Compute Synergies to begin analysis</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── Trends ────────────────────────────────────────────────────── */}
        <TabsContent value="trends" className="mt-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-mono flex items-center gap-2">
                  <Atom className="w-4 h-4 text-amber-400" />
                  SCIENTIFIC TREND INTELLIGENCE
                </CardTitle>
                <Button onClick={handleCrossDomain} disabled={isLoading} size="sm" className="bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs h-7">
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                  DETECT TRENDS
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {trends.length > 0 ? (
                <TrendIntelligencePanel trends={trends} />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-zinc-700">
                  <div className="text-center">
                    <Atom className="w-12 h-12 opacity-20 mx-auto mb-3" />
                    <p className="text-xs font-mono uppercase">Compute synergies to also detect trends</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Databases ─────────────────────────────────────────────────── */}
        <TabsContent value="databases" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-mono flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    DATABASE SEARCH (LIVE APIs)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DatabaseSearch />
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className="bg-zinc-900 border-zinc-800 h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-mono text-zinc-500 uppercase">Integrated Data Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { name: "NCBI PubMed", desc: "Biomedical literature", status: "live", color: "text-emerald-400" },
                      { name: "UniProt KB", desc: "Protein database", status: "live", color: "text-emerald-400" },
                      { name: "KEGG Pathways", desc: "Metabolic pathways", status: "simulated", color: "text-amber-400" },
                      { name: "Reactome", desc: "Pathway browser", status: "simulated", color: "text-amber-400" },
                      { name: "STRING DB", desc: "PPI networks", status: "simulated", color: "text-amber-400" },
                      { name: "PubChem", desc: "Chemical database", status: "live", color: "text-emerald-400" },
                      { name: "EBI Proteins", desc: "Protein features", status: "live", color: "text-emerald-400" },
                      { name: "GEO DataSets", desc: "Gene expression", status: "simulated", color: "text-amber-400" },
                    ].map((db) => (
                      <div key={db.name} className="flex items-center justify-between p-2 rounded bg-zinc-900/50 border border-zinc-800">
                        <div>
                          <p className="text-[10px] font-mono font-bold text-zinc-300">{db.name}</p>
                          <p className="text-[8px] text-zinc-600">{db.desc}</p>
                        </div>
                        <span className={`text-[8px] font-mono uppercase ${db.color}`}>{db.status}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
