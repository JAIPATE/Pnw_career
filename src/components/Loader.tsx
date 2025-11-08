import React from 'react';

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message = 'Analyzing...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20" role="status" aria-live="polite">
      <div className="w-16 h-16 border-4 border-t-amber-400 border-r-amber-400 border-b-amber-400 border-l-gray-700 rounded-full animate-spin"></div>
      <p className="mt-4 text-amber-300 text-lg font-semibold">{message}</p>
    </div>
  );
};

export default Loader;
