import React from 'react';
import { Activity, Check } from 'lucide-react';

const PlantCard = ({ plant, isSelected, onToggle }) => {
  return (
    <div 
      onClick={onToggle}
      className={`group bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border-2 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${isSelected ? 'border-green-500 shadow-green-100 dark:shadow-green-900/20 ring-4 ring-green-500/20' : 'border-gray-100 dark:border-gray-700'}`}
    >
      <div className="relative h-64 overflow-hidden bg-gray-50 dark:bg-gray-700">
        <img 
          src={plant.image} 
          alt={plant.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Selection Checkmark */}
        <div className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-green-500 scale-100' : 'bg-black/20 dark:bg-white/20 scale-0 group-hover:scale-100 opacity-50 group-hover:opacity-100'}`}>
          <Check className="w-5 h-5 text-white" />
        </div>

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
        
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button 
            className={`w-full py-3 rounded-xl transition-colors font-semibold flex flex-row items-center justify-center gap-2 ${isSelected ? 'bg-green-500 text-white' : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'}`}
          >
           {isSelected ? 'Selected' : 'Select'} 
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlantCard;
