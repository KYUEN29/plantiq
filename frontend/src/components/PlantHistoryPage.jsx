import { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardList, Leaf, TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AssessmentResult from './AssessmentResult';
import { getAssessment, getPersonalization, getPlantAnalytics, getPlantAssessments } from '../services/api';

const navigate = (path) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const PlantHistoryPage = ({ plantId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState({ items: [], total: 0 });
  const [personalization, setPersonalization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [stats, hist, personal] = await Promise.all([
          getPlantAnalytics(plantId),
          getPlantAssessments(plantId, 20, 0),
          getPersonalization(plantId),
        ]);
        setAnalytics(stats);
        setHistory(hist);
        setPersonalization(personal);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [plantId]);

  const openDetail = async (id) => {
    setError('');
    try {
      setSelected(await getAssessment(id));
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="py-24 text-center text-gray-500">Loading plant history…</div>;

  if (error && !analytics) {
    return (
      <section className="max-w-4xl mx-auto space-y-6 text-center py-16">
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
        <button onClick={() => navigate('/garden')} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700">
          <ArrowLeft className="w-5 h-5" />Back to My Garden
        </button>
      </section>
    );
  }

  const summary = analytics?.summary;
  const timeline = (analytics?.timeline || []).map((point) => ({
    ...point,
    label: point.date ? new Date(point.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '',
  }));

  return (
    <section className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate('/garden')} className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-800 transition-colors">
        ← Back to My Garden
      </button>
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-green-700 flex items-center gap-2">
          <Leaf className="w-4 h-4" />Plant History & Analytics
        </p>
        <h1 className="mt-1 text-3xl font-bold">{analytics?.plant?.nickname}</h1>
        {analytics?.plant && <p className="mt-1 text-sm text-gray-500">{analytics.plant.common_name} — {analytics.plant.scientific_name}</p>}
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}

      {personalization && [...(personalization.plant?.notes || []), ...(personalization.user?.notes || [])].length > 0 && !selected && (
        <div className="rounded-3xl border border-green-200 bg-green-50/60 p-6 dark:bg-green-900/10 dark:border-green-900/40">
          <h2 className="font-bold">Your plant-care pattern</h2>
          <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-200">
            {[...(personalization.plant?.notes || []), ...(personalization.user?.notes || [])].map((note, i) => <li key={i}>• {note}</li>)}
          </ul>
        </div>
      )}

      {selected ? (
        <div className="space-y-4">
          <button onClick={() => setSelected(null)} className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-800 transition-colors">
            ← Back to history
          </button>
           <AssessmentResult result={selected.result} nickname={analytics?.plant?.nickname} assessmentId={selected.id} guidance={selected.guidance} />
        </div>
      ) : (
        <>
          {summary?.assessment_count > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['Latest', summary.latest_score],
                ['Average', summary.average_score],
                ['Highest', summary.highest_score],
                ['Change', summary.score_change !== null && summary.score_change !== undefined ? `${summary.score_change > 0 ? '+' : ''}${summary.score_change}` : '—'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border bg-white p-4 text-center shadow-sm dark:bg-gray-800 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="text-2xl font-black mt-1">{value ?? '—'}</p>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <h2 className="text-xl font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-500" />Score over time</h2>
            {timeline.length >= 2 ? (
              <div className="w-full h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none' }} formatter={(value) => [`${value}/100`, 'Score']} />
                    <Line type="monotone" dataKey="score" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                {timeline.length === 1
                  ? 'Only one assessment so far — complete a second assessment to see a meaningful trend.'
                  : 'No assessments yet — complete your first plant assessment to start tracking its health over time.'}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">Assessment history</h2>
            {history.items.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-green-300 bg-green-50/60 px-6 py-12 text-center">
                <ClipboardList className="mx-auto mb-3 w-10 h-10 text-green-600" />
                <p className="font-bold">No assessment history yet.</p>
                <p className="mt-1 text-sm text-gray-600">Complete your first plant assessment to start tracking its health over time.</p>
                <button onClick={() => navigate(`/assess/${plantId}`)} className="mt-4 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700">Assess this plant</button>
              </div>
            ) : (
              history.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openDetail(item.id)}
                  className="w-full text-left rounded-3xl border bg-white p-5 shadow-sm hover:border-green-500/40 transition-colors dark:bg-gray-800 dark:border-gray-700"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-gray-500 flex-1 min-w-40">{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</span>
                    <span className="font-black text-lg">{item.health_score}/100</span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full border">{item.health_status}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default PlantHistoryPage;
