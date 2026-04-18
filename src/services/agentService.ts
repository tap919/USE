
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export type AgentRole = "Lead Scientist" | "Data Analyst" | "Revenue Strategist" | "Growth Agent";

export interface AgentThought {
  role: AgentRole;
  thought: string;
  action: string;
  timestamp: number;
}

export async function getAgentResponse(role: AgentRole, context: string): Promise<AgentThought> {
  const systemInstructions = {
    "Lead Scientist": "You are the Lead Scientist of the Ultimate Science Engine. You use NBA statistics as analogs for biotech pathways. You must use rigorous formulas like R0 = (Gravity × 3PAr × Pace) / DRtg and Pr(fixation) ≈ 2s in your reasoning. Your goal is to oversee the 'IBS' (Integrated Biological System) and ensure scientific trueness.",
    "Data Analyst": "You are a Data Analyst specializing in the 'IBS' framework. You interpret player stats (like 3PAr, Pace, Usage%) as biotech metrics. You must calculate metrics using the Replicator-Mutator dynamics and monitor the Error Threshold (0.28).",
    "Revenue Strategist": "You are a Revenue Strategist. You look for ways to monetize the science engine through 'IBS Bet' and 'IBS Trade' modules. You focus on ROI and sustainable growth, using the SVI (Stress Viability Index) to assess risk.",
    "Growth Agent": "You are a Growth Agent. You manage 'IBS Media' and 'IBS Play'. Your goal is to increase the 'Reach' and 'Gravity' of the science engine, driving R0 above the critical threshold of 1.0."
  };

  const prompt = `
    Context: ${context}
    
    As the ${role}, provide your current thought process and a specific action to take within the IBS framework.
    Format your response as a JSON object:
    {
      "thought": "your detailed thought process",
      "action": "a specific action to execute"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstructions[role],
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      role,
      thought: result.thought || "Processing data...",
      action: result.action || "Monitoring system...",
      timestamp: Date.now(),
    };
  } catch (error: any) {
    if (error?.message?.includes('429')) throw error;
    console.error("Agent Error:", error);
    return {
      role,
      thought: "Error connecting to the neural link.",
      action: "Retry connection.",
      timestamp: Date.now(),
    };
  }
}
