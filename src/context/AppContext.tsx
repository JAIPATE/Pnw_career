
import React, { createContext, useReducer, useContext, Dispatch, useEffect } from 'react';
import { AppState, Action, AppStep, SearchHistoryItem } from '../types';

const initialState: AppState = {
  step: AppStep.Resume,
  resumeText: '',
  extractedSkills: [],
  jobQuery: '',
  jobMatches: [],
  searchHistory: [],
  isLoading: false,
  loadingMessage: '',
  error: null,
  datePostedFilter: 'any',
  brokenLinks: new Set(),
};

const AppContext = createContext<{
  state: AppState;
  dispatch: Dispatch<Action>;
} | undefined>(undefined);

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_RESUME_TEXT':
      return { ...state, resumeText: action.payload.text };
    case 'SET_JOB_QUERY':
      return { ...state, jobQuery: action.payload.query };
    case 'START_RESUME_ANALYSIS':
      return { ...state, isLoading: true, error: null, loadingMessage: 'Analyzing Resume...' };
    case 'RESUME_ANALYSIS_SUCCESS':
      return {
        ...state,
        isLoading: false,
        extractedSkills: action.payload.skills,
        step: AppStep.Search,
      };
    case 'START_JOB_SEARCH':
      return { ...state, isLoading: true, error: null, loadingMessage: 'Searching for Jobs...' };
    case 'JOB_SEARCH_SUCCESS': {
      const newHistoryItem: SearchHistoryItem = {
        query: action.payload.query,
        matches: action.payload.matches,
        timestamp: Date.now(),
      };
      const updatedHistory = [newHistoryItem, ...state.searchHistory.filter(item => item.query !== action.payload.query).slice(0, 4)];
      localStorage.setItem('pnw-career-sync-history', JSON.stringify(updatedHistory));
      
      return {
        ...state,
        isLoading: false,
        jobMatches: action.payload.matches,
        step: AppStep.Results,
        searchHistory: updatedHistory
      };
    }
    case 'API_FAILURE':
      return { ...state, isLoading: false, error: action.payload.error };
    case 'SET_STEP':
      return { ...state, step: action.payload.step };
    case 'SET_DATE_POSTED_FILTER':
        return { ...state, datePostedFilter: action.payload.filter };
    case 'START_OVER':
      return {
        ...state,
        step: AppStep.Resume,
        extractedSkills: [],
        jobQuery: '',
        jobMatches: [],
        error: null,
      };
    case 'LOAD_FROM_HISTORY':
        return {
            ...state,
            jobQuery: action.payload.item.query,
            jobMatches: action.payload.item.matches,
            step: AppStep.Results,
            error: null,
        }
    case 'CLEAR_ERROR':
        return { ...state, error: null };
    case 'SET_HISTORY':
        return { ...state, searchHistory: action.payload.history };
    case 'SET_BROKEN_LINKS':
        return { ...state, brokenLinks: new Set(action.payload.links) };
    case 'REPORT_BROKEN_LINK': {
        const newBrokenLinks = new Set(state.brokenLinks);
        newBrokenLinks.add(action.payload.url);
        localStorage.setItem('pnw-career-sync-broken-links', JSON.stringify(Array.from(newBrokenLinks)));
        return { ...state, brokenLinks: newBrokenLinks };
    }
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('pnw-career-sync-history');
      if (storedHistory) {
        dispatch({ type: 'SET_HISTORY', payload: { history: JSON.parse(storedHistory) } });
      }
    } catch (e) {
      console.error("Failed to parse search history:", e);
    }

    try {
      const storedBrokenLinks = localStorage.getItem('pnw-career-sync-broken-links');
      if (storedBrokenLinks) {
        dispatch({ type: 'SET_BROKEN_LINKS', payload: { links: JSON.parse(storedBrokenLinks) } });
      }
    } catch (e) {
      console.error("Failed to parse broken links:", e);
    }
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
