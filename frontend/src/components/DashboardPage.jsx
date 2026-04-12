import React, { useEffect, useState, useMemo } from 'react';
import { getHistoryDashboard } from '../services/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Activity, Droplets, Calendar, AlertTriangle, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

const PLANT_COLORS = {
  'Money Plant': '#10b981',
  'Snake Plant': '#6366f1',
  'Tulsi':       '#f59e0b',
  'Aloe Vera':   '#ef4444',
  'Monstera':    '#8b5cf6',
  'Peace Lily':  '#ec4899',
  'Spider Plant':'#14b8a6',
  'Areca Palm':  '#f97316',
  'Fern':        '#06b6d4',
  'Jade Plant':  '#84cc16',
};

const DashboardPage = ({ onBack }) => {
  const [rawHistory, setRawHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getHistoryDashboard();
        setRawHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Transform history into pivoted multi-plant time-series: 
  // [{ time: "Apr 12, 10:30", "Money Plant": 100, "Snake Plant": 60, ... }]
  // CRITICAL: This block must remain PURE. No setState or side effects allowed here (Prevents Error #310).
  const { chartData, plantNames, plantStats, insights } = useMemo(() => {
    if (!Array.isArray(rawHistory) || rawHistory.length === 0) {
      return { chartData: [], plantNames: [], plantStats: {}, insights: [] };
    }

    const pivoted = [];
    const stats = {}; // { plantName: { scores: [], waterInputs: [] } }

    rawHistory.forEach((entry, idx) => {
      if (!entry || typeof entry !== "object") return;

      const timeLabel = entry.timestamp 
        ? new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' }) 
        : `Session ${idx + 1}`;

      const row = { time: timeLabel };

      if (!Array.isArray(entry.predictions)) return;

      entry.predictions.forEach((pred, pIdx) => {
        if (!pred || typeof pred !== "object") return;

        const plantName = pred.plant || "Unknown";
        const healthText = typeof pred.health === "string" ? pred.health : "";

        const score = healthText.includes("Healthy")
          ? 100
          : healthText.includes("attention")
          ? 60
          : 30;

        row[plantName] = score;

        if (!stats[plantName]) {
          stats[plantName] = { scores: [], waterInputs: [] };
        }

        stats[plantName].scores.push(score);

        const plantInput = Array.isArray(entry.plants) ? entry.plants[pIdx] : null;

        if (plantInput && typeof plantInput.water === "string") {
          stats[plantName].waterInputs.push(plantInput.water);
        }
      });

      if (Object.keys(row).length > 1) {
        pivoted.push(row);
      }
    });

    const names = Object.keys(stats || {});

    // Generate insights
    const generatedInsights = [];

    names.forEach(name => {
      const s = stats[name];
      if (s.scores.length >= 2) {
        const recent = s.scores.slice(-2);
        const early = s.scores.slice(0, 2);
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const earlyAvg = early.reduce((a, b) => a + b, 0) / early.length;

        if (recentAvg > earlyAvg + 10) {
          generatedInsights.push({ type: 'success', icon: 'up', text: `${name} health is improving 📈` });
        } else if (recentAvg < earlyAvg - 10) {
          generatedInsights.push({ type: 'warning', icon: 'down', text: `${name} needs attention — health declining ⚠️` });
        } else {
          generatedInsights.push({ type: 'neutral', icon: 'neutral', text: `${name} health is stable across ${s.scores.length} evaluations` });
        }
      }

      // Check watering consistency
      const dryCount = s.waterInputs.filter(w => w === 'Completely dry' || w === 'Slightly dry').length;
      if (dryCount >= 2) {
        generatedInsights.push({ type: 'alert', icon: 'alert', text: `${name}: Watering pattern inconsistent — reported dry ${dryCount} times` });
      }
    });

    // Normalize: ensure every row has a key for every plant (null if missing)
    const normalizedData = pivoted.map(row => {
      const newRow = { ...row };
      names.forEach(name => {
        if (!(name in newRow)) {
          newRow[name] = 0;
        }
      });
      return newRow;
    });

    return { chartData: normalizedData, plantNames: names, plantStats: stats, insights: generatedInsights };
  }, [rawHistory]);

  // Compute overall trend summary — MUST be before any early returns (Rules of Hooks)
  const trendSummary = useMemo(() => {
    const improving = insights.filter(i => i.type === 'success').length;
    const declining = insights.filter(i => i.type === 'warning').length;
    const alerts = insights.filter(i => i.type === 'alert').length;

    if (improving > 0 && declining === 0 && alerts === 0) {
      return { text: 'Your plants are doing great! Keep it up 📈', color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/30' };
    } else if (declining > 0 || alerts > 0) {
      return { text: `${declining} plant${declining !== 1 ? 's' : ''} need${declining === 1 ? 's' : ''} attention ⚠️`, color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/30' };
    }
    return { text: 'Plant health is stable across your collection 🌿', color: 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600' };
  }, [insights]);

  // Validate chart data — MUST be before any early returns (Rules of Hooks)
  const isValidChart =
    Array.isArray(chartData) &&
    chartData.length > 0 &&
    Array.isArray(plantNames) &&
    plantNames.length > 0 &&
    chartData.every(row =>
      plantNames.every(name => typeof row[name] === "number")
    );

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-6">
        <Activity className="w-16 h-16 text-green-500 animate-spin" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compiling historical datasets...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center animate-in fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-900/20 mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Unable to Load Data</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
        <button onClick={onBack} className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform">Return Home</button>
      </div>
    );
  }

  // Compute overall trend summary
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Activity className="w-10 h-10 text-green-500" /> 
            Plant Health Timeline
          </h2>
          <p className="text-gray-500 mt-2 text-lg">Multi-plant trend analysis across your entire collection.</p>
        </div>
        <button onClick={onBack} className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-bold text-gray-700 dark:text-gray-200 active:scale-95">
          ← Back to Plants
        </button>
      </div>

      {!Array.isArray(chartData) || chartData.length === 0 || !Array.isArray(plantNames) || plantNames.length === 0 ? (
        <div className="p-10 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 text-center shadow-sm">
          <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">No history recorded yet</h3>
          <p className="text-gray-500 mt-2">Run your first plant assessment to generate timeline metrics!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Trend Summary Banner */}
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border font-medium text-sm ${trendSummary.color}`}>
            <Activity className="w-5 h-5 flex-shrink-0" />
            <span>{trendSummary.text}</span>
            <span className="ml-auto text-xs opacity-60 font-bold">{rawHistory.length} session{rawHistory.length !== 1 ? 's' : ''} recorded</span>
          </div>

          {/* Multi-Plant Line Chart */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Health Score Over Time</h3>
                <p className="text-gray-500 text-sm">Each line represents a different plant. Hover for details.</p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800/30">
                <TrendingUp className="w-3.5 h-3.5" />
                Higher score = healthier plant
              </div>
            </div>
            <div className="w-full h-96">
              {isValidChart ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fill: '#6b7280', fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false}
                    label={{ value: 'Time', position: 'insideBottom', offset: -10, fill: '#9ca3af', fontSize: 13, fontWeight: 'bold' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false} 
                    domain={[0, 100]}
                    label={{ value: 'Health Score', angle: -90, position: 'insideLeft', offset: 5, fill: '#9ca3af', fontSize: 13, fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.15)', padding: '14px 18px' }}
                    labelStyle={{ color: '#374151', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '14px' }}
                    formatter={(value, name) => [`${value}/100`, name]}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span style={{ color: '#6b7280', fontWeight: 600, fontSize: '13px' }}>{value}</span>}
                  />
                  {Array.isArray(plantNames) && plantNames.map(name => (
                    <Line 
                      key={name}
                      type="monotone" 
                      dataKey={name} 
                      stroke={PLANT_COLORS[name] || '#71717a'} 
                      strokeWidth={3} 
                      dot={{ r: 5, strokeWidth: 2, fill: '#fff' }} 
                      activeDot={{ r: 7, strokeWidth: 3 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading chart data...</div>
              )}
            </div>
          </div>

          {/* AI Insights Panel */}
          {insights.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-md">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">AI Insights</h3>
              <div className="space-y-3">
                {insights.map((insight, i) => {
                  const styles = {
                    success: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/30',
                    warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/30',
                    alert:   'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/30',
                    neutral: 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
                  };
                  return (
                    <div key={i} className={`flex items-center gap-3 px-5 py-3 rounded-2xl border font-medium text-sm ${styles[insight.type] || styles.neutral}`}>
                      {insight.icon === 'up' && <TrendingUp className="w-5 h-5" />}
                      {insight.icon === 'down' && <TrendingDown className="w-5 h-5" />}
                      {insight.icon === 'neutral' && <Minus className="w-5 h-5" />}
                      {insight.icon === 'alert' && <AlertCircle className="w-5 h-5" />}
                      <span>{insight.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Per-Plant Stats Grid */}
          {(() => {
            const plants = Object.entries(plantStats);
            if (plants.length === 0) return null;
            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {plants.map(([name, info]) => {
                  const avg = info.scores.length
                    ? Math.round(info.scores.reduce((a,b) => a+b, 0) / info.scores.length)
                    : 0;
                  const color = avg >= 80 ? 'text-green-500' : avg >= 50 ? 'text-yellow-500' : 'text-red-500';
                  const bg = avg >= 80 ? 'bg-green-50 dark:bg-green-900/20' : avg >= 50 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20';
                  const dotColor = PLANT_COLORS[name] || '#71717a';
                  return (
                    <div key={name} className={`${bg} p-5 rounded-2xl border border-gray-100 dark:border-gray-700 text-center shadow-sm`}>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dotColor }}></div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{name}</div>
                      </div>
                      <div className={`text-3xl font-black ${color}`}>{avg}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{info.scores.length} eval{info.scores.length > 1 ? 's' : ''}</div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-xl text-white">
              <Droplets className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Adaptive Memory</h3>
              <p className="text-gray-400 leading-relaxed">
                The system tracks chronic issues like constant dehydration. When a pattern is detected across multiple sessions, AI predictions are automatically adjusted to provide stronger intervention recommendations.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-md">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Assessment History</h3>
              <p className="text-gray-500 text-sm mb-4">Total sessions tracked: <span className="font-bold text-gray-900 dark:text-white">{rawHistory.length}</span></p>
              <div className="space-y-2">
                {rawHistory.slice(-5).reverse().map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-sm px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <span className="text-gray-500 dark:text-gray-400">
                      {entry.timestamp ? new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' }) : `Session ${rawHistory.length - i}`}
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">{entry.predictions?.length || 0} plants</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

