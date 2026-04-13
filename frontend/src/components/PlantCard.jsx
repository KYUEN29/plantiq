import React, { useState } from 'react';
import { Check } from 'lucide-react';

const PlantCard = ({ plant, isSelected, onToggle }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div 
      onClick={onToggle}
      className={`group bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border-2 cursor-pointer shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.1),0_0_30px_rgba(34,197,94,0.15)] transition-all duration-500 transform hover:-translate-y-2 active:scale-[0.98] ${isSelected ? 'border-green-500 shadow-green-100 dark:shadow-green-900/20 ring-4 ring-green-500/20' : 'border-gray-100 dark:border-gray-700'}`}
    >
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-8">
        {/* Shimmer placeholder while loading */}
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
        )}

        {/* Floating Sparkles Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
           <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-ping" />
           <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
           <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        </div>

        {/* Error fallback */}
        {imgError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20">
            <span className="text-6xl">🌿</span>
          </div>
        )}

        {/* Actual image - Optimized for Pixel Art */}
        {!imgError && (
          <img 
            src={plant.image} 
            alt={plant.name} 
            className={`w-full h-full object-contain drop-shadow-2xl transition-all duration-700 group-hover:scale-[1.12] group-hover:rotate-2 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        )}
        
        {/* Selection Checkmark */}
        <div className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-green-500 scale-100 shadow-lg' : 'bg-black/10 dark:bg-white/10 scale-0 group-hover:scale-100 opacity-50 group-hover:opacity-100'}`}>
          <Check className="w-5 h-5 text-white" />
        </div>

        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {plant.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 bg-white/90 dark:bg-black/60 backdrop-blur-md text-[10px] uppercase tracking-wider font-black rounded-lg text-gray-800 dark:text-gray-200 shadow-sm border border-white/20">
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-4 text-center">
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1 group-hover:text-green-600 transition-colors uppercase tracking-tight italic">{plant.name}</h3>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 line-clamp-2">{plant.description}</p>
        </div>
        
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button 
            className={`w-full py-3 rounded-2xl transition-all duration-300 font-black text-xs uppercase tracking-widest flex flex-row items-center justify-center gap-2 ${isSelected ? 'bg-green-500 text-white shadow-xl shadow-green-500/30 -translate-y-1' : 'bg-gray-50 hover:bg-green-50 dark:bg-gray-700 dark:hover:bg-green-900/20 text-gray-700 dark:text-gray-200'}`}
          >
           {isSelected ? '✓ In Collection' : 'Select Plant'} 
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlantCard;

