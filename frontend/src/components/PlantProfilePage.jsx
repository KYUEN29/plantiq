import React from 'react';

export default function PlantProfilePage({ plantId }) {
  return (
    <div className="p-8 text-center max-w-4xl mx-auto mt-12 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h1 className="text-3xl font-bold mb-4">Plant Profile</h1>
      <p className="text-gray-600 dark:text-gray-300">
        Profile for plant ID: {plantId}
      </p>
      <p className="text-gray-500 text-sm mt-4">Under construction.</p>
    </div>
  );
}
