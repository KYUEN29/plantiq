import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Eye, 
  Info,
  Droplets,
  Sun,
  Layers,
  ShieldAlert,
  ClipboardCheck
} from 'lucide-react';
import { getFeedback, requestExplanation, submitFeedback } from '../services/api';

const HELPFULNESS_OPTIONS = [
  { value: 'helpful', label: 'Yes' },
  { value: 'partially_helpful', label: 'Partly' },
  { value: 'not_helpful', label: 'No' },
];

const REASON_OPTIONS = [
  { value: 'recommendation_worked', label: 'Recommendation worked' },
  { value: 'recommendation_not_worked', label: 'Recommendation did not work' },
  { value: 'too_much_watering', label: 'Too much watering' },
  { value: 'too_little_watering', label: 'Too little watering' },
  { value: 'light_advice_useful', label: 'Light advice was useful' },
  { value: 'soil_advice_useful', label: 'Soil advice was useful' },
  { value: 'plant_improved', label: 'Plant improved' },
  { value: 'plant_not_improved', label: 'Plant did not improve' },
  { value: 'advice_unclear', label: 'Advice was unclear' },
  { value: 'other', label: 'Other' },
];

export default function AssessmentResult({ result, nickname, assessmentId, guidance, speciesKnowledge }) {
  const [existing, setExisting] = useState(null);
  const [helpfulness, setHelpfulness] = useState('');
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [explanation, setExplanation] = useState(null);
  const [explaining, setExplaining] = useState(false);
  const [explanationError, setExplanationError] = useState('');

  useEffect(() => {
    if (!assessmentId) return;
    setLoading(true);
    getFeedback(assessmentId)
      .then((data) => {
        setExisting(data);
        setHelpfulness(data.helpfulness || '');
        setReasons(data.reasons || []);
      })
      .catch(() => { setExisting(null); })
      .finally(() => setLoading(false));
  }, [assessmentId]);

  const toggleReason = (value) => {
    setReasons(reasons.includes(value) ? reasons.filter((r) => r !== value) : [...reasons, value]);
  };

  const handleSubmit = async () => {
    if (!helpfulness) {
      setError('Please choose Yes, Partly, or No.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const saved = await submitFeedback(assessmentId, { helpfulness, reasons });
      setExisting(saved);
      setHelpfulness(saved.helpfulness || '');
      setReasons(saved.reasons || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExplain = async () => {
    setExplanationError('');
    setExplaining(true);
    try {
      setExplanation(await requestExplanation(assessmentId));
    } catch (err) {
      setExplanationError(err.message);
    } finally {
      setExplaining(false);
    }
  };

  if (!result) return null;

  const nextAction = guidance?.next_best_action;
  const historyComp = guidance?.historical_comparison;
  const recommendations = guidance?.recommendations || [];
  const status = result.health_status || 'Healthy';
  const isHealthy = status.toLowerCase() === 'healthy';
  const isCritical = status.toLowerCase() === 'critical';

  const statusSummary = isHealthy
    ? "Your plant looks generally stable and healthy based on the information you provided."
    : isCritical
    ? "Several reported observations suggest this plant needs attention soon."
    : "There are a few conditions worth adjusting before they become bigger problems.";

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      
      {/* 1. Condition & Score Banner */}
      <div className={`rounded-3xl p-6 sm:p-8 border shadow-sm transition-all ${
        isHealthy 
          ? 'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-emerald-200 dark:from-emerald-950/20 dark:via-teal-950/10 dark:border-emerald-800/40' 
          : isCritical
          ? 'bg-gradient-to-br from-red-50 via-rose-50/50 to-white border-red-200 dark:from-red-950/20 dark:via-rose-950/10 dark:border-red-800/40'
          : 'bg-gradient-to-br from-amber-50 via-yellow-50/50 to-white border-amber-200 dark:from-amber-950/20 dark:via-yellow-950/10 dark:border-amber-800/40'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {isHealthy ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              ) : isCritical ? (
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Current Condition
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {status}
            </h2>
            <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base max-w-xl">
              {statusSummary}
            </p>
          </div>

          <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-200/60 dark:border-slate-700/60 pt-4 sm:pt-0 sm:pl-8">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Health Score</span>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {result.health_score}<span className="text-lg font-bold text-slate-400">/100</span>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              {result.confidence} confidence
            </span>
          </div>
        </div>

        {/* Historical comparison badge if available */}
        {historyComp && (
          <div className="mt-5 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center gap-3 text-xs sm:text-sm font-medium">
            {historyComp.trend === 'improving' ? (
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <span>Improving: {historyComp.summary}</span>
              </div>
            ) : historyComp.trend === 'worsening' ? (
              <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                <TrendingDown className="w-4 h-4" />
                <span>Attention: {historyComp.summary}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Minus className="w-4 h-4" />
                <span>Steady: {historyComp.summary}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Primary Next Best Action */}
      {nextAction && (
        <div className="rounded-3xl border-2 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Next Best Action</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {nextAction.title}
          </h3>
          <p className="text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed mb-4">
            {nextAction.description}
          </p>
          {nextAction.what_to_watch && (
            <div className="bg-white/70 dark:bg-slate-900/60 rounded-2xl p-4 border border-emerald-200/50 dark:border-emerald-800/30 text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
              <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">What to watch: </span>
                {nextAction.what_to_watch}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Prioritized Care Prescription */}
      {recommendations.length > 0 && (
        <div className="rounded-3xl border bg-white dark:bg-slate-900 dark:border-slate-800 p-6 sm:p-7 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            Your Care Prescription
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Prioritized actions based on observed evidence and plant needs.
          </p>

          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div 
                key={rec.code || index}
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                      {index + 1}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white text-base">
                      {rec.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {rec.action_type && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {rec.action_type}
                      </span>
                    )}
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      rec.priority === 'high'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                        : rec.priority === 'medium'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    }`}>
                      {rec.priority} Priority
                    </span>
                  </div>
                </div>

                <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed mb-3">
                  {rec.description}
                </p>

                {rec.what_to_watch && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    <strong className="font-semibold text-slate-600 dark:text-slate-300">Watch for: </strong> 
                    {rec.what_to_watch}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. What Plantiq Noticed (Findings & Dimensions) */}
      <div className="rounded-3xl border bg-white dark:bg-slate-900 dark:border-slate-800 p-6 sm:p-7 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          What Plantiq Noticed
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Structured observations evaluated across specific plant care dimensions.
        </p>

        <div className="grid gap-3">
          {(result.dimensions || []).map((d) => (
            <div 
              key={d.feature} 
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 text-sm"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  {d.feature.includes('water') ? <Droplets className="w-4 h-4" /> :
                   d.feature.includes('light') ? <Sun className="w-4 h-4" /> :
                   d.feature.includes('symptom') ? <ShieldAlert className="w-4 h-4" /> :
                   <Layers className="w-4 h-4" />}
                </div>
                <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                  {d.feature.replace(/_/g, ' ')}
                </span>
              </div>
              <span className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm sm:text-right max-w-md">
                {d.detail}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Personalized Guidance Context */}
      {guidance && guidance.personalization_notes && guidance.personalization_notes.length > 0 && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 dark:bg-emerald-950/20 dark:border-emerald-800/40">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Based on your history
          </h3>
          <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            {guidance.personalization_notes.map((note, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 6. AI Explanation (Constrained reasoning layer) */}
      {assessmentId && (
        <div className="rounded-3xl border bg-white dark:bg-slate-900 dark:border-slate-800 p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Care Explanation</h3>
          </div>

          {!explanation ? (
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Get a personalized explanation of these findings grounded in verified plant knowledge.
              </p>
              {explanationError && (
                <p role="alert" className="text-sm text-red-600 mb-3">{explanationError}</p>
              )}
              <button
                onClick={handleExplain}
                disabled={explaining}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white text-sm hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {explaining ? 'Generating explanation…' : 'Explain with AI'}
              </button>
            </div>
          ) : explanation.available ? (
            <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
              {explanation.explanation}
              {explanation.cached && (
                <p className="mt-3 text-xs text-slate-400">Previously generated explanation.</p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {explanation.message || 'AI explanation is temporarily unavailable. Your deterministic care prescription remains active.'}
              </p>
              <button
                onClick={handleExplain}
                disabled={explaining}
                className="mt-3 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {explaining ? 'Retrying…' : 'Try again'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. Information Limitations */}
      {result.limitations && result.limitations.length > 0 && (
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 p-5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 mb-2">
            <Info className="w-4 h-4" />
            <span>Scope & Limitations</span>
          </div>
          <ul className="space-y-1">
            {result.limitations.map((lim, i) => (
              <li key={i}>• {lim}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 8. Assessment Feedback */}
      {assessmentId && (
        <div className="rounded-3xl border bg-white dark:bg-slate-900 dark:border-slate-800 p-6 sm:p-7 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Was this assessment helpful?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Your feedback helps personalize future guidance.
          </p>

          {loading ? (
            <p className="text-xs text-slate-400">Loading your feedback…</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {HELPFULNESS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setHelpfulness(opt.value)}
                    className={`px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition ${
                      helpfulness === opt.value
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  What was useful or not useful? (optional)
                </p>
                <div className="flex flex-wrap gap-2">
                  {REASON_OPTIONS.map((opt) => {
                    const selected = reasons.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggleReason(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                          selected
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
              {existing && (
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Thanks — your feedback is saved and helps tailor future care.
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-60 text-xs sm:text-sm transition"
              >
                {submitting ? 'Saving…' : existing ? 'Update feedback' : 'Submit feedback'}
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
