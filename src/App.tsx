
import React, { useCallback, useEffect, useRef } from 'react';
import { AppStep, SearchHistoryItem } from './types';
import { extractSkillsFromResume, analyzeJobMatches } from './services/geminiService';
import ResumeInput from './components/ResumeInput';
import JobSearch from './components/JobSearch';
import ResultsDisplay from './components/ResultsDisplay';
import Loader from './components/Loader';
import SearchHistory from './components/SearchHistory';
import { useAppContext } from './context/AppContext';

const App: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { step, resumeText, extractedSkills, jobQuery, isLoading, loadingMessage, error, searchHistory, brokenLinks, datePostedFilter } = state;
  const isInitialMount = useRef(true);

  const handleResumeAnalysis = useCallback(async () => {
    if (!resumeText.trim()) {
      dispatch({ type: 'API_FAILURE', payload: { error: 'Please paste your resume content.' } });
      return;
    }
    dispatch({ type: 'START_RESUME_ANALYSIS' });
    try {
      const skills = await extractSkillsFromResume(resumeText);
      dispatch({ type: 'RESUME_ANALYSIS_SUCCESS', payload: { skills } });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze resume. Please check the content and try again.';
      dispatch({ type: 'API_FAILURE', payload: { error: errorMessage } });
      console.error(err);
    }
  }, [resumeText, dispatch]);

  const handleJobSearch = useCallback(async () => {
    if (!jobQuery.trim()) {
      dispatch({ type: 'API_FAILURE', payload: { error: 'Please enter a job title or keyword.' } });
      return;
    }
    dispatch({ type: 'START_JOB_SEARCH' });
    try {
      const matches = await analyzeJobMatches(extractedSkills, jobQuery, datePostedFilter);
      const validMatches = matches.filter(match => !brokenLinks.has(match.jobUrl));

      dispatch({ type: 'JOB_SEARCH_SUCCESS', payload: { matches: validMatches, query: jobQuery } });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to find job matches. Please try a different search query.';
      dispatch({ type: 'API_FAILURE', payload: { error: errorMessage } });
      console.error(err);
    }
  }, [jobQuery, extractedSkills, dispatch, brokenLinks, datePostedFilter]);

  // Effect to re-trigger search when date filter changes on the results page
  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }
    if (step === AppStep.Results && jobQuery) {
        handleJobSearch();
    }
  }, [datePostedFilter]); // This will only run when datePostedFilter changes


  const handleStartOver = () => dispatch({ type: 'START_OVER' });
  const handleHistorySelect = (item: SearchHistoryItem) => dispatch({ type: 'LOAD_FROM_HISTORY', payload: { item } });
  const handleClearError = () => dispatch({ type: 'CLEAR_ERROR' });

  const renderContent = () => {
    if (isLoading) {
      return <Loader message={loadingMessage} />;
    }

    switch (step) {
      case AppStep.Resume:
        return <ResumeInput onAnalyze={handleResumeAnalysis} />;
      case AppStep.Search:
        return <JobSearch onSearch={handleJobSearch} />;
      case AppStep.Results:
        return <ResultsDisplay onStartOver={handleStartOver} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-5xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
          PNW CareerSync
        </h1>
        <p className="mt-2 text-lg text-gray-400">Your Personalized Career & Skill Matchmaker</p>
      </header>
      <main className="w-full max-w-5xl bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-500 min-h-[400px]">
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
             <button onClick={handleClearError} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close error message">&times;</button>
          </div>
        )}
        {renderContent()}
      </main>
       <SearchHistory history={searchHistory} onSelect={handleHistorySelect} />
       <footer className="w-full max-w-5xl text-center mt-8 text-gray-500 text-sm">
        <p>Built for Purdue Northwest students. All job data is illustrative.</p>
      </footer>
    </div>
  );
};

export default App;
