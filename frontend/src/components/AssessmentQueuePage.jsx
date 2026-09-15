import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, ClipboardList, XCircle } from 'lucide-react';
import AssessmentPage from './AssessmentPage';
import { getGarden } from '../services/api';

const navigate = (path) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

// Frontend-only queue: each plant still creates its own Assessment +
// AssessmentAnswer rows through the existing POST /assessments contract.
const AssessmentQueuePage = ({ plantIds }) => {
  const [garden, setGarden] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setGarden(await getGarden());
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="py-24 text-center text-gray-500">Loading assessment queue…</div>;

  if (loadError) {
    return (
      <section className="max-w-3xl mx-auto space-y-6 text-center py-16">
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{loadError}</p>
        <button onClick={() => navigate('/garden')} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700">
          <ArrowLeft className="w-5 h-5" />Back to My Garden
        </button>
      </section>
    );
  }

  const byId = new Map(garden.map((p) => [p.id, p]));
  // Plants missing from the user's garden (stale ids) fail explicitly, never silently.
  const unknownIds = plantIds.filter((id) => !byId.has(id));
  const queue = plantIds.filter((id) => byId.has(id));
  const seedFailures = unknownIds.map((id) => ({ plantId: id, nickname: 'Unknown plant', ok: false, error: 'This plant is not in your garden.' }));

  if (queue.length === 0) {
    return (
      <section className="max-w-3xl mx-auto space-y-6 py-12 text-center">
        <ClipboardList className="mx-auto w-14 h-14 text-gray-300" />
        <h1 className="text-3xl font-bold">No plants to assess.</h1>
        <p className="text-gray-600 dark:text-gray-400">None of the selected plants were found in your garden.</p>
        <button onClick={() => navigate('/garden')} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700">
          <ArrowLeft className="w-5 h-5" />Back to My Garden
        </button>
      </section>
    );
  }

  const done = index >= queue.length;

  const recordAndAdvance = (entry) => {
    const next = [...results, entry];
    setResults(next);
    setIndex((i) => i + 1);
    window.scrollTo(0, 0);
  };

  if (done) {
    const all = [...seedFailures, ...results];
    const failed = all.filter((r) => !r.ok);
    return (
      <section className="max-w-3xl mx-auto space-y-6 py-12">
        <div className="text-center">
          <CheckCircle2 className="mx-auto w-14 h-14 text-green-600" />
          <h1 className="mt-4 text-3xl font-bold">Assessment Complete</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {all.length - failed.length} of {all.length} plant{all.length !== 1 ? 's' : ''} assessed. Each success saved its own assessment; no prediction is run yet.
          </p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700 space-y-3">
          {all.map((r) => (
            <div key={r.plantId} className="flex items-center gap-3 text-sm">
              {r.ok ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
              <span className="font-semibold flex-1">{r.nickname}</span>
              {r.ok && r.healthScore !== undefined && <span className="text-gray-500">{r.healthScore}/100 · {r.healthStatus}</span>}
              {!r.ok && <span className="text-red-600">{r.error || 'Failed'}</span>}
              {!r.ok && r.plantId && byId.has(r.plantId) && (
                <button onClick={() => navigate(`/assess/${r.plantId}`)} className="font-semibold text-green-600 hover:text-green-800">Retry</button>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={() => navigate('/garden')} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700">
            <ArrowLeft className="w-5 h-5" />Back to My Garden
          </button>
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-bold hover:bg-gray-50 dark:hover:bg-gray-800">
            Dashboard
          </button>
        </div>
      </section>
    );
  }

  const currentId = queue[index];
  const current = byId.get(currentId);

  return (
    <section className="max-w-3xl mx-auto space-y-6">
      <AssessmentPage
        key={currentId}
        plantId={currentId}
        queueLabel={`Plant ${index + 1} of ${queue.length}`}
        onExit={() => navigate('/garden')}
        onSkip={() => recordAndAdvance({ plantId: currentId, nickname: current?.nickname || 'Unknown plant', ok: false, error: 'Skipped' })}
        onSaved={(result) => recordAndAdvance({ plantId: currentId, nickname: current?.nickname || 'Unknown plant', ok: true, assessmentId: result.id, healthScore: result.result?.health_score, healthStatus: result.result?.health_status })}
      />
    </section>
  );
};

export default AssessmentQueuePage;
