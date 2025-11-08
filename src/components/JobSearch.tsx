import React from 'react';
import { useAppContext } from '../context/AppContext';
import { AppStep } from '../types';

interface JobSearchProps {
  onSearch: () => void;
}

const JobSearch: React.FC<JobSearchProps> = ({ onSearch }) => {
  const { state, dispatch } = useAppContext();
  const { extractedSkills, jobQuery } = state;

  return (
    <div className="flex flex-col items-center animate-fade-in">
      <h2 className="text-2xl font-bold text-amber-300 mb-4 text-center">Step 2: Find Your Match</h2>
      <p className="text-gray-400 mb-6 max-w-2xl text-center">
        We've identified your skills. Now, tell us what kind of job you're looking for.
      </p>
      
      <div className="w-full max-w-lg mb-6 p-4 bg-gray-900 border border-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold text-amber-400 mb-3">Your Extracted Skills:</h3>
        <div className="flex flex-wrap gap-2">
          {extractedSkills.map((skill, index) => (
            <span key={index} className="px-3 py-1 bg-gray-700 text-gray-200 text-sm rounded-full">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full max-w-lg flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          className="flex-grow p-3 bg-gray-900 border-2 border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors duration-300"
          placeholder="e.g., Software Engineer Intern"
          value={jobQuery}
          onChange={(e) => dispatch({ type: 'SET_JOB_QUERY', payload: { query: e.target.value } })}
          onKeyPress={(e) => e.key === 'Enter' && onSearch()}
        />
        <button
          onClick={onSearch}
          disabled={!jobQuery.trim()}
          className="px-8 py-3 bg-amber-500 text-gray-900 font-bold rounded-lg hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-amber-500 transition-transform transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
        >
          Find Jobs
        </button>
      </div>

       <div className="w-full max-w-lg mt-4 flex justify-between items-center">
         <button onClick={() => dispatch({ type: 'SET_STEP', payload: { step: AppStep.Resume }})} className="text-amber-400 hover:text-amber-300 text-sm">
          &larr; Back to Resume
        </button>
      </div>
    </div>
  );
};

export default JobSearch;
