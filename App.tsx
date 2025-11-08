
import React, { useState, useCallback, useEffect } from 'react';
import { AppStep, JobMatch, SearchHistoryItem } from './types';
import { extractSkillsFromResume, analyzeJobMatches } from './services/geminiService';
import ResumeInput from './components/ResumeInput';
import JobSearch from './components/JobSearch';
import ResultsDisplay from './components/ResultsDisplay';
import Loader from './components/Loader';
import SearchHistory from './components/SearchHistory';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.Resume);
  const [resumeText, setResumeText] = useState<string>('');
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [jobQuery, setJobQuery] = useState<string>('');
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('pnw-career-sync-history');
      if (storedHistory) {
        setSearchHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to parse search history:", e);
      setSearchHistory([]);
    }
  }, []);

  const handleResumeAnalysis = useCallback(async () => {
    if (!resumeText.trim()) {
      setError('Please paste your resume content.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const skills = await extractSkillsFromResume(resumeText);
      setExtractedSkills(skills);
      setStep(AppStep.Search);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to analyze resume. Please check the content and try again.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [resumeText]);

  const handleJobSearch = useCallback(async () => {
    if (!jobQuery.trim()) {
      setError('Please enter a job title or keyword.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const matches = await analyzeJobMatches(extractedSkills, jobQuery);
      setJobMatches(matches);
      setStep(AppStep.Results);

      // Persist search history
      setSearchHistory(prevHistory => {
        const newHistoryItem: SearchHistoryItem = {
          query: jobQuery,
          matches,
          timestamp: Date.now(),
        };
        const updatedHistory = [newHistoryItem, ...prevHistory.slice(0, 4)]; // Keep last 5 searches
        localStorage.setItem('pnw-career-sync-history', JSON.stringify(updatedHistory));
        return updatedHistory;
      });

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to find job matches. Please try a different search query.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [jobQuery, extractedSkills]);

  const handleStartOver = () => {
    setStep(AppStep.Resume);
    // Keep resume text to allow for new searches without re-pasting
    // setResumeText(''); 
    setExtractedSkills([]);
    setJobQuery('');
    setJobMatches([]);
    setError(null);
  };
  
  const handleHistorySelect = (item: SearchHistoryItem) => {
    setJobQuery(item.query);
    setJobMatches(item.matches);
    setStep(AppStep.Results);
  };

  const renderContent = () => {
    if (isLoading) {
      const message = step === AppStep.Resume ? 'Analyzing Resume...' : 'Searching for Jobs...';
      return <Loader message={message} />;
    }

    switch (step) {
      case AppStep.Resume:
        return (
          <ResumeInput
            resumeText={resumeText}
            setResumeText={setResumeText}
            onAnalyze={handleResumeAnalysis}
          />
        );
      case AppStep.Search:
        return (
          <JobSearch
            skills={extractedSkills}
            jobQuery={jobQuery}
            setJobQuery={setJobQuery}
            onSearch={handleJobSearch}
            onBack={() => setStep(AppStep.Resume)}
          />
        );
      case AppStep.Results:
        return (
          <ResultsDisplay
            matches={jobMatches}
            jobQuery={jobQuery}
            resumeText={resumeText}
            onStartOver={handleStartOver}
          />
        );
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