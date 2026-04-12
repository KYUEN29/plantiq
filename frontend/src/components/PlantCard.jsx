import React from 'react';
import { Activity, Plus } from 'lucide-react';

const PlantCard = ({ plant, onSelect }) => {
  return (
    <div className="group bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative h-64 overflow-hidden bg-gray-50 dark:bg-gray-700">
        <img 
          src={plant.image} 
          alt={plant.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {plant.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 bg-white/80 dark:bg-black/60 backdrop-blur-md text-xs font-semibold rounded-full text-gray-800 dark:text-gray-200 shadow-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{plant.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{plant.description}</p>
        </div>
        
        <div className="flex items-center justify-between mt-6">
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{plant.price}</span>
          <div className="flex gap-2">
            <button 
              onClick={() => onSelect(plant)}
              className="px-4 py-2 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 font-medium rounded-xl transition-colors flex items-center gap-1"
            >
              <Activity className="w-4 h-4" /> Analyze
            </button>
            <button className="p-2 bg-[#1f4037] hover:bg-[#1a352d] text-white rounded-xl transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantCard;
