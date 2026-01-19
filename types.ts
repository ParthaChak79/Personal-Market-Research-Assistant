
export type DecisionType = 'Personal' | 'Career' | 'Business' | 'Investment' | 'Lifestyle';

/**
 * Represents an individual choice within a simulated scenario.
 */
export interface PollOption {
  label: string;
  percentage: number;
  /** Recharts requirement: allow dynamic indexing */
  [key: string]: any;
}

/**
 * A simulated behavioral scenario derived from research data.
 */
export interface PollQuestion {
  id: string;
  question: string;
  options: PollOption[];
  context: string; 
  bgColor?: string;
}

/**
 * Credibility markers pointing to real-world data sources.
 */
export interface Citation {
  title: string;
  url: string;
  source: string;
}

/**
 * The core data model for a completed Research Report.
 */
export interface SurveyData {
  id: string;
  timestamp: number;
  decision: string;
  tags: DecisionType[];
  analysis: string;
  polls: PollQuestion[];
  mainSimulation: PollOption[];
  citations: Citation[];
}

export interface AppState {
  stage: 'setup' | 'researching' | 'results';
  surveyData: SurveyData | null;
  loading: boolean;
  archive: SurveyData[];
}
