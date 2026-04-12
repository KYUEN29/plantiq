import React, { useState } from 'react';
import { Star } from 'lucide-react';

const FilterBar = () => {
  const [activeFilter, setActiveFilter] = useState('All Plants');
  
  const filters = [
    'All Plants',
    'Low Light',
    'Air Purifying',
    'Pet Friendly',
    'Succulents',
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => setActiveFilter(filter)}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            activeFilter === filter
              ? 'bg-[#1f4037] text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {filter}
        </button>
      ))}
      <button
        onClick={() => setActiveFilter('AI Recommended')}
        className={`px-5 py-2 rounded-full text-sm font-medium flex items-center gap-1 transition-all ${
          activeFilter === 'AI Recommended'
            ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-md'
            : 'bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-700 border border-yellow-200 hover:shadow-sm dark:bg-gray-800 dark:border-yellow-600/30 dark:text-yellow-400'
        }`}
      >
        <Star className="w-4 h-4 fill-current" />
        AI Recommended
      </button>
    </div>
  );
};

export default FilterBar;
