import { GoogleGenAI, Type } from "@google/genai";
import { SurveyData, DecisionType, Citation } from "./types";

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
    Ensure the tone is professional yet personal.
    
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
  tags: DecisionType[],
  previousHistory: string[] = []
): Promise<SurveyData> {
  const model = "gemini-3-pro-preview";
  const isFollowUp = previousHistory.length > 0;
  
  const historyText = isFollowUp 
    ? `FOLLOW-UP CONTEXT: The user has seen a prior report. New follow-on query: "${previousHistory[previousHistory.length - 1]}". 
       Dig deeper into specific niche sub-segments or edge cases mentioned.` 
    : "";

  const prompt = `
    You are a world-class research agent specializing in population simulations and market sentiment analysis.
    
    DECISION TO RESEARCH: "${decision}"
    DOMAINS: ${tags.join(", ")}
    ${historyText}

    RESEARCH DIRECTIVE:
    1. Use Google Search to find real-world data from Reddit (community consensus), Google Scholar (peer-reviewed research), and industry market trends.
    2. ANALYSIS: Provide a high-fidelity 2-paragraph synthesis of current reality vs. common misconceptions.
    3. SIMULATION: Create ${isFollowUp ? "3-4 NEW" : "EXACTLY 6"} diverse poll questions representing different demographic slices (e.g., "Experienced Professionals", "Gen Z First-Time Homebuyers", "SaaS Founders").
    4. DATA INTEGRITY: Do not hallucinate statistics. Base percentages on real-world indicators found in your search.
    
    OUTPUT FORMAT (EXACT MARKDOWN):

    # ANALYSIS
    [Deep, data-driven synthesis paragraph 1]
    [Deep, data-driven synthesis paragraph 2]

    # POLLS
    QUESTION: [The simulation question]
    OPTIONS: [Label (Percentage%)] | [Label (Percentage%)] | [Label (Percentage%)]
    CONTEXT: [Why this distribution? Cite the logic based on Reddit sentiment or Scholar research]

    [Repeat for all polls]

    # CITATIONS
    - [Title](URL) - [Brief source description]
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  return parseSurveyData(text, decision, tags, groundingChunks);
}

function parseSurveyData(text: string, decision: string, tags: DecisionType[], chunks: any[]): SurveyData {
  const lines = text.split('\n');
  let currentSection = "";
  let analysis = "";
  let pollsRaw = "";
  let citationsRaw = "";

  lines.forEach(line => {
    if (line.startsWith('# ANALYSIS')) { currentSection = "ANALYSIS"; return; }
    if (line.startsWith('# POLLS')) { currentSection = "POLLS"; return; }
    if (line.startsWith('# CITATIONS')) { currentSection = "CITATIONS"; return; }

    if (currentSection === "ANALYSIS") analysis += line + "\n";
    if (currentSection === "POLLS") pollsRaw += line + "\n";
    if (currentSection === "CITATIONS") citationsRaw += line + "\n";
  });

  const polls: any[] = [];
  if (pollsRaw) {
    const blocks = pollsRaw.split(/QUESTION\s*:/i).filter(b => b.trim());
    blocks.forEach((block, idx) => {
      const optIdx = block.search(/OPTIONS\s*:/i);
      const ctxIdx = block.search(/CONTEXT\s*:/i);

      if (optIdx !== -1) {
        const question = block.substring(0, optIdx).trim();
        const optionsStr = ctxIdx !== -1 ? block.substring(optIdx + 8, ctxIdx) : block.substring(optIdx + 8);
        const context = ctxIdx !== -1 ? block.substring(ctxIdx + 8).trim() : "Logic derived from market sentiment.";

        const options = optionsStr.split('|').map(o => {
          const m = o.match(/(.*?)\(?(\d+)\s*%\)?/);
          return {
            label: m ? m[1].trim() : o.trim(),
            percentage: m ? parseInt(m[2], 10) : 33
          };
        }).filter(o => o.label.length > 0);

        if (options.length > 0) {
          const randomBg = BG_VARIANTS[Math.floor(Math.random() * BG_VARIANTS.length)];
          polls.push({
            id: `poll-${Date.now()}-${idx}-${Math.random().toString(36).substring(7)}`,
            question,
            options,
            context,
            bgColor: randomBg
          });
        }
      }
    });
  }

  const citations: Citation[] = [];
  chunks.forEach((chunk: any) => {
    if (chunk.web?.uri) {
      citations.push({
        title: chunk.web.title || "External Research",
        url: chunk.web.uri,
        source: "Google Search"
      });
    }
  });

  citationsRaw.split('\n').forEach(line => {
    const m = line.match(/\[(.*?)\]\((.*?)\)/);
    if (m && !citations.some(c => c.url === m[2])) {
      citations.push({ title: m[1], url: m[2], source: "Verified Data" });
    }
  });

  return { 
    id: `sim-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: Date.now(),
    decision, 
    tags, 
    analysis: analysis.trim() || "Analysis synthesis in progress...", 
    polls, 
    citations: citations.slice(0, 15) 
  };
}