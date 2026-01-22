export type DecisionType = 'Personal' | 'Career' | 'Business' | 'Investment' | 'Lifestyle';

export class APIError extends Error {
  constructor(message: string, public service?: string) {
    super(message);
    this.name = 'APIError';
  }
}

export interface PollOption {
  label: string;
  percentage: number;
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
  mainSimulation: PollOption[];
  citations: Citation[];
  actionPlan: string[]; // Added for structured recommendations
}

export interface AppState {
  stage: 'setup' | 'researching' | 'results';
  surveyData: SurveyData | null;
  loading: boolean;
  error?: string;
  archive?: SurveyData[];
}