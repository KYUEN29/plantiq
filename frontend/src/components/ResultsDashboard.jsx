import React, { useEffect, useState } from 'react';
import { Cpu, Droplets, Sun, Sprout, AlertTriangle, CheckCircle2, RefreshCcw, ShieldCheck, ShieldAlert } from 'lucide-react';
import { predictPlantHealth } from '../services/api';

const ResultsDashboard = ({ payload, onRestart, onResultsLoaded }) => {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      setLoading(true);
      setError(null);
      try {
        const resultsData = await predictPlantHealth(payload);
        setResults(resultsData);
        // Notify parent so ChatWidget can use this session's results
        if (onResultsLoaded) onResultsLoaded(resultsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [payload]);

  const getStatusIcon = (status) => {
    if (!status) return null;
    if (status.includes("Healthy")) return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status.includes("attention")) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <AlertTriangle className="w-5 h-5 text-red-500" />;
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200";
    if (status.includes("Healthy")) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/30";
    if (status.includes("attention")) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/30";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/30";
  };

  const getConfidenceBadge = (confidence) => {
    if (confidence === "High") {
      return (
        <div className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full text-xs font-bold border border-indigo-200 dark:border-indigo-800/30">
          <ShieldCheck className="w-3.5 h-3.5" /> High Confidence
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-800/30">
        <ShieldAlert className="w-3.5 h-3.5" /> Moderate Confidence
      </div>
    )
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-6">
        <Cpu className="w-16 h-16 text-green-500 animate-pulse" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI is analyzing your plants...</h2>
        <div className="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div className="bg-green-500 h-2 rounded-full animate-[progress_2s_ease-in-out_infinite] w-full origin-left scale-x-0"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 shadow-inner mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Analysis Rejected</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg">{error}</p>
        <button onClick={onRestart} className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg">Revise Selection</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Completion Feedback Banner */}
      <div className="flex items-center gap-3 px-5 py-3 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200/50 dark:border-green-800/30">
        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
        <span className="text-green-800 dark:text-green-300 font-medium text-sm">
          Analysis complete! {results.length} plant{results.length !== 1 ? 's' : ''} evaluated with AI-powered recommendations.
        </span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Cpu className="w-8 h-8 text-green-500" /> 
            AI Care Dashboard
          </h2>
          <p className="text-gray-500 mt-2 text-lg">Personalized actionable recommendations.</p>
        </div>
        <button onClick={onRestart} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-semibold text-gray-700 dark:text-gray-200 active:scale-95">
          <RefreshCcw className="w-4 h-4" /> Start Over
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {results.map((res, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-md border hover:border-green-500/30 border-gray-100 dark:border-gray-700 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{res.plant}</h3>
              {getConfidenceBadge(res.confidence)}
            </div>
            
            <div className={`px-4 py-3 rounded-2xl border flex items-center gap-3 font-semibold mb-8 shadow-sm ${getStatusColor(res.health)}`}>
              {getStatusIcon(res.health)} 
              <span className="text-sm uppercase tracking-wide">Status: {res.health}</span>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mt-1 shadow-sm">
                  <Droplets className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Watering Guideline</div>
                  <div className="text-gray-900 dark:text-gray-200 font-medium leading-relaxed">{res.watering}</div>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl mt-1 shadow-sm">
                  <Sun className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Sunlight Requirement</div>
                  <div className="text-gray-900 dark:text-gray-200 font-medium leading-relaxed">{res.sunlight}</div>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl mt-1 shadow-sm">
                  <Sprout className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Nutrition Plan</div>
                  <div className="text-gray-900 dark:text-gray-200 font-medium leading-relaxed">{res.fertilizer}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsDashboard;
