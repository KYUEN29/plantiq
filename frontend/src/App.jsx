import React, { useState } from 'react';
import Hero from './components/Hero';
import FilterBar from './components/FilterBar';
import PlantGrid from './components/PlantGrid';
import AiPanel from './components/AiPanel';
import Dashboard from './components/Dashboard';
import { Moon, Sun } from 'lucide-react';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 glass-panel shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <span className="text-xl font-bold font-sans tracking-tight text-plantiq-dark dark:text-plantiq-light">
              Plantiq AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
            <button className="hidden sm:block px-4 py-2 bg-gradient-to-r from-[#1f4037] to-[#99f2c8] text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-24">
        <Hero />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <FilterBar />
          <PlantGrid onSelectPlant={setSelectedPlant} />
          
          <div className="mt-20">
            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Your Analytics Dashboard</h2>
            <Dashboard />
          </div>
        </div>
      </main>

      {/* AI Analysis Panel Modal */}
      {selectedPlant && (
        <AiPanel plant={selectedPlant} onClose={() => setSelectedPlant(null)} />
      )}
    </div>
  );
}

export default App;
