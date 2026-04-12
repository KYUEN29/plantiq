import React, { useEffect, useState } from 'react';
import { getHistoryDashboard } from '../services/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend 
} from 'recharts';
import { Activity, Droplets, Calendar, AlertTriangle } from 'lucide-react';

const DashboardPage = ({ onBack }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const rawHistory = await getHistoryDashboard();
        
        // Transform the history items into a flat time-series for Recharts
        const chartData = rawHistory.flatMap((entry, idx) => {
          // Provide a fallback if timestamp isn't formatted properly
          const timeLabel = entry.timestamp 
            ? new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' }) 
            : `Entry ${idx + 1}`;
            
          return entry.predictions.map(pred => ({
            time: timeLabel,
            plant: pred.plant,
            healthScore: pred.health.includes("Healthy") ? 100 : (pred.health.includes("attention") ? 60 : 30),
            confidenceVal: pred.confidence === "High" ? 90 : 50,
          }));
        });
        
        setData(chartData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

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
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-red-50 mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">No Data Available</h2>
        <p className="text-gray-600 mb-8">{error}</p>
        <button onClick={onBack} className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold">Return Home</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Activity className="w-10 h-10 text-green-500" /> 
            Plant Health Timeline
          </h2>
          <p className="text-gray-500 mt-2 text-lg">Macro trend analysis across your entire collection.</p>
        </div>
        <button onClick={onBack} className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm font-bold text-gray-700 dark:text-gray-200">
          Back to Grid
        </button>
      </div>

      {data.length === 0 ? (
        <div className="p-10 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 text-center shadow-sm">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">No history recorded yet</h3>
          <p className="text-gray-500 mt-2">Run your first plant assessment to generate timeline metrics!</p>
        </div>
      ) : (
        <div className="space-y-8">
            {/* Top Chart Area */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-md">
                <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Aggregate Health Metrics</h3>
                    <p className="text-gray-500 text-sm">Visualizing stability trends across sequential evaluations.</p>
                </div>
                <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="healthScore" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                        formatter={(value, name, props) => [value, name === 'healthScore' ? 'Health Index' : name]}
                        labelFormatter={(label, payload) => {
                            const plant = payload?.[0]?.payload?.plant;
                            return plant ? `${plant} — ${label}` : label;
                        }}
                        labelStyle={{ color: '#374151', fontWeight: 'bold', marginBottom: '0.5rem' }}
                    />
                    <Area type="monotone" dataKey="healthScore" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorHealth)" />
                    </AreaChart>
                </ResponsiveContainer>
                </div>
            </div>

            {/* Per-Plant Stats Grid */}
            {(() => {
                const plantMap = {};
                data.forEach(d => {
                    if (!plantMap[d.plant]) plantMap[d.plant] = { scores: [], count: 0 };
                    plantMap[d.plant].scores.push(d.healthScore);
                    plantMap[d.plant].count++;
                });
                const plants = Object.entries(plantMap);
                if (plants.length === 0) return null;
                return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {plants.map(([name, info]) => {
                            const avg = Math.round(info.scores.reduce((a,b) => a+b, 0) / info.scores.length);
                            const color = avg >= 80 ? 'text-green-500' : avg >= 50 ? 'text-yellow-500' : 'text-red-500';
                            const bg = avg >= 80 ? 'bg-green-50 dark:bg-green-900/20' : avg >= 50 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20';
                            return (
                                <div key={name} className={`${bg} p-5 rounded-2xl border border-gray-100 dark:border-gray-700 text-center shadow-sm`}>
                                    <div className={`text-3xl font-black ${color}`}>{avg}</div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white mt-1">{name}</div>
                                    <div className="text-xs text-gray-400 mt-0.5">{info.count} eval{info.count > 1 ? 's' : ''}</div>
                                </div>
                            );
                        })}
                    </div>
                );
            })()}

            {/* Bottom Row Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-xl text-white">
                    <Droplets className="w-10 h-10 text-blue-400 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Adaptive Memory</h3>
                    <p className="text-gray-400 leading-relaxed">
                        The system tracks chronic issues like constant dehydration. When a pattern is detected across multiple sessions, AI predictions are automatically adjusted to provide stronger intervention recommendations.
                    </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-md">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Confidence Trend</h3>
                    <div className="w-full h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <Tooltip 
                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                labelFormatter={(label, payload) => {
                                    const plant = payload?.[0]?.payload?.plant;
                                    return plant ? `${plant}` : label;
                                }}
                            />
                            <Line type="step" dataKey="confidenceVal" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} name="Confidence" />
                        </LineChart>
                    </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
