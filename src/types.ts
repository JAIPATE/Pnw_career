export enum AppStep {
  Resume = 'resume',
  Search = 'search',
  Results = 'results',
}

export interface JobMatch {
  jobTitle: string;
  company: string;
  description: string;
  jobUrl: string;
  sourceUrl?: string;
  matchPercentage: number;
  matchedSkills: string[];
  missingMandatorySkills: string[];
  missingPreferredSkills: string[];
}

export interface SearchHistoryItem {
  query: string;
  matches: JobMatch[];
  timestamp: number;
}

export interface ResumeFeedback {
  atsScore: number;
  feedback: string;
}

// For the detailed "Resume Report Card"
export interface ResumeReportCard {
  atsScore: number;
  overallSummary: string;
  keywordAnalysis: string; // Markdown list
  impactWording: string; // Markdown list
  formattingStructure: string; // Markdown list
}


// Types for the new state management context
export interface AppState {
  step: AppStep;
  resumeText: string;
  extractedSkills: string[];
  jobQuery: string;
  jobMatches: JobMatch[];
  searchHistory: SearchHistoryItem[];
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  datePostedFilter: string; // e.g., 'any', 'day', 'week'
  brokenLinks: Set<string>;
}

export type Action =
  | { type: 'START_RESUME_ANALYSIS' }
  | { type: 'RESUME_ANALYSIS_SUCCESS'; payload: { skills: string[] } }
  | { type: 'START_JOB_SEARCH' }
  | { type: 'JOB_SEARCH_SUCCESS'; payload: { matches: JobMatch[]; query: string } }
  | { type: 'API_FAILURE'; payload: { error: string } }
  | { type: 'SET_STEP'; payload: { step: AppStep } }
  | { type: 'SET_RESUME_TEXT'; payload: { text: string } }
  | { type: 'SET_JOB_QUERY'; payload: { query: string } }
  | { type: 'SET_DATE_POSTED_FILTER'; payload: { filter: string } }
  | { type: 'START_OVER' }
  | { type: 'LOAD_FROM_HISTORY'; payload: { item: SearchHistoryItem } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_HISTORY'; payload: { history: SearchHistoryItem[] } }
  | { type: 'SET_BROKEN_LINKS'; payload: { links: string[] } }
  | { type: 'REPORT_BROKEN_LINK'; payload: { url: string } };
