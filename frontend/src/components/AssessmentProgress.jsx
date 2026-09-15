import React from 'react';

export default function AssessmentProgress({ currentStep, totalEstimated }) {
  const percent =
    totalEstimated && totalEstimated > 0
      ? Math.min(Math.round((currentStep / totalEstimated) * 100), 100)
      : null;

  return (
    <div className="mb-6 bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
      <div className="flex justify-between items-center text-sm font-medium text-emerald-800 mb-2">
        <span>Question {currentStep}</span>
        {totalEstimated && <span>Estimated: {totalEstimated}</span>}
      </div>
      {percent !== null && (
        <div className="w-full bg-emerald-200 rounded-full h-2">
          <div
            className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}
