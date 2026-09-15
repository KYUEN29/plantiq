import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, ClipboardList, Leaf } from 'lucide-react';
import AssessmentResult from './AssessmentResult';
import AssessmentQuestion from './AssessmentQuestion';
import AssessmentProgress from './AssessmentProgress';
import { getGardenPlant, getNextQuestion, submitAdaptiveAnswer } from '../services/api';

const navigate = (path) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const DRAFT_KEY_PREFIX = 'plantiq_assessment_draft_';

const AssessmentPage = ({ plantId, onSaved, onExit, onSkip, queueLabel }) => {
  const [plant, setPlant] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [progress, setProgress] = useState(0);
  const [totalEstimated, setTotalEstimated] = useState(null);
  const [historyStack, setHistoryStack] = useState([]);
  const [answersMap, setAnswersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(null);

  const storageKey = `${DRAFT_KEY_PREFIX}${plantId}`;

  // Load initial state / draft & fetch first question
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const gardenPlant = await getGardenPlant(plantId);
        if (!isMounted) return;
        setPlant(gardenPlant);

        // Check local draft
        let localAnswers = {};
        let localStack = [];
        try {
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed === 'object') {
              localAnswers = parsed.answers || {};
              localStack = parsed.stack || [];
            }
          }
        } catch (e) {
          console.warn('Failed to parse cached draft', e);
        }

        setAnswersMap(localAnswers);
        setHistoryStack(localStack);

        // Fetch next question from server
        const resp = await getNextQuestion(plantId);
        if (!isMounted) return;

        if (!resp.question) {
          // If no next question, assessment is already finished or needs finalize
          setSaved(resp);
        } else {
          setCurrentQuestion(resp.question);
          setProgress(resp.progress || localStack.length + 1);
          setTotalEstimated(resp.total_estimated || null);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to initialize assessment.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [plantId, storageKey]);

  // Handle answering a single question
  const handleAnswerSubmit = async (questionId, value) => {
    setSubmitting(true);
    setError('');
    try {
      // 1. Submit answer to server
      const resp = await submitAdaptiveAnswer(plantId, {
        question_id: questionId,
        value: value,
      });

      // 2. Update local state
      const updatedAnswers = { ...answersMap, [questionId]: value };
      const updatedStack = [...historyStack, { question: currentQuestion, value }];
      setAnswersMap(updatedAnswers);
      setHistoryStack(updatedStack);

      // Save draft
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            answers: updatedAnswers,
            stack: updatedStack,
          })
        );
      } catch (e) {
        console.warn('Failed to persist draft to localStorage', e);
      }

      // 3. Handle next step or completion
      if (!resp.question) {
        // Assessment completed! Clean draft and show results
        localStorage.removeItem(storageKey);
        setSaved(resp);
        if (onSaved) {
          onSaved(resp);
        }
      } else {
        setCurrentQuestion(resp.question);
        setProgress(resp.progress || updatedStack.length + 1);
        setTotalEstimated(resp.total_estimated || null);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (historyStack.length === 0) return;
    const prev = historyStack[historyStack.length - 1];
    const newStack = historyStack.slice(0, historyStack.length - 1);
    setHistoryStack(newStack);
    setCurrentQuestion(prev.question);
    setProgress(Math.max(1, progress - 1));
  };

  if (loading) return <div className="py-24 text-center text-gray-500">Loading plant assessment…</div>;

  if (error && !plant) {
    return (
      <section className="max-w-3xl mx-auto space-y-6 text-center py-16">
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </p>
        <button
          onClick={() => (onExit ? onExit() : navigate('/garden'))}
          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to My Garden
        </button>
      </section>
    );
  }

  if (saved) {
    const result = saved.result;
    return (
      <section className="max-w-3xl mx-auto space-y-6 py-12">
        <div className="text-center">
          <CheckCircle2 className="mx-auto w-14 h-14 text-green-600" />
          <h1 className="mt-4 text-3xl font-bold">Assessment saved.</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Your answers for <strong>{plant?.nickname}</strong> are stored
            {result ? ` — health score ${result.health_score}/100 (${result.health_status}, ${result.confidence} confidence)` : ''}.
          </p>
          {saved.id && <p className="mt-1 text-xs text-gray-400">Assessment ID: {saved.id}</p>}
        </div>
        {result && <AssessmentResult result={result} nickname={plant?.nickname} assessmentId={saved.id} guidance={saved.guidance} />}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => navigate('/garden')}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to My Garden
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-bold hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Dashboard
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => (onExit ? onExit() : navigate('/garden'))}
          className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
        >
          ← Back to My Garden
        </button>
        {queueLabel && (
          <span className="text-xs font-bold uppercase tracking-wider bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/40 rounded-full px-3 py-1">
            {queueLabel}
          </span>
        )}
        {onSkip && (
          <button
            onClick={onSkip}
            className="ml-auto text-sm font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Skip for now
          </button>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-green-700 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Adaptive Plant Assessment
        </p>
        <h1 className="mt-1 text-3xl font-bold flex items-center gap-2">
          <Leaf className="w-7 h-7 text-green-500" />
          {plant ? `Assessing ${plant.nickname}` : 'Assessing your plant'}
        </h1>
        {plant && plant.plant_species && (
          <p className="mt-1 text-sm text-gray-500">
            {plant.plant_species.common_name} — {plant.plant_species.scientific_name}
          </p>
        )}
      </div>

      <AssessmentProgress currentStep={progress} totalEstimated={totalEstimated} />

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      {currentQuestion && (
        <AssessmentQuestion
          question={currentQuestion}
          initialValue={answersMap[currentQuestion.id]}
          onSubmit={handleAnswerSubmit}
          onBack={historyStack.length > 0 ? handleBack : null}
          isSubmitting={submitting}
        />
      )}
    </section>
  );
};

export default AssessmentPage;
