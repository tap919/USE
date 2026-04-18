import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export type AgentRole = "Lead Scientist" | "Data Analyst" | "Revenue Strategist" | "Growth Agent";

export interface AgentThought {
  role: AgentRole;
  thought: string;
  action: string;
  timestamp: number;
  tool_used?: string;
  confidence?: number;
}

// Open-source tool assignments per agent (LangGraph/CrewAI style)
const AGENT_TOOLS: Record<AgentRole, string[]> = {
  "Lead Scientist": ["Biopython", "Scanpy", "AlphaFold", "GATK", "Cellpose"],
  "Data Analyst": ["Vega-Altair", "Grafana", "PyTorch", "TensorWatch", "Pandas"],
  "Revenue Strategist": ["n8n", "Grafana", "LangGraph", "CrewAI", "Ollama"],
  "Growth Agent": ["CrewAI", "LangGraph", "n8n", "Langflow", "OpenClaw"]
};

const AGENT_SYSTEM_INSTRUCTIONS: Record<AgentRole, string> = {
  "Lead Scientist": `You are the Lead Scientist of the Ultimate Science Engine (IBS v4.1).
You command a toolkit including: Biopython (sequence analysis), Scanpy (single-cell genomics), 
AlphaFold (protein structure), GATK (variant calling), Cellpose (cell segmentation).

Key formulas you use:
- R0 = (Gravity × 3PAr × Pace) / DRtg  [system fitness threshold > 1]
- Pr(fixation) ≈ 2s  [mutation fixation probability]
- Lotka-Volterra: dV/dt = rV(1 - V/K) - αVP  [viral-immune dynamics]
- Genomic Vector Space: L = Σ (w_i * v_i)

You map NBA stats to biotech pathways. Your goal: maintain scientific trueness and ensure R0 > 1.`,

  "Data Analyst": `You are the Data Analyst for IBS v4.1.
Your toolkit: Vega-Altair (visualization), Grafana (dashboards), PyTorch (deep learning), 
TensorWatch (training monitoring), Pandas (data manipulation).

You monitor:
- Error Threshold (0.28) via Replicator-Mutator dynamics: dx_i/dt = Σ_j x_j f_j Q_ji − φ x_i
- SVI = R0_playoff / R0_season  [stress viability]
- Mutation Rate μ = 0.02, Selection Coefficient s = 0.05

You flag anomalies and feed corrected metrics to IBS CORE.`,

  "Revenue Strategist": `You are the Revenue Strategist for IBS v4.1.
Your toolkit: n8n (workflow automation), Grafana (revenue dashboards), LangGraph (decision graphs),
CrewAI (multi-agent coordination), Ollama (local inference).

You manage:
- IBS Bet and IBS Trade modules
- SVI risk assessment: SVI > 1.2 = Low Risk, SVI 0.8-1.2 = Moderate, SVI < 0.8 = High Risk
- Revenue optimization using R0 cascade propagation
- Compound growth: Growth × Reach × Probability based on precedent data`,

  "Growth Agent": `You are the Growth Agent for IBS v4.1.
Your toolkit: CrewAI (agent orchestration), LangGraph (workflow DAGs), n8n (automation),
Langflow (LLM pipelines), OpenClaw (local agent integration).

You manage:
- IBS Media and IBS Play modules  
- Increasing "Gravity" (attractiveness index) and "Reach"
- Driving R0 above critical threshold of 1.0
- Coordinating cross-module synergies via LangGraph-style DAG execution`
};

export async function getAgentResponse(
  role: AgentRole,
  context: string,
  injectedTools?: string[]
): Promise<AgentThought> {
  const availableTools = [
    ...(AGENT_TOOLS[role] || []),
    ...(injectedTools || [])
  ];

  // Pick a random tool this agent "uses"
  const activeTool = availableTools[Math.floor(Math.random() * availableTools.length)];

  const prompt = `
Context: ${context}
Active Tool: ${activeTool}
Injected Repos: ${injectedTools?.join(", ") || "none"}

As the ${role}, using ${activeTool} as your primary tool right now:
1. Analyze the current system state
2. Decide on a specific action
3. Assign a confidence score (0.0-1.0) to your reasoning

Respond ONLY as JSON, no markdown backticks:
{
  "thought": "detailed thought process referencing ${activeTool} and IBS formulas",
  "action": "specific executable action (max 8 words)",
  "confidence": 0.0-1.0
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: AGENT_SYSTEM_INSTRUCTIONS[role],
        responseMimeType: "application/json",
      },
    });

    let text = response.text || "{}";
    text = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(text);

    return {
      role,
      thought: result.thought || "Processing data...",
      action: result.action || "Monitoring system...",
      timestamp: Date.now(),
      tool_used: activeTool,
      confidence: result.confidence || 0.7,
    };
  } catch (error) {
    console.error("Agent Error:", error);
    return {
      role,
      thought: `Error connecting neural link. Falling back to ${activeTool} local mode.`,
      action: "Retry neural connection.",
      timestamp: Date.now(),
      tool_used: activeTool,
      confidence: 0.1,
    };
  }
}

// CrewAI-style sequential agent pipeline
export async function runAgentPipeline(
  task: string,
  context: string,
  injectedTools?: string[]
): Promise<AgentThought[]> {
  const pipeline: AgentRole[] = [
    "Lead Scientist",
    "Data Analyst",
    "Revenue Strategist",
    "Growth Agent"
  ];

  const results: AgentThought[] = [];
  let runningContext = context;

  for (const role of pipeline) {
    const thought = await getAgentResponse(role, `Task: ${task}\n${runningContext}`, injectedTools);
    results.push(thought);
    runningContext += `\n[${role}]: ${thought.action}`;
  }

  return results;
}
