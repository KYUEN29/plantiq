import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getGarden, getAssessments, getPlantAssessments } from '../services/api';
import { Leaf, Activity, History, Plus, MessageSquare, AlertCircle, CheckCircle2, ChevronRight, AlertTriangle, Sprout } from 'lucide-react';

const navigate = (path) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const statusStyle = (status) => {
  if (status === 'Healthy') return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/30';
  if (status === 'Needs attention') return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/30';
  if (status === 'Critical') return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30';
  return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
};

const statusIcon = (status) => {
  if (status === 'Healthy') return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />;
  if (status === 'Needs attention') return <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
  if (status === 'Critical') return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
  return <Leaf className="w-5 h-5 text-gray-400" />;
};

export default function AuthenticatedHomePage() {
  const { user } = useAuth();
  const [garden, setGarden] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [plantDataMap, setPlantDataMap] = useState({}); // mapping plantId -> { latestAssessment, previousAssessment }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch garden plants
      const gardenData = await getGarden();
      const plants = gardenData || [];
      setGarden(plants);

      // Fetch global recent assessments for activity feed
      const activityData = await getAssessments(5, 0);
      setRecentActivity(activityData.items || []);

      // Fetch latest 2 assessments for each plant to determine current state and improvement
      const pMap = {};
      if (plants.length > 0) {
        // We limit to first 12 plants to avoid excessive API calls on dashboard
        const plantsToFetch = plants.slice(0, 12);
        await Promise.all(plantsToFetch.map(async (p) => {
          try {
            const assessmentsPage = await getPlantAssessments(p.id, 2, 0);
            const items = assessmentsPage.items || [];
            pMap[p.id] = {
              latestAssessment: items[0] || null,
              previousAssessment: items[1] || null
            };
          } catch (e) {
            pMap[p.id] = { latestAssessment: null, previousAssessment: null };
          }
        }));
      }
      setPlantDataMap(pMap);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const getFirstName = () => {
    if (!user) return 'Plant Parent';
    if (user.first_name) return user.first_name;
    if (user.name) return user.name.split(' ')[0];
    return 'Plant Parent';
  };

  // Determine improving plants
  const improvingPlants = garden.filter(p => {
    const data = plantDataMap[p.id];
    if (data && data.latestAssessment && data.previousAssessment) {
      return data.latestAssessment.health_score > data.previousAssessment.health_score;
    }
    return false;
  });

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
        <p>Loading your garden dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-24 max-w-3xl mx-auto px-4 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/30 p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">Unable to load dashboard</h2>
          <p className="text-red-600 dark:text-red-300 mb-6">{error}</p>
          <button onClick={loadDashboard} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
      
      {/* 1. WELCOME HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Good to see you, {getFirstName()}.
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Here's how your garden is doing.
          </p>
        </div>
        
        {/* 3. GARDEN OVERVIEW */}
        <div className="flex items-center gap-4 bg-white dark:bg-gray-800 px-5 py-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-center w-12 h-12 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">My Garden</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{garden.length} plant{garden.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="ml-2 border-l pl-4 border-gray-100 dark:border-gray-700">
            <button onClick={() => navigate('/garden')} className="text-sm font-bold text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 flex items-center gap-1">
              View <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {garden.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10 px-6 py-20 text-center max-w-3xl mx-auto">
          <Leaf className="mx-auto mb-4 w-12 h-12 text-green-500 opacity-80" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your garden is waiting.</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Add your first plant and start building its story. Plantiq will help you track its care and health over time.
          </p>
          <button onClick={() => navigate('/garden')} className="rounded-xl bg-green-600 px-8 py-3.5 font-bold text-white hover:bg-green-700 shadow-md transition-transform hover:-translate-y-0.5">
            Add a Plant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-12">
            {/* 2. PRIMARY "NEEDS ATTENTION" / 4. PLANT ATTENTION CARDS */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600 dark:text-green-400" /> What needs my attention?
                </h2>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {garden.slice(0, 6).map(plant => {
                  const data = plantDataMap[plant.id];
                  const latest = data?.latestAssessment;
                  const isAssessed = !!latest;
                  
                  return (
                    <div key={plant.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{plant.nickname}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{plant.plant_species.common_name}</p>
                        </div>
                        {isAssessed ? (
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${statusStyle(latest.health_status)}`}>
                            {statusIcon(latest.health_status)}
                            <span>{latest.health_status}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 text-xs font-bold">
                            <AlertCircle className="w-4 h-4" /> Not assessed
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        {isAssessed ? (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Plantiq score: <span className="font-bold text-gray-900 dark:text-white">{latest.health_score}/100</span>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Needs its first assessment
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <button onClick={() => navigate(`/garden/${plant.id}`)} className="p-2 text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" aria-label={`View ${plant.nickname}`}>
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          {!isAssessed && (
                            <button onClick={() => navigate(`/assess/${plant.id}`)} className="text-xs font-bold px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                              Assess Plant
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {garden.length > 6 && (
                <div className="mt-6 text-center">
                  <button onClick={() => navigate('/garden')} className="text-sm font-bold text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300">
                    View all {garden.length} plants in My Garden →
                  </button>
                </div>
              )}
            </section>

            {/* 6. IMPROVING PLANTS */}
            {improvingPlants.length > 0 && (
              <section className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-3xl p-6 md:p-8 border border-green-100 dark:border-green-900/30">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                  <Sprout className="w-5 h-5 text-green-600 dark:text-green-400" /> Plants on the mend
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {improvingPlants.map(plant => {
                    const latest = plantDataMap[plant.id].latestAssessment;
                    const prev = plantDataMap[plant.id].previousAssessment;
                    return (
                      <div key={`imp-${plant.id}`} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-between border border-white/50 dark:border-gray-700/50">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{plant.nickname}</p>
                          <p className="text-xs text-green-700 dark:text-green-400 font-semibold mt-1">Score improved from {prev.health_score} to {latest.health_score}</p>
                        </div>
                        <button onClick={() => navigate(`/garden/${plant.id}/history`)} className="p-2 bg-white dark:bg-gray-700 rounded-full text-green-600 dark:text-green-400 hover:scale-105 transition-transform shadow-sm">
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-8">
            {/* 5. RECENT PROGRESS / ACTIVITY */}
            <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                <History className="w-5 h-5 text-gray-400" /> Recent Activity
              </h2>
              
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No recent assessments found.</p>
                  <button onClick={() => navigate('/garden')} className="text-sm font-bold text-green-600 dark:text-green-400 hover:underline">
                    Assess a plant
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map(activity => (
                    <div key={`act-${activity.id}`} className="flex items-start gap-3 border-b border-gray-50 dark:border-gray-700/50 pb-4 last:border-0 last:pb-0">
                      <div className="mt-0.5">
                        {statusIcon(activity.health_status)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          Assessed {activity.nickname}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(activity.created_at).toLocaleDateString()} · Score: {activity.health_score}
                        </p>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => navigate('/history')} className="w-full mt-2 py-2 text-center text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    View All History
                  </button>
                </div>
              )}
            </section>

            {/* 8. QUICK ACTIONS */}
            <section className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate('/garden')} className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 transition-colors shadow-sm group">
                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-2 group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Add Plant</span>
              </button>
              
              <button onClick={() => navigate('/history')} className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 transition-colors shadow-sm group">
                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-2 group-hover:scale-110 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">View Progress</span>
              </button>
            </section>

            {/* 7. ASK PLANTIQ PROMPT */}
            <section className="bg-gray-900 dark:bg-black rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-3xl"></div>
              <MessageSquare className="w-8 h-8 text-green-400 mb-4" />
              <h2 className="text-xl font-bold mb-2">Have a question about your plants?</h2>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Ask Plantiq about care, symptoms, light, soil, watering, or anything you're wondering about.
              </p>
              <button onClick={() => navigate('/ask')} className="w-full py-3 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-bold transition-colors">
                Ask Plantiq
              </button>
            </section>

          </div>
        </div>
      )}
    </div>
  );
}
