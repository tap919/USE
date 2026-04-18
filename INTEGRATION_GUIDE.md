# 🚀 Ultimate Science Engine — Open Source Enhancement

## What's Added

| Enhancement | Description | Key Tech |
|------------|-------------|----------|
| **GitHub Trending Feed** | Live GitHub API + Gemini AI scoring of repos for IBS compatibility | GitHub REST API, Gemini 2.0 Flash |
| **Agent Orchestration** | LangGraph/CrewAI-style D3 visual agent flow with animated message passing | D3.js, React |
| **Open Source Tool Stack** | 12 curated trending tools (CrewAI, Scanpy, AlphaFold, n8n, etc.) with IBS analogs | Static + GitHub links |
| **Fixed Agent Service** | Corrected model name (`gemini-2.0-flash`), added tool awareness per agent | Gemini API |
| **Repo Injection** | Inject any repo into the experiment pipeline as a data source | Cross-component state |

---

## File Structure

```
src/
├── components/
│   ├── GitHubTrendingFeed.tsx   ← NEW: Add this file
│   ├── AgentOrchestration.tsx   ← NEW: Add this file
│   └── UniversalManifold.tsx   (existing)
├── services/
│   └── agentService.ts          ← REPLACE with updated version
└── App.tsx                      ← Apply additions below
```

---

## Step 1: Copy New Component Files

Copy these to `src/components/`:
- `GitHubTrendingFeed.tsx`
- `AgentOrchestration.tsx`

Copy this to `src/services/`:
- `agentService.ts` (replaces existing)

---

## Step 2: Add to App.tsx

### A. New Imports (add near top with other component imports)

```tsx
import { GitHubTrendingFeed, InjectedRepo } from './components/GitHubTrendingFeed';
import { AgentOrchestration } from './components/AgentOrchestration';
import { runAgentPipeline } from './services/agentService';
import { Code } from 'lucide-react'; // already imported in lucide block
```

### B. New State (add inside App() after existing useState calls)

```tsx
const [injectedRepos, setInjectedRepos] = useState<InjectedRepo[]>([]);
const injectedIds = new Set(injectedRepos.map(r => r.id));

const handleInjectRepo = (repo: InjectedRepo) => {
  setInjectedRepos(prev => {
    if (prev.find(r => r.id === repo.id)) return prev;
    return [...prev, repo];
  });
};
```

### C. New Tab Triggers (add inside the existing TabsList, after the "network" trigger)

```tsx
<TabsTrigger value="github" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 text-xs font-mono">
  GITHUB FEED
</TabsTrigger>
<TabsTrigger value="orchestration" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-rose-400 text-xs font-mono">
  ORCHESTRATION
</TabsTrigger>
```

### D. New Tab Content (add after the closing `</TabsContent>` for the "network" tab)

#### GitHub Feed Tab

```tsx
<TabsContent value="github" className="mt-6 space-y-6">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-sm font-mono font-bold text-zinc-300 flex items-center gap-2">
        <Code className="w-4 h-4 text-emerald-500" />
        GITHUB OPEN SOURCE INTELLIGENCE
      </h3>
      <p className="text-[10px] text-zinc-600 uppercase mt-1">
        Trending repos • Gemini AI scored for IBS compatibility • Inject into experiment pipeline
      </p>
    </div>
    {injectedRepos.length > 0 && (
      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
        {injectedRepos.length} TOOLS INJECTED
      </Badge>
    )}
  </div>

  {injectedRepos.length > 0 && (
    <div className="p-4 rounded-xl bg-zinc-900 border border-emerald-500/20">
      <p className="text-[9px] font-mono text-emerald-400 uppercase mb-3">Active Pipeline Injections</p>
      <div className="flex flex-wrap gap-2">
        {injectedRepos.map(r => (
          <Badge
            key={r.id}
            variant="outline"
            className="border-emerald-500/30 text-emerald-300 text-[9px] font-mono gap-1 h-5"
          >
            <Zap className="w-2 h-2" />
            {r.name}
            <span className="text-zinc-600 ml-1">IBS:{r.analysis.ibs_score}</span>
          </Badge>
        ))}
      </div>
    </div>
  )}

  <GitHubTrendingFeed onInject={handleInjectRepo} injectedIds={injectedIds} />
</TabsContent>
```

#### Orchestration Tab

