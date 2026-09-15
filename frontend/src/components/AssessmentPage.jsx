import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, Leaf } from 'lucide-react';
import AssessmentResult from './AssessmentResult';
import { getGardenPlant, getQuestionnaire, submitAssessment } from '../services/api';

const navigate = (path) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const SECTION_DEFS = [
  { title: 'Watering', hint: 'When and how often your plant gets water.', features: ['time_since_last_water', 'watering_frequency'] },
  { title: 'Environment', hint: 'Light, temperature and humidity around your plant.', features: ['sunlight_hours', 'light', 'temperature', 'humidity'] },
  { title: 'Soil & Pot', hint: 'What your plant is growing in.', features: ['moisture', 'soil_type', 'pot_size'] },
  { title: 'Growth', hint: 'Where your plant is in its life cycle.', features: ['growth_stage'] },
  { title: 'Plant Condition', hint: 'What your plant looks like right now. Select all that apply.', features: ['symptoms'] },
];

const AssessmentPage = ({ plantId, onSaved, onExit, onSkip, queueLabel }) => {
  const [plant, setPlant] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [stepError, setStepError] = useState('');
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [gardenPlant, questionnaire] = await Promise.all([
          getGardenPlant(plantId),
          getQuestionnaire(),
        ]);
        setPlant(gardenPlant);
        setQuestions([...(questionnaire.questions || [])].sort((a, b) => a.question_order - b.question_order));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [plantId]);

  const sections = useMemo(() => {
    const byFeature = new Map(questions.map((q) => [q.maps_to_feature, q]));
    const used = new Set();
    const built = SECTION_DEFS.map((def) => {
      const items = def.features.map((f) => byFeature.get(f)).filter(Boolean);
      items.forEach((q) => used.add(q.id));
      return { ...def, questions: items };
    }).filter((s) => s.questions.length > 0);
    const leftovers = questions.filter((q) => !used.has(q.id));
    if (leftovers.length > 0) {
      built.push({ title: 'Additional', hint: 'A few more details.', features: [], questions: leftovers });
    }
    return built;
  }, [questions]);

  const setSingleAnswer = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
    setStepError('');
  };

  const toggleMultiAnswer = (questionId, value) => {
    const current = Array.isArray(answers[questionId]) ? answers[questionId] : [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setAnswers({ ...answers, [questionId]: next });
    setStepError('');
  };

  const stepValid = (index) => {
    const section = sections[index];
    if (!section) return false;
    return section.questions.every((q) => {
      if (!q.is_required) return true;
      const value = answers[q.id];
      if (Array.isArray(value)) return value.length > 0;
      return typeof value === 'string' && value !== '';
    });
  };

  const goNext = () => {
    if (!stepValid(step)) {
      setStepError('Please answer all required questions before continuing.');
      return;
    }
    setStepError('');
    setStep((s) => Math.min(s + 1, sections.length - 1));
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    setStepError('');
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    setStepError('');
    setError('');
    const missing = questions.find((q) => {
      if (!q.is_required) return false;
      const value = answers[q.id];
      if (Array.isArray(value)) return value.length === 0;
      return typeof value !== 'string' || value === '';
    });
    if (missing) {
      setStepError(`Please answer: ${missing.question_text}`);
      const index = sections.findIndex((s) => s.questions.some((q) => q.id === missing.id));
      if (index >= 0) setStep(index);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        user_plant_id: plantId,
        answers: questions.map((q) => ({ question_id: q.id, value: answers[q.id] })),
      };
      const result = await submitAssessment(payload);
      if (onSaved) {
        onSaved(result);
        return;
      }
      setSaved(result);
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-24 text-center text-gray-500">Loading assessment…</div>;

  if (error && !plant) {
    return (
      <section className="max-w-3xl mx-auto space-y-6 text-center py-16">
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
        <button onClick={() => (onExit ? onExit() : navigate('/garden'))} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700">
          <ArrowLeft className="w-5 h-5" />Back to My Garden
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
            Your answers for <strong>{plant?.nickname}</strong> are stored{result ? ` — health score ${result.health_score}/100 (${result.health_status}, ${result.confidence} confidence)` : ''}.
          </p>
          <p className="mt-1 text-xs text-gray-400">Assessment ID: {saved.id}</p>
        </div>
        {result && <AssessmentResult result={result} nickname={plant?.nickname} assessmentId={saved.id} guidance={saved.guidance} />}
        {saved.personalization && [...(saved.personalization.plant?.notes || []), ...(saved.personalization.user?.notes || [])].length > 0 && (
          <div className="rounded-3xl border border-green-200 bg-green-50/60 p-6 dark:bg-green-900/10 dark:border-green-900/40">
            <h2 className="font-bold">Based on your previous assessments…</h2>
            <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-200">
              {[...(saved.personalization.plant?.notes || []), ...(saved.personalization.user?.notes || [])].map((note, i) => <li key={i}>• {note}</li>)}
            </ul>
          </div>
        )}
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

  const section = sections[step];

  return (
    <section className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => (onExit ? onExit() : navigate('/garden'))} className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-800 transition-colors">
          ← Back to My Garden
        </button>
        {queueLabel && <span className="text-xs font-bold uppercase tracking-wider bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/40 rounded-full px-3 py-1">{queueLabel}</span>}
        {onSkip && <button onClick={onSkip} className="ml-auto text-sm font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">Skip for now</button>}
      </div>

      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-green-700 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />Plant Assessment
        </p>
        <h1 className="mt-1 text-3xl font-bold flex items-center gap-2">
          <Leaf className="w-7 h-7 text-green-500" />
          {plant ? `Assessing ${plant.nickname}` : 'Assessing your plant'}
        </h1>
        {plant && (
          <p className="mt-1 text-sm text-gray-500">{plant.plant_species.common_name} — {plant.plant_species.scientific_name}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
          <span>Step {step + 1} of {sections.length}: {section?.title}</span>
          <span>{Math.round(((step + 1) / Math.max(sections.length, 1)) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full bg-green-600 transition-all duration-300"
            style={{ width: `${((step + 1) / Math.max(sections.length, 1)) * 100}%` }}
          />
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}

      {section && (
        <div className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-bold">{section.title}</h2>
          <p className="mt-1 text-sm text-gray-500">{section.hint}</p>
          <div className="mt-6 space-y-7">
            {section.questions.map((q) => (
              <fieldset key={q.id}>
                <legend className="font-semibold">
                  {q.question_text}
                  {q.is_required && <span className="ml-1 text-red-500">*</span>}
                </legend>
                <div className="mt-3 grid gap-2">
                  {q.question_type === 'multi_choice' ? (
                    q.options.map((opt) => {
                      const selected = Array.isArray(answers[q.id]) && answers[q.id].includes(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${selected ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleMultiAnswer(q.id, opt.value)}
                            className="w-4 h-4 accent-green-600"
                          />
                          <span className="text-sm font-medium">{opt.label}</span>
                        </label>
                      );
                    })
                  ) : (
                    q.options.map((opt) => {
                      const selected = answers[q.id] === opt.value;
                      return (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${selected ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={selected}
                            onChange={() => setSingleAnswer(q.id, opt.value)}
                            className="w-4 h-4 accent-green-600"
                          />
                          <span className="text-sm font-medium">{opt.label}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </fieldset>
            ))}
          </div>
        </div>
      )}

      {stepError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{stepError}</p>}

      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          disabled={step === 0}
          className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-bold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />Back
        </button>
        {step < sections.length - 1 ? (
          <button onClick={goNext} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700">
            Next<ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-60">
            {submitting ? 'Saving…' : 'Submit Assessment'}
          </button>
        )}
      </div>
    </section>
  );
};

export default AssessmentPage;
