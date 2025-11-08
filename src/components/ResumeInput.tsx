import React from 'react';
import { useAppContext } from '../context/AppContext';

interface ResumeInputProps {
  onAnalyze: () => void;
}

const ResumeInput: React.FC<ResumeInputProps> = ({ onAnalyze }) => {
  const { state, dispatch } = useAppContext();
  const { resumeText } = state;

  return (
    <div className="flex flex-col items-center animate-fade-in">
      <h2 className="text-2xl font-bold text-amber-300 mb-4 text-center">Step 1: Analyze Your Resume</h2>
      <p className="text-gray-400 mb-6 max-w-2xl text-center">
        Paste the full text of your resume below. Our AI will identify your key skills to match you with the perfect job opportunities.
      </p>
      <textarea
        className="w-full h-64 p-4 bg-gray-900 border-2 border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors duration-300 resize-none"
        placeholder="Paste your resume here..."
        value={resumeText}
        onChange={(e) => dispatch({ type: 'SET_RESUME_TEXT', payload: { text: e.target.value } })}
      />
      <button
        onClick={onAnalyze}
        className="mt-6 px-8 py-3 bg-amber-500 text-gray-900 font-bold rounded-lg hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-amber-500 transition-transform transform hover:scale-105"
      >
        Analyze Skills
      </button>
    </div>
  );
};

export default ResumeInput;
