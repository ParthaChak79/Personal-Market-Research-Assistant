
import { GoogleGenAI, Type } from "@google/genai";
import { SurveyData, DecisionType, Citation, PollOption, PollQuestion } from "./types";

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
 * Strips all structural artifacts including markdown, brackets, and leading/trailing noise.
 */
function stripArtifacts(text: string): string {
  if (!text) return "";
  return text
    .replace(/[*#_~]/g, '') // Remove markdown markers
    .replace(/[\[\]]/g, '') // Remove brackets
    .replace(/Signal Vector \d+/gi, '') // Remove "Signal Vector X" prefixes
    .replace(/Vector \d+/gi, '') // Remove "Vector X" prefixes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Extracts poll options with natural language labels.
 */
function extractOptionsGreedily(text: string): PollOption[] {
  const options: PollOption[] = [];
  // Standardize delimiters for extraction
  const cleanedText = text.replace(/\n/g, ' | ');
  const parts = cleanedText.split(/[,;|]|(?=\d+\s*%)/).filter(p => p.trim().length > 0);
  const seenLabels = new Set();

  for (let part of parts) {
    const pctMatch = part.match(/(\d+)\s*%/);
    if (pctMatch) {
      const pct = parseInt(pctMatch[1], 10);
      let label = part.split(pctMatch[0])[0];
      
      // Clean up label: remove brackets, markdown, and "Option X" prefixes
      label = stripArtifacts(label)
        .replace(/^[:\s-|,]+|[:\s-|,]+$/g, '')
        .replace(/^(Option|Choice|Scenario|Label)\s+[A-Z\d][:\s-]*/i, '')
        .trim();

      if (label && label.length > 0 && !isNaN(pct) && !seenLabels.has(label.toLowerCase())) {
        options.push({ label, percentage: pct });
        seenLabels.add(label.toLowerCase());
      }
    }
    if (options.length >= 6) break;
  }

  // Fallback pattern match if split-based failed
  if (options.length === 0) {
    const pattern = /([^:|%]+?)[:\s-]*(\d+)\s*%/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      let label = stripArtifacts(match[1]).replace(/^[:\s-|,]+|[:\s-|,]+$/g, '').trim();
      const pct = parseInt(match[2], 10);
      if (label && !seenLabels.has(label.toLowerCase())) {
        options.push({ label, percentage: pct });
        seenLabels.add(label.toLowerCase());
      }
    }
  }

  return options;
}

function normalizePercentages(options: PollOption[]): PollOption[] {
  if (options.length === 0) return options;
  const sum = options.reduce((acc, opt) => acc + opt.percentage, 0);
  if (sum === 0) return options;

  const normalized = options.map(opt => ({
    ...opt,
    percentage: Math.max(1, Math.round((opt.percentage / sum) * 100))
  }));

  const newSum = normalized.reduce((acc, opt) => acc + opt.percentage, 0);
  const diff = 100 - newSum;
  
  if (diff !== 0 && normalized.length > 0) {
    let maxIdx = 0;
    for (let i = 1; i < normalized.length; i++) {
      if (normalized[i].percentage > normalized[maxIdx].percentage) maxIdx = i;
    }
    normalized[maxIdx].percentage = Math.max(0, normalized[maxIdx].percentage + diff);
  }
  
  return normalized;
}

export async function refineDecisionQuery(draft: string): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  const prompt = `Rewrite this decision to be clearer and simpler: "${draft}". Provide 3 distinct simple alternatives. Use plain English. No brackets, no markdown. Return ONLY a JSON array of strings.`;
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
}

export async function fetchResearchAndSimulate(
  decision: string,
  tags: DecisionType[]
): Promise<SurveyData> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-pro-preview";
  const prompt = `
    Act as a Lead Decision Architect.
    DECISION: "${decision}"
    DOMAINS: ${tags.join(", ")}
    
    GOAL: Generate a research report with 9 poll simulations using simple English.

    STRICT RULES:
    1. SIMPLE ENGLISH: Use plain, easy-to-understand language. No jargon.
    2. NO ARTIFACTS: NEVER use asterisks (*), hashes (#), or brackets ([]).
    3. NO LABELS: NEVER use "Label A", "Label B", "Option 1", etc. Use natural names like "Buy Now" or "Wait for Surges".
    4. STRUCTURE: Follow the section headers exactly.

    OUTPUT STRUCTURE (STRICT):
    ---DATA_SYNTHESIS---
    [Topic 1]: [Brief Description]
    [Topic 2]: [Brief Description]
    [Topic 3]: [Brief Description]
    [Topic 4]: [Brief Description]
    (Provide exactly 4 distinct signal blocks)

    ---MAIN_SIMULATION---
    Success Probability: 70%, Failure Risk: 30%

    ---EMPIRICAL_POLLS---
    Provide exactly 9 polls. Use this format:
    POLL_START
    QUESTION: Simple Scenario Question
    OPTIONS: Natural Choice 1: 60%, Natural Choice 2: 40%
    CONTEXT: Grounding evidence in simple terms.
    POLL_END

    ---ACTION_PLAN---
    1. Clear Action 1
    2. Clear Action 2
    (4-5 clear steps)

    ---CITATIONS---
    List scoured URLs.
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 15000 }
    },
  });

  const text = response.text || "";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return parseSurveyData(text, decision, tags, groundingChunks);
}

function parseSurveyData(text: string, decision: string, tags: DecisionType[], chunks: any[]): SurveyData {
  const getSection = (name: string) => {
    const regex = new RegExp(`---${name}---([\\s\\S]*?)(?=---|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  };

  const analysisRaw = getSection("DATA_SYNTHESIS");
  const mainSimRaw = getSection("MAIN_SIMULATION");
  const pollsSection = getSection("EMPIRICAL_POLLS");
  const actionPlanRaw = getSection("ACTION_PLAN");

  // Filter and clean synthesis signals
  const analysis = analysisRaw.split('\n')
    .filter(l => l.trim().length > 5)
    .map(l => stripArtifacts(l))
    .join('\n');

  const mainSimulation = normalizePercentages(extractOptionsGreedily(mainSimRaw));
  const actionPlan = actionPlanRaw.split('\n')
    .filter(l => l.trim().length > 5)
    .map(l => stripArtifacts(l).replace(/^\d+\.\s*/, '').trim());

  const polls: PollQuestion[] = [];
  const pollBlocks = pollsSection.split(/POLL_START/i).filter(b => b.trim().length > 10);
  
  pollBlocks.forEach((block, idx) => {
    const cleanBlock = block.split(/POLL_END/i)[0].trim();
    const qMatch = cleanBlock.match(/QUESTION:([\s\S]*?)(?=OPTIONS:|$)/i);
    const oMatch = cleanBlock.match(/OPTIONS:([\s\S]*?)(?=CONTEXT:|$)/i);
    const cMatch = cleanBlock.match(/CONTEXT:([\s\S]*?)$/i);

    if (qMatch && oMatch) {
      const opts = extractOptionsGreedily(oMatch[1]);
      if (opts.length >= 1) {
        polls.push({
          id: `poll-${idx}-${Date.now()}`,
          question: stripArtifacts(qMatch[1]),
          options: normalizePercentages(opts),
          context: stripArtifacts(cMatch ? cMatch[1] : "Based on synthesized market sentiment."),
          bgColor: BG_VARIANTS[idx % BG_VARIANTS.length]
        });
      }
    }
  });

  const citationMap = new Map<string, Citation>();
  chunks.forEach((chunk: any) => {
    if (chunk.web?.uri) {
      const url = chunk.web.uri;
      const title = stripArtifacts(chunk.web.title || "");
      let cleanTitle = title.replace(/ - Google Search| - Vertex AI| - VertexAI/gi, '').trim();
      try {
        const urlObj = new URL(url);
        let domain = urlObj.hostname.replace('www.', '').toUpperCase();
        citationMap.set(url, {
          title: cleanTitle || "Research Source",
          url: url,
          source: domain
        });
      } catch (e) {
        citationMap.set(url, { title: cleanTitle || "Source Data", url, source: "EXTERNAL RESEARCH" });
      }
    }
  });

  return { 
    id: `sim-${Date.now()}`,
    timestamp: Date.now(),
    decision: stripArtifacts(decision), 
    tags, 
    analysis, 
    polls: polls.slice(0, 9), 
    mainSimulation,
    citations: Array.from(citationMap.values()).slice(0, 32),
    actionPlan
  };
}
