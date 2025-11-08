
import React, { useState, useMemo } from 'react';
import { JobMatch } from '../types';
import JobCard from './JobCard';
import { useAppContext } from '../context/AppContext';

interface ResultsDisplayProps {
  onStartOver: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ onStartOver }) => {
  const { state, dispatch } = useAppContext();
  const { jobMatches, jobQuery, resumeText, datePostedFilter } = state;
  
  const [minMatch, setMinMatch] = useState(70);
  const [companyFilter, setCompanyFilter] = useState('');
  
  const filteredMatches = useMemo(() => {
    return jobMatches
      .filter(match => match.matchPercentage >= minMatch)
      .filter(match => match.company.toLowerCase().includes(companyFilter.toLowerCase()));
  }, [jobMatches, minMatch, companyFilter]);

  return (
    <div className="w-full animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-amber-300 text-center sm:text-left">
          Top Job Matches for "{jobQuery}"
        </h2>
        <button
          onClick={onStartOver}
          className="px-6 py-2 border border-amber-500 text-amber-500 font-bold rounded-lg hover:bg-amber-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-amber-500 transition-all"
        >
          Start New Search
        </button>
      </div>

      {/* Filtering Controls */}
      <div className="mb-6 p-4 bg-gray-900/50 rounded-lg flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1 w-full md:w-auto">
          <label htmlFor="minMatch" className="block text-sm font-medium text-gray-400 mb-2">
            Minimum Match: <span className="font-bold text-amber-300">{minMatch}%</span>
          </label>
          <input
            id="minMatch"
            type="range"
            min="70"
            max="100"
            step="5"
            value={minMatch}
            onChange={(e) => setMinMatch(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
        <div className="flex-1 w-full md:w-auto">
           <label htmlFor="companyFilter" className="block text-sm font-medium text-gray-400 mb-2">
            Filter by Company
          </label>
          <input
            id="companyFilter"
            type="text"
            placeholder="e.g., Google"
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
         <div className="flex-1 w-full md:w-auto">
           <label htmlFor="datePostedFilter" className="block text-sm font-medium text-gray-400 mb-2">
            Date Posted
          </label>
          <select
            id="datePostedFilter"
            value={datePostedFilter}
            onChange={(e) => dispatch({ type: 'SET_DATE_POSTED_FILTER', payload: { filter: e.target.value }})}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-amber-500 focus:border-amber-500 appearance-none"
          >
            <option value="any">Any time</option>
            <option value="day">Past 24 hours</option>
            <option value="3days">Past 3 days</option>
            <option value="week">Past week</option>
            <option value="2weeks">Past 2 weeks</option>
          </select>
        </div>
      </div>
      
      {filteredMatches.length > 0 ? (
        <div className="space-y-6">
          {filteredMatches.map((match, index) => (
            <JobCard 
              key={`${match.jobUrl}-${index}`} 
              match={match} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-6 bg-gray-900 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-300">No Strong Matches Found</h3>
          <p className="text-gray-500 mt-2">
            Try adjusting your filters or starting a new search with a different query.
          </p>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
