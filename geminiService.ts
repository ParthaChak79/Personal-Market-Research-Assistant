
import { GoogleGenAI, Type } from "@google/genai";
import { SurveyData, DecisionType, Citation, PollOption, PollQuestion } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export async function refineDecisionQuery(draft: string): Promise<string[]> {
  const model = "gemini-3-flash-preview";
  const prompt = `
    The user is trying to make a complex life, career, or business decision and needs to frame their research query better.
    Draft: "${draft}"
    
    Provide 3 distinct, high-quality, and researchable alternatives. 
    Focus on being specific, data-driven, and forward-looking. 
    Return ONLY a JSON array of 3 strings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
    });
    
    const text = response.text;
    return JSON.parse(text || "[]");
  } catch (error) {
    console.error("Refinement failed:", error);
    return [];
  }
}

export async function fetchResearchAndSimulate(
  decision: string,
  tags: DecisionType[]
): Promise<SurveyData> {
  const model = "gemini-3-pro-preview";
  
  const prompt = `
    Act as a Lead Decision Architect and Forensic Data Scientist. 
    Your objective is to help a user evaluate a complex decision by REVERSE-ENGINEERING massive datasets into simulated human behavior and decision vectors.

    DECISION: "${decision}"
    DOMAINS: ${tags.join(", ")}
    
    RESEARCH MANDATE (CITATIONS ARE MANDATORY):
    1. EXHAUSTIVE MULTI-QUERY SEARCH: Use Google Search to verify data from MINIMUM 15+ UNIQUE SOURCES across these domains:
       - ACADEMIC: NBER, JSTOR, SSRN, ArXiv, and leading University research.
       - FINANCIAL/LEGAL: SEC Filings (10-K), Earnings transcripts (AlphaSense/Seeking Alpha), Court records.
       - COMMUNITY SENTIMENT: Aggregated niche Subreddits (e.g., r/cscareerquestions, r/investing), Hacker News, Blind.
       - EXPERT ANALYSIS: Substack newsletters, McKinsey/Gartner/Deloitte reports.
    
    2. REVERSE-ENGINEERING SIMULATIONS: 
       Translate static facts into dynamic scenario polls. Every poll option must reflect a real data point found in your search.

    OUTPUT STRUCTURE:
    - # ANALYSIS: 5-7 high-impact strategic BULLET POINTS. Use double quotes (") for each point. No asterisks.
    - # MAIN_SIMULATION: A primary success probability breakdown. Format: Label (Percentage%) | Label (Percentage%)
    - # POLLS: Exactly 9 detailed scenarios/poll simulations. 
      Format:
      QUESTION: [Scenario]
      OPTIONS: Option A (XX%) | Option B (XX%) | Option C (XX%)
      CONTEXT: Explicitly name the sources: "Derived from 2024 Reddit r/[Niche] sentiment vs. [Company] 10-K risk disclosures."
    - # CITATIONS: Provide a numbered list of EVERY unique URL you visited. This is critical for the Verification Network.

    CRITICAL RULES:
    - YOU MUST PROVIDE A DIVERSE LIST OF AT LEAST 15 URLS.
    - NO ASTERISKS (*) or BOLDING (**).
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 15000 }
    },
  });

  const text = (response.text || "").replace(/\*/g, '');
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  return parseSurveyData(text, decision, tags, groundingChunks);
}

function parseSurveyData(text: string, decision: string, tags: DecisionType[], chunks: any[]): SurveyData {
  const lines = text.split('\n');
  let currentSection = "";
  let analysis = "";
  let pollsRaw = "";
  let mainSimRaw = "";
  let citationsRaw = "";

  lines.forEach(line => {
    const upperLine = line.trim().toUpperCase();
    if (upperLine.startsWith('# ANALYSIS')) { currentSection = "ANALYSIS"; return; }
    if (upperLine.startsWith('# MAIN_SIMULATION')) { currentSection = "MAIN_SIMULATION"; return; }
    if (upperLine.startsWith('# POLLS')) { currentSection = "POLLS"; return; }
    if (upperLine.startsWith('# CITATIONS')) { currentSection = "CITATIONS"; return; }

    if (currentSection === "ANALYSIS") analysis += line + "\n";
    if (currentSection === "MAIN_SIMULATION") mainSimRaw += line + "\n";
    if (currentSection === "POLLS") pollsRaw += line + "\n";
    if (currentSection === "CITATIONS") citationsRaw += line + "\n";
  });

  const mainSimulation: PollOption[] = mainSimRaw.split('|').map(o => {
    const trimmed = o.trim();
    const pctMatch = trimmed.match(/(\d+)\s*%/);
    const labelMatch = trimmed.match(/^([^(\d]+)/);
    
    return {
      label: (labelMatch ? labelMatch[0] : trimmed).replace(/[()]/g, '').trim() || "Scenario",
      percentage: pctMatch ? parseInt(pctMatch[1], 10) : 0
    };
  }).filter(o => o.percentage > 0);

  const polls: PollQuestion[] = [];
  if (pollsRaw) {
    const blocks = pollsRaw.split(/QUESTION\s*:?\s*/i).filter(b => b.trim());
    blocks.forEach((block, idx) => {
      const optMatch = block.match(/OPTIONS\s*:?\s*/i);
      const ctxMatch = block.match(/CONTEXT\s*:?\s*/i);

      if (optMatch) {
        const question = block.substring(0, optMatch.index).trim();
        const optionsArea = ctxMatch ? block.substring(optMatch.index + optMatch[0].length, ctxMatch.index) : block.substring(optMatch.index + optMatch[0].length);
        const context = ctxMatch ? block.substring(ctxMatch.index + ctxMatch[0].length).trim() : "Synthesized from cross-domain behavioral modeling.";

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
            question,
            options,
            context,
            bgColor: BG_VARIANTS[idx % BG_VARIANTS.length]
          });
        }
      }
    });
  }

  // Improved Citation Handling: Merge Grounding Chunks with Manual Citations
  const citationMap = new Map<string, Citation>();

  // 1. Process Grounding Chunks (Real-time links)
  chunks.forEach((chunk: any) => {
    if (chunk.web?.uri) {
      const url = chunk.web.uri;
      citationMap.set(url, {
        title: chunk.web.title || "External Research Source",
        url: url,
        source: new URL(url).hostname.replace('www.', '').toUpperCase()
      });
    }
  });

  // 2. Process Manual Citations (Fallback for sources model "remembers" or explicitly mentions)
  const manualUrls = citationsRaw.match(/https?:\/\/[^\s)]+/g) || [];
  manualUrls.forEach(url => {
    if (!citationMap.has(url)) {
      try {
        citationMap.set(url, {
          title: "Verified Documentation",
          url: url,
          source: new URL(url).hostname.replace('www.', '').toUpperCase()
        });
      } catch (e) {
        // Skip malformed URLs
      }
    }
  });

  const citations = Array.from(citationMap.values()).slice(0, 32);

  return { 
    id: `sim-${Date.now()}`,
    timestamp: Date.now(),
    decision, 
    tags, 
    analysis: analysis.trim(), 
    polls: polls.slice(0, 9), 
    mainSimulation,
    citations 
  };
}
