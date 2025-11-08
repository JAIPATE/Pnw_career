
import React from 'react';
import { SearchHistoryItem } from '../types';

interface SearchHistoryProps {
  history: SearchHistoryItem[];
  onSelect: (item: SearchHistoryItem) => void;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({ history, onSelect }) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mt-8 animate-fade-in">
      <h2 className="text-xl font-bold text-amber-300 mb-4 text-center">Recent Searches</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item) => (
          <button
            key={item.timestamp}
            onClick={() => onSelect(item)}
            className="p-4 bg-gray-800 border border-gray-700 rounded-lg text-left hover:border-amber-400 transition-colors"
          >
            <p className="font-semibold text-gray-200 truncate">{item.query}</p>
            <p className="text-sm text-gray-400 mt-1">{item.matches.length} matches found</p>
            <p className="text-xs text-gray-500 mt-2">{new Date(item.timestamp).toLocaleString()}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchHistory;
