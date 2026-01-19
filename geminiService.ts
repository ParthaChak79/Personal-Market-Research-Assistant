
import { GoogleGenAI, Type } from "@google/genai";
import { SurveyData, DecisionType, Citation, PollOption, PollQuestion } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/** Colors used for simulation scenario cards */
const BG_VARIANTS = [
  'bg-slate-50 border-slate-200',
  'bg-blue-50/50 border-blue-100',
  'bg-indigo-50/50 border-indigo-100',
  'bg-purple-50/50 border-purple-100',
  'bg-emerald-50/50 border-emerald-100',
  'bg-rose-50/50 border-rose-100',
  'bg-amber-50/50 border-amber-100',
  'bg-cyan-50/50 border-cyan-100'
];

/**
 * Refines a rough user query into 3 specific, researchable alternatives.
 */
export async function refineDecisionQuery(draft: string): Promise<string[]> {
  const prompt = `
    Analyze this decision draft: "${draft}"
    Provide 3 high-quality, data-driven alternative framings.
    Return ONLY a JSON array of 3 strings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Query refinement failed:", error);
    return [];
  }
}

/**
 * Main orchestration function for research synthesis and behavioral simulation.
 */
export async function fetchResearchAndSimulate(
  decision: string,
  tags: DecisionType[]
): Promise<SurveyData> {
  const model = "gemini-3-pro-preview";
  
  const prompt = `
    Objective: Help a user evaluate a decision by reverse-engineering data into simulations.
    Decision: "${decision}"
    Domains: ${tags.join(", ")}
    
    1. SEARCH: Verify via Google Search across academic, financial, and community (Reddit/X) sources.
    2. SIMULATE: Translate static facts into 9 "Decision Vector" polls.
    
    Output Markers:
    # ANALYSIS: Strategic bullet points.
    # MAIN_SIMULATION: High-level probability (Label (X%) | Label (Y%))
    # POLLS: 9 Scenarios (QUESTION:, OPTIONS:, CONTEXT:)
    # CITATIONS: List of URLs.
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 15000 }
    },
  });

  const rawText = (response.text || "").replace(/\*/g, '');
  const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  return parseSimulationResponse(rawText, decision, tags, searchChunks);
}

/**
 * Splits raw text into logical report sections for parsing.
 */
function parseSimulationResponse(text: string, decision: string, tags: DecisionType[], chunks: any[]): SurveyData {
  const sections = splitIntoSections(text);
  
  return { 
    id: `sim-${Date.now()}`,
    timestamp: Date.now(),
    decision, 
    tags, 
    analysis: sections.analysis.trim(), 
    polls: parsePolls(sections.polls).slice(0, 9), 
    mainSimulation: parseMainSim(sections.mainSim),
    citations: mergeCitations(sections.citations, chunks)
  };
}

/** Internal helper for section identification */
function splitIntoSections(text: string) {
  const lines = text.split('\n');
  let current = "";
  const result = { analysis: "", mainSim: "", polls: "", citations: "" };

  lines.forEach(line => {
    const upper = line.trim().toUpperCase();
    if (upper.startsWith('# ANALYSIS')) { current = "analysis"; return; }
    if (upper.startsWith('# MAIN_SIMULATION')) { current = "mainSim"; return; }
    if (upper.startsWith('# POLLS')) { current = "polls"; return; }
    if (upper.startsWith('# CITATIONS')) { current = "citations"; return; }
    if (current) (result as any)[current] += line + "\n";
  });
  return result;
}

/** Helper: Extracts probability data for the main overview chart */
function parseMainSim(raw: string): PollOption[] {
  return raw.split('|').map(o => {
    const trimmed = o.trim();
    const pctMatch = trimmed.match(/(\d+)\s*%/);
    const labelMatch = trimmed.match(/^([^(\d]+)/);
    return {
      label: (labelMatch ? labelMatch[0] : trimmed).replace(/[()]/g, '').trim() || "Scenario",
      percentage: pctMatch ? parseInt(pctMatch[1], 10) : 0
    };
  }).filter(o => o.percentage > 0);
}

/** Helper: Transforms flat text into structured scenario objects */
function parsePolls(raw: string): PollQuestion[] {
  const polls: PollQuestion[] = [];
  const blocks = raw.split(/QUESTION\s*:?\s*/i).filter(b => b.trim());
  
  blocks.forEach((block, idx) => {
    const optMatch = block.match(/OPTIONS\s*:?\s*/i);
    const ctxMatch = block.match(/CONTEXT\s*:?\s*/i);

    if (optMatch) {
      const question = block.substring(0, optMatch.index).trim();
      const optionsArea = ctxMatch ? block.substring(optMatch.index + optMatch[0].length, ctxMatch.index) : block.substring(optMatch.index + optMatch[0].length);
      const context = ctxMatch ? block.substring(ctxMatch.index + ctxMatch[0].length).trim() : "Cross-domain synthesis.";

      const options = optionsArea.split(/[|\n]/).map(o => {
        const m = o.match(/(.*?)\(?(\d+)\s*%\)?/);
        return {
          label: m ? m[1].trim() : o.trim().replace(/\(\d+%\)/, ''),
          percentage: m ? parseInt(m[2], 10) : 0
        };
      }).filter(o => o.label && o.percentage > 0);

      if (options.length > 0) {
        polls.push({
          id: `poll-${idx}-${Date.now()}`,
          question, options, context,
          bgColor: BG_VARIANTS[idx % BG_VARIANTS.length]
        });
      }
    }
  });
  return polls;
}

/** Helper: Consolidates search grounding links with manual citations */
function mergeCitations(rawCites: string, chunks: any[]): Citation[] {
  const map = new Map<string, Citation>();

  chunks.forEach((c: any) => {
    if (c.web?.uri) {
      map.set(c.web.uri, {
        title: c.web.title || "External Source",
        url: c.web.uri,
        source: new URL(c.web.uri).hostname.replace('www.', '').toUpperCase()
      });
    }
  });

  const manualUrls = rawCites.match(/https?:\/\/[^\s)]+/g) || [];
  manualUrls.forEach(url => {
    if (!map.has(url)) {
      try {
        map.set(url, {
          title: "Research Documentation",
          url,
          source: new URL(url).hostname.replace('www.', '').toUpperCase()
        });
      } catch {}
    }
  });

  return Array.from(map.values()).slice(0, 32);
}
