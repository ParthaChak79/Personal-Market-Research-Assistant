
export type DecisionType = 'Personal' | 'Career' | 'Business' | 'Investment' | 'Lifestyle';

export interface PollOption {
  label: string;
  percentage: number;
}

export interface PollQuestion {
  id: string;
  question: string;
  options: PollOption[];
  context: string; 
  bgColor?: string; // Optional random bg color
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
  citations: Citation[];
}

export interface AppState {
  stage: 'setup' | 'researching' | 'results';
  surveyData: SurveyData | null;
  loading: boolean;
  history: string[];
  archive: SurveyData[];
}
