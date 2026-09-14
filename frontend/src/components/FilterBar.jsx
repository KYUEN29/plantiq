import React from 'react';
import { Star, SlidersHorizontal } from 'lucide-react';

const filters = ['All Plants', 'Low Light', 'Air Purifying', 'Pet Friendly', 'Succulents'];

const FilterBar = ({ activeFilter, onFilterChange }) => {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Filter by Category</span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 hover:scale-[1.03] ${
              activeFilter === filter
                ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-50 dark:hover:border-gray-300'
            }`}
          >
            {filter}
          </button>
        ))}
        <button
          onClick={() => onFilterChange('AI Recommended')}
          className={`px-5 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 transition-all duration-200 active:scale-95 hover:scale-[1.03] ${
            activeFilter === 'AI Recommended'
              ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-700 border border-yellow-200 hover:shadow-sm hover:border-yellow-300 dark:bg-gray-800 dark:border-yellow-600/30 dark:text-yellow-400'
          }`}
        >
          <Star className="w-4 h-4 fill-current" />
          AI Recommended
        </button>
      </div>
    </div>
  );
};

export default FilterBar;