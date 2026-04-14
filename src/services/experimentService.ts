import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export type ExperimentType = 
  | "Experiment" 
  | "Surgery" 
  | "Assay" 
  | "Simulation" 
  | "Medicine Creation" 
  | "Science Paper Study" 
  | "Combination";

export interface ExperimentResult {
  type: ExperimentType;
  hypothesis: string;
  scientificPaper: string;
  bbtechTranslation: string;
  discoverySummary: string;
  timestamp: string;
  sources: string[];
  metrics: {
    confidence: number;
    rigor: number;
    novelty: number;
  };
}

export async function runBiotechExperiment(
  hypothesis: string, 
  type: ExperimentType,
  domain: string,
  sources: string[],
  systemContext: any,
  sampleSize: number,
  caseStudy: string
): Promise<ExperimentResult> {
  const prompt = `
    You are the IBS Ultimate Science Engine's Scientific MPC (Music Production Center) Console.
    You are the "MIDI Center" of multi-disciplinary scientific research, orchestrating multiple tools and data streams.
    
    Scientific Domain: ${domain}
    Experiment Type: ${type}
    Hypothesis: ${hypothesis}
    Sample Size: ${sampleSize}
    Case Study: ${caseStudy}
    Data Sources: ${sources.join(", ")}

    SYSTEM CONTEXT (LOWER DECK TELEMETRY):
    ${JSON.stringify(systemContext, null, 2)}

    TASK:
    1. Conduct a simulated high-rigor analysis using the Integrated Biological System (IBS) framework, expanded to the ${domain} domain.
    2. MANDATORY: Incorporate the SYSTEM CONTEXT into the analysis.
    3. MANDATORY: Account for the Sample Size (${sampleSize}) and Case Study focus (${caseStudy}).
    4. NOVEL TREND DERIVATION: Look for non-obvious, cross-disciplinary correlations. For example, how does ${domain} interact with the environmental variables in the System Context? Does a specific celestial cycle correlate with genomic stability? Does barometric pressure affect reaction kinetics?
    5. DERIVE A BREAKTHROUGH: Identify one "Discovery" or "Trend" that has not been previously documented in standard literature, based on the synthesis of these multi-domain signals.
    6. Apply specialized methodology for the selected type: ${type} within the context of ${domain}.
    7. Use advanced mathematics appropriate for ${domain}.
    8. Synthesize findings into three distinct formats:
       a) A detailed Scientific Paper Analysis.
       b) A "BBTech" Basketball Translation.
       c) A "Discovery Summary" (A 1-2 sentence high-impact breakthrough statement).

    METAPHOR:
    Treat the research like music production. You are "sampling" open-source data, "sequencing" pathways, and "mixing" variables to find hidden trends.

    FORMAT:
    Return a JSON object with:
    {
      "scientificPaper": "markdown string",
      "bbtechTranslation": "markdown string",
      "discoverySummary": "string",
      "sources": ["list of simulated/real sources used"],
      "metrics": {
        "confidence": 0.0-1.0,
        "rigor": 0.0-1.0,
        "novelty": 0.0-1.0
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text || "{}");

    return {
      type,
      hypothesis,
      scientificPaper: data.scientificPaper || "Analysis failed.",
      bbtechTranslation: data.bbtechTranslation || "Translation failed.",
      discoverySummary: data.discoverySummary || "No breakthrough derived.",
      timestamp: new Date().toISOString(),
      sources: data.sources || [],
      metrics: data.metrics || { confidence: 0.5, rigor: 0.5, novelty: 0.5 }
    };
  } catch (error) {
    console.error("Experiment failed:", error);
    throw error;
  }
}
