
export type DecisionType = 'Personal' | 'Career' | 'Business' | 'Investment' | 'Lifestyle';

export interface PollOption {
  label: string;
  percentage: number;
  // Added index signature to satisfy Recharts requirements where data objects must be indexable by string
  [key: string]: any;
}

export interface PollQuestion {
  id: string;
  question: string;
  options: PollOption[];
  context: string; 
  bgColor?: string;
}

export interface Citation {
  title: string;
  url: string;
  source: string;
}

export interface SurveyData {
  id: string;
  timestamp: number;
  decision: string;
  tags: DecisionType[];
  analysis: string;
  polls: PollQuestion[];
  mainSimulation: PollOption[]; // Main decision pie chart data
  citations: Citation[];
}

export interface AppState {
  stage: 'setup' | 'researching' | 'results';
  surveyData: SurveyData | null;
  loading: boolean;
  archive: SurveyData[];
}
