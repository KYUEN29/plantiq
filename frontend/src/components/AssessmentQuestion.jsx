import React, { useState } from 'react';

export default function AssessmentQuestion({ question, initialValue, onSubmit, onBack, isSubmitting }) {
  const [value, setValue] = useState(initialValue !== undefined ? initialValue : (question.question_type === 'multi_choice' ? [] : ''));
  const [error, setError] = useState(null);

  const handleSingleSelect = (val) => {
    setValue(val);
    setError(null);
  };

  const handleMultiToggle = (val) => {
    const list = Array.isArray(value) ? [...value] : [];
    const idx = list.indexOf(val);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(val);
    }
    setValue(list);
    setError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.is_required) {
      if (question.question_type === 'multi_choice') {
        if (!Array.isArray(value) || value.length === 0) {
          setError('Please select at least one option.');
          return;
        }
      } else {
        if (value === '' || value === null || value === undefined) {
          setError('This field is required.');
          return;
        }
      }
    }
    onSubmit(question.id, value);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900 mb-2">{question.question_text}</h2>
      {question.is_required && <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block mb-4">Required</span>}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-3 mb-6">
        {question.question_type === 'single_choice' && (question.options || []).map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center p-3.5 border rounded-xl cursor-pointer transition ${
              value === opt.value
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-medium'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <input
              type="radio"
              name="single_choice"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => handleSingleSelect(opt.value)}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <span className="ml-3 text-sm">{opt.label}</span>
          </label>
        ))}

        {question.question_type === 'multi_choice' && (question.options || []).map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center p-3.5 border rounded-xl cursor-pointer transition ${
              Array.isArray(value) && value.includes(opt.value)
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-medium'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <input
              type="checkbox"
              value={opt.value}
              checked={Array.isArray(value) && value.includes(opt.value)}
              onChange={() => handleMultiToggle(opt.value)}
              className="h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
            />
            <span className="ml-3 text-sm">{opt.label}</span>
          </label>
        ))}

        {question.question_type === 'numeric' && (
          <div>
            <input
              type="number"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              value={value}
              onChange={(e) => {
                setValue(e.target.value === '' ? '' : Number(e.target.value));
                setError(null);
              }}
              placeholder="Enter a number..."
            />
          </div>
        )}

        {question.question_type === 'free_text' && (
          <div>
            <textarea
              rows={4}
              className="w-full border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-sm"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder="Type your answer here..."
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition disabled:opacity-50"
          >
            Back
          </button>
        ) : <div />}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Next'}
        </button>
      </div>
    </form>
  );
}
