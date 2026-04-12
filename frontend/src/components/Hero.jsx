import React from 'react';
import { ArrowRight, Leaf } from 'lucide-react';

const Hero = ({ onScrollToGrid }) => {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 rounded-3xl">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-green-200/30 to-emerald-600/10 blur-3xl"></div>
        <div className="absolute top-48 -left-24 w-72 h-72 rounded-full bg-emerald-900/5 blur-3xl dark:bg-emerald-400/5"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium mb-6">
            <Leaf className="w-4 h-4" />
            <span>AI-Powered Plant Care</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
            Smart Plant Care <br className="hidden sm:block" />
            <span className="gradient-text">Assistant</span>
          </h1>
          
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            Plantiq AI monitors your plant's environment, learns its ideal conditions, and gives you real-time recommendations for perfect health.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onScrollToGrid}
              className="w-full sm:w-auto px-8 py-3.5 bg-green-700 hover:bg-green-800 text-white rounded-full font-medium text-lg shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1 active:scale-95"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={onScrollToGrid}
              className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-full font-medium text-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1 active:scale-95"
            >
              Explore Plants
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;

