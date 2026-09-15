import { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardList, History } from 'lucide-react';
import AssessmentResult from './AssessmentResult';
import { getAssessment, getAssessments } from '../services/api';

const navigate = (path) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const PAGE_SIZE = 20;

const statusStyle = (status) => {
  if (status === 'Healthy') return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/30';
  if (status === 'Needs attention') return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/30';
  return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/30';
};

const HistoryPage = () => {
  const [page, setPage] = useState({ items: [], total: 0, limit: PAGE_SIZE, offset: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async (offset) => {
    setLoading(true);
    setError('');
    try {
      setPage(await getAssessments(PAGE_SIZE, offset));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(0); }, []);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setError('');
    try {
      setSelected(await getAssessment(id));
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return <div className="py-24 text-center text-gray-500">Loading assessment history…</div>;

  return (
    <section className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-800 transition-colors">
        ← Back to Dashboard
      </button>
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-green-700 flex items-center gap-2">
          <History className="w-4 h-4" />Assessment History
        </p>
        <h1 className="mt-1 text-3xl font-bold">Your past assessments</h1>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}

      {selected ? (
        <div className="space-y-4">
          <button onClick={() => setSelected(null)} className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-800 transition-colors">
            ← Back to history
          </button>
          <p className="text-sm text-gray-500">
            {selected.created_at ? new Date(selected.created_at).toLocaleString() : ''} · Assessment ID: {selected.id}
          </p>
          {detailLoading
            ? <p className="text-gray-500">Loading assessment…</p>
            : <AssessmentResult result={selected.result} assessmentId={selected.id} guidance={selected.guidance} />}
        </div>
      ) : page.items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-green-300 bg-green-50/60 px-6 py-16 text-center">
          <ClipboardList className="mx-auto mb-4 w-10 h-10 text-green-600" />
          <h2 className="text-2xl font-bold">No assessment history yet.</h2>
          <p className="mt-2 text-gray-600">Complete your first plant assessment to start tracking its health over time.</p>
          <button onClick={() => navigate('/garden')} className="mt-6 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700">Go to My Garden</button>
        </div>
      ) : (
        <div className="space-y-3">
          {page.items.map((item) => (
            <button
              key={item.id}
              onClick={() => openDetail(item.id)}
              className="w-full text-left rounded-3xl border bg-white p-5 shadow-sm hover:border-green-500/40 transition-colors dark:bg-gray-800 dark:border-gray-700"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-40">
                  <p className="font-bold">{item.nickname}</p>
                  <p className="text-sm text-gray-500">{item.common_name} · {item.created_at ? new Date(item.created_at).toLocaleString() : ''}</p>
                </div>
                <span className="font-black text-lg">{item.health_score}/100</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusStyle(item.health_status)}`}>{item.health_status}</span>
              </div>
            </button>
          ))}
          <div className="flex items-center justify-between pt-2">
            <button
              disabled={page.offset === 0}
              onClick={() => load(Math.max(0, page.offset - PAGE_SIZE))}
              className="rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              ← Newer
            </button>
            <span className="text-xs text-gray-500">{page.offset + 1}–{Math.min(page.offset + page.items.length, page.total)} of {page.total}</span>
            <button
              disabled={page.offset + page.items.length >= page.total}
              onClick={() => load(page.offset + PAGE_SIZE)}
              className="rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Older →
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default HistoryPage;