```tsx
<TabsContent value="orchestration" className="mt-6">
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <div className="lg:col-span-8">
      <Card className="bg-zinc-900 border-zinc-800 h-[700px] flex flex-col">
        <CardHeader className="border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Network className="w-4 h-4 text-rose-400" />
              AGENT ORCHESTRATION GRAPH
              <Badge variant="outline" className="text-[8px] border-zinc-800 text-zinc-500 ml-2">
                LangGraph-style DAG
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] font-mono h-7 border-zinc-800"
                onClick={() => runAgentCycle()}
                disabled={!engine.isRunning}
              >
                <Zap className="w-3 h-3 mr-1.5" />
                TRIGGER CYCLE
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] font-mono h-7 border-zinc-800 bg-rose-500/10 text-rose-400 border-rose-500/30"
                onClick={async () => {
                  const context = `Revenue: $${engine.revenue.toFixed(2)}, Reach: ${engine.reach}, R0: ${engine.r0.toFixed(2)}`;
                  const results = await runAgentPipeline(
                    "Optimize IBS engine for maximum R0 and revenue",
                    context,
                    injectedRepos.map(r => r.name)
                  );
                  setThoughts(prev => [...results, ...prev].slice(0, 15));
                  toast.success("Full CrewAI-style pipeline executed");
                }}
              >
                <Brain className="w-3 h-3 mr-1.5" />
                RUN CREW PIPELINE
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4">
          <AgentOrchestration thoughts={thoughts} isRunning={engine.isRunning} />
        </CardContent>
      </Card>
    </div>

    <div className="lg:col-span-4 space-y-4">
      {/* Pipeline Stats */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono text-zinc-500 uppercase">Pipeline Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Thoughts Generated", value: thoughts.length, color: "text-emerald-400" },
            { label: "Unique Roles Active", value: new Set(thoughts.map(t => t.role)).size, color: "text-cyan-400" },
            { label: "Avg Confidence", value: thoughts.length > 0 ? (thoughts.reduce((a, t) => a + (t.confidence || 0.7), 0) / thoughts.length * 100).toFixed(0) + "%" : "—", color: "text-amber-400" },
            { label: "Tools Used", value: new Set(thoughts.map(t => t.tool_used).filter(Boolean)).size, color: "text-pink-400" },
          ].map(s => (
            <div key={s.label} className="flex justify-between items-center py-1.5 border-b border-zinc-800/50">
              <span className="text-[10px] text-zinc-600 uppercase">{s.label}</span>
              <span className={`text-sm font-mono font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Active Tool Registry */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono text-zinc-500 uppercase">Active Tool Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[180px]">
            <div className="space-y-2">
              {Array.from(new Set(thoughts.map(t => t.tool_used).filter(Boolean))).map(tool => {
                const count = thoughts.filter(t => t.tool_used === tool).length;
                return (
                  <div key={tool} className="flex items-center gap-2 p-2 rounded bg-zinc-800/30 border border-zinc-800">
                    <Code className="w-3 h-3 text-zinc-500 shrink-0" />
                    <span className="text-[10px] font-mono text-zinc-300 flex-1">{tool}</span>
                    <Badge variant="outline" className="text-[8px] border-zinc-700 text-zinc-500 h-4">×{count}</Badge>
                  </div>
                );
              })}
              {thoughts.length === 0 && (
                <div className="text-center py-8 text-zinc-700">
                  <Brain className="w-6 h-6 mx-auto mb-2 opacity-20" />
                  <p className="text-[9px] font-mono uppercase">Ignite engine to activate tools</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Injected Repos */}
      {injectedRepos.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-zinc-500 uppercase">Injected OS Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {injectedRepos.map(r => (
                <div key={r.id} className="p-2.5 rounded bg-emerald-500/5 border border-emerald-500/20 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-mono text-emerald-400">{r.name}</p>
                    <p className="text-[9px] text-zinc-600">{r.analysis.domain_mapping}</p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[8px]">
                    {r.analysis.ibs_score}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  </div>
</TabsContent>
```

---

## Also Update: runAgentCycle() in App.tsx

Add `injectedRepos.map(r => r.name)` to the getAgentResponse call:

```tsx
// Change this line in runAgentCycle():
const newThought = await getAgentResponse(randomRole, context);

// To this:
const newThought = await getAgentResponse(randomRole, context, injectedRepos.map(r => r.name));
```

---

## What The Features Do

### 🌟 GitHub Feed (CURATED mode)
Shows 12 hand-picked trending open source tools (CrewAI, Scanpy, AlphaFold, n8n, Ollama, etc.)
- Each has a pre-computed IBS compatibility score
- NBA basketball analog + biotech formula mapping
- "INJECT INTO ENGINE" button adds the tool to your experiment pipeline

### 🔴 GitHub Feed (LIVE mode)
Fetches live from GitHub API by topic (Bioinformatics, Genomics, AI Agents, etc.)
- "AI ANALYZE" button sends each repo to Gemini for IBS scoring
- "ANALYZE ALL" batch-processes all repos
- "INJECT" button adds analyzed repos to experiment pipeline

### 🕸️ Orchestration Tab
LangGraph/CrewAI-style visual showing:
- D3 force-directed graph with 4 agent nodes + IBS CORE
- Animated signal pulses when agents are active
- Color-coded message bus log
- "RUN CREW PIPELINE" runs all 4 agents sequentially (CrewAI-style)
- Tool registry showing which open-source tools each agent used

### 🔧 Agent Tool Awareness
Each agent now knows its toolkit:
- Lead Scientist → Biopython, Scanpy, AlphaFold, GATK, Cellpose
- Data Analyst → Vega-Altair, Grafana, PyTorch, TensorWatch
- Revenue Strategist → n8n, Grafana, LangGraph, CrewAI, Ollama
- Growth Agent → CrewAI, LangGraph, n8n, Langflow, OpenClaw

---

## Trending Tools Referenced (All Real, All Open Source)

| Tool | Stars | Why It Matters to IBS |
|------|-------|----------------------|
| CrewAI | 22k+ | Multi-agent orchestration (like IBS agent roster) |
| LangGraph | 8k+ | Stateful agent DAG (models R0 cascade) |
| n8n | 56k+ | Workflow automation (IBS module bus) |
| Ollama | 128k+ | Local LLM inference (neural bench) |
| Scanpy | 2k+ | Single-cell RNA-seq (genomic vector space) |
| AlphaFold | 14k+ | Protein structure (Lotka-Volterra analog) |
| Biopython | 5k+ | DNA/protein tools (sequence replication) |
| GATK | 2k+ | Variant calling (mutation rate μ detection) |
| PyTorch | 88k+ | Deep learning (gradient = selection coefficient) |
| Grafana | 66k+ | Observability dashboards (IBS telemetry) |
| Cellpose | 1.8k+ | Cell segmentation (phase portrait boundaries) |
| Vega-Altair | 9.5k+ | Statistical visualization (vector projection) |
