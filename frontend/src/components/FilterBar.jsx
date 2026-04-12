import React from 'react';
import { Star, SlidersHorizontal } from 'lucide-react';
import { DUMMY_PLANTS } from './PlantGrid';

const AI_RECOMMENDED_IDS = [2, 4, 5, 7];

const FilterBar = ({ activeFilter, onFilterChange }) => {
  const filters = [
    'All Plants',
    'Low Light',
    'Air Purifying',
    'Pet Friendly',
    'Succulents',
  ];

  // Calculate count for each filter
  const getCount = (filter) => {
    if (filter === 'All Plants') return DUMMY_PLANTS.length;
    if (filter === 'AI Recommended') return AI_RECOMMENDED_IDS.length;
    return DUMMY_PLANTS.filter(p => p.tags.some(t => t.toLowerCase() === filter.toLowerCase())).length;
  };

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
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {filter}
            <span className={`ml-1.5 text-xs font-bold ${activeFilter === filter ? 'text-green-100' : 'text-gray-400'}`}>
              {getCount(filter)}
            </span>
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
          <span className={`text-xs font-bold ${activeFilter === 'AI Recommended' ? 'text-yellow-100' : 'text-yellow-500/60'}`}>
            {getCount('AI Recommended')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default FilterBar;


