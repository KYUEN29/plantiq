import React, { useEffect, useState } from 'react';
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

// Shared read-only renderer for a structured Phase 7 assessment result.
// Used by the post-submit success view and by historical detail views —
// it never regenerates a prediction, it only displays stored data.
// Pass assessmentId to enable the feedback section for that assessment.
const AssessmentResult = ({ result, nickname, assessmentId, guidance }) => {
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
  return (
    <div className="space-y-4 text-left">
      <div className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold">
            {result.health_score}/100 · {result.health_status}
          </h2>
          <span className="text-xs font-semibold text-gray-500">{result.confidence} confidence{ nickname ? ` · ${nickname}` : ''}</span>
        </div>
        <div className="mt-4 space-y-2">
          {result.dimensions.map((d) => (
            <div key={d.feature} className="flex items-start justify-between gap-3 text-sm px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className="font-semibold capitalize">{d.feature.replace(/_/g, ' ')}</span>
              <span className="text-gray-600 dark:text-gray-300 text-right">{d.detail}</span>
            </div>
          ))}
        </div>
      </div>
      {guidance && guidance.recommendations.length > 0 && (
        <div className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-bold">Recommended Actions</h2>
          <div className="mt-4 space-y-2">
            {guidance.recommendations.map((rec) => (
              <div key={rec.code} className="px-4 py-3 rounded-2xl border text-sm bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold flex-1">{rec.title}</p>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/30 border border-green-200 dark:border-green-800/40">{rec.priority}</span>
                  {rec.source === 'personalized' && <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-600 text-white">Personalized</span>}
                </div>
                <p className="mt-1 text-gray-700 dark:text-gray-200">{rec.description}</p>
                <p className="mt-1 text-xs text-gray-500">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {guidance && guidance.personalization_notes.length > 0 && (
        <div className="rounded-3xl border border-green-200 bg-green-50/60 p-6 dark:bg-green-900/10 dark:border-green-900/40">
          <h2 className="font-bold">Personalized for you</h2>
          <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-200">
            {guidance.personalization_notes.map((note, i) => <li key={i}>• {note}</li>)}
          </ul>
        </div>
      )}
      {assessmentId && (
        <div className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-bold">AI Explanation</h2>
          {!explanation ? (
            <div className="mt-3">
              <p className="text-sm text-gray-500 mb-3">Get a plain-language explanation of this assessment, grounded in your plant's documented care facts.</p>
              {explanationError && <p role="alert" className="text-sm text-red-600 mb-3">{explanationError}</p>}
              <button
                onClick={handleExplain}
                disabled={explaining}
                className="rounded-xl bg-indigo-500 px-5 py-2.5 font-bold text-white text-sm hover:bg-indigo-600 disabled:opacity-60"
              >
                {explaining ? 'Explaining…' : 'Explain with AI'}
              </button>
            </div>
          ) : explanation.available ? (
            <div className="mt-3 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">
              {explanation.explanation}
              {explanation.cached && <p className="mt-2 text-xs text-gray-400">Previously generated explanation.</p>}
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">{explanation.message || 'AI explanation is temporarily unavailable. Your assessment and care recommendations are still available.'}</p>
              <button
                onClick={handleExplain}
                disabled={explaining}
                className="mt-3 rounded-xl border px-4 py-2 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60"
              >
                {explaining ? 'Retrying…' : 'Try again'}
              </button>
            </div>
          )}
        </div>
      )}
      {result.issues.length > 0 && (
        <div className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-bold">Detected issues</h2>
          <div className="mt-4 space-y-2">
            {result.issues.map((issue) => (
              <div key={issue.code} className="px-4 py-3 rounded-2xl border text-sm bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/30">
                <p className="font-semibold">{issue.title}</p>
                {issue.evidence.map((e, i) => <p key={i} className="mt-1 text-gray-600 dark:text-gray-300">{e}</p>)}
              </div>
            ))}
          </div>
        </div>
      )}
      {result.recommendations.length > 0 && (
        <div className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-bold">Recommendations</h2>
          <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-200">
            {result.recommendations.map((rec, i) => <li key={i} className="px-4 py-3 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800/30">{rec.text}</li>)}
          </ul>
        </div>
      )}
      {result.limitations.length > 0 && (
        <div className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-bold">Information limitations</h2>
          <ul className="mt-4 space-y-1 text-sm text-gray-500">
            {result.limitations.map((lim, i) => <li key={i}>• {lim}</li>)}
          </ul>
        </div>
      )}
      {assessmentId && (
        <div className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-bold">Was this assessment helpful?</h2>
          <p className="mt-1 text-sm text-gray-500">Your feedback helps personalize future recommendations.</p>
          {loading ? (
            <p className="mt-4 text-sm text-gray-500">Loading your feedback…</p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {HELPFULNESS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setHelpfulness(opt.value)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
                      helpfulness === opt.value
                        ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">What was useful or not useful? (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {REASON_OPTIONS.map((opt) => {
                    const selected = reasons.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggleReason(opt.value)}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
                          selected
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700'
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              {existing && <p className="text-sm text-green-700 dark:text-green-300">Thanks — your feedback is saved and helps personalize future guidance.</p>}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl bg-green-600 px-5 py-2.5 font-bold text-white hover:bg-green-700 disabled:opacity-60 text-sm"
              >
                {submitting ? 'Saving…' : existing ? 'Update feedback' : 'Submit feedback'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssessmentResult;
