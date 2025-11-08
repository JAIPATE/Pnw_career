import React from 'react';

interface ATSScoreProps {
  score: number;
}

const ATSScore: React.FC<ATSScoreProps> = ({ score }) => {
  const percentage = Math.round(score);
  const circumference = 2 * Math.PI * 40; // r = 40
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage < 60) return 'text-red-500';
    if (percentage < 80) return 'text-yellow-400';
    return 'text-green-400';
  };
  
  const colorClass = getColor();

  return (
    <div className="flex flex-col items-center gap-4">
       <h3 className="text-xl font-bold text-amber-300 mb-2">ATS Score</h3>
      <div className="relative w-48 h-48">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            className="text-gray-700"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="40"
            cx="50"
            cy="50"
          />
          {/* Progress circle */}
          <circle
            className={colorClass}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="40"
            cx="50"
            cy="50"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center text-4xl font-extrabold ${colorClass}`}>
          {percentage}
          <span className="text-2xl font-bold text-gray-400">/100</span>
        </div>
      </div>
    </div>
  );
};

export default ATSScore;
