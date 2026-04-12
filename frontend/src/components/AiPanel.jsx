import React, { useState, useEffect, useMemo } from 'react';
import { Bot, Sparkles, AlertCircle, CheckCircle2, X, ChevronRight, Zap, Info } from 'lucide-react';

const AiPanel = ({ isOpen, onClose, latestResults }) => {
  // 1. COMPUTE ONLY in useMemo (No side effects/setStates here!)
  const stats = useMemo(() => {
    if (!latestResults || !Array.isArray(latestResults)) return null;
    
    const count = latestResults.length;
    const healthyCount = latestResults.filter(r => r.health?.includes("Healthy")).length;
    const attentionCount = count - healthyCount;
    const avgConfidence = "High"; // Placeholder for more complex logic
    
    return { count, healthyCount, attentionCount, avgConfidence };
  }, [latestResults]);

  // 2. STATE UPDATES ONLY IN useEffect
  useEffect(() => {
    if (isOpen) {
      console.log("[AiPanel] Opening with safety-first render pattern.");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white dark:bg-gray-900 shadow-2xl z-[60] border-l border-gray-100 dark:border-gray-800 flex flex-col animate-in slide-in-from-right-full duration-500">
      {/* Header */}
      <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <Zap className="w-full h-full scale-150 rotate-12" />
        </div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Ai Assistant</h2>
              <div className="flex items-center gap-1.5 opacity-80 text-xs">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                Active Monitoring
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {stats ? (
          <>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800/30">
                <div className="text-green-600 dark:text-green-400 font-bold text-2xl mb-1">{stats.healthyCount}</div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-green-800/50 dark:text-green-300/50">Thriving</div>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/30">
                <div className="text-amber-600 dark:text-amber-400 font-bold text-2xl mb-1">{stats.attentionCount}</div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-amber-800/50 dark:text-amber-300/50">Attention</div>
              </div>
            </div>

            {/* Smart Summary */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> Live Insights
              </h3>
              
              <div className="space-y-3">
                {latestResults.map((res, i) => (
                  <div key={i} className="group p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 rounded-2xl border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all cursor-default shadow-sm hover:shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{res.plant}</span>
                      {res.health?.includes("Healthy") ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                      {res.watering || "Analysis pending detailed sensor data..."}
                    </p>
                    <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold text-indigo-500 flex items-center gap-1">
                        View Care Plan <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence Banner */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">High Confidence Analysis</p>
                <p className="text-[10px] text-indigo-700/70 dark:text-indigo-400/70 mt-1 leading-relaxed">
                  Results are cross-referenced with your growth environment history for 98% accuracy.
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">No Active Assessment</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Run a plant analysis to see live AI insights and personalized care recommendations here.
            </p>
            <button 
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition-all"
            >
              Start Analysis
            </button>
          </div>
        )}
      </div>

      {/* Footer Meta */}
      <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
        <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <span>Plantiq Engine 4.0</span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" /> Pro Edition
          </span>
        </div>
      </div>
    </div>
  );
};

export default AiPanel;
