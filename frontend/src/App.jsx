import React, { useState } from 'react';
import Hero from './components/Hero';
import FilterBar from './components/FilterBar';
import PlantGrid from './components/PlantGrid';
import WizardFlow from './components/WizardFlow';
import ResultsDashboard from './components/ResultsDashboard';
import DashboardPage from './components/DashboardPage';
import ChatWidget from './components/ChatWidget';
import { Moon, Sun, ArrowRight, Activity } from 'lucide-react';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  
  const [view, setView] = useState('GRID'); // GRID, WIZARD, RESULTS, DASHBOARD
  const [selectedPlants, setSelectedPlants] = useState([]);
  const [payload, setPayload] = useState(null);
  const [latestResults, setLatestResults] = useState(null);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleTogglePlant = (plant) => {
    if (selectedPlants.find(p => p.id === plant.id)) {
      setSelectedPlants(selectedPlants.filter(p => p.id !== plant.id));
    } else {
      setSelectedPlants([...selectedPlants, plant]);
    }
  };

  const handleStartWizard = () => {
    if (selectedPlants.length > 0) {
      window.scrollTo(0, 0);
      setView('WIZARD');
    }
  };

  const handleCompleteWizard = (payloadArray) => {
    setPayload(payloadArray);
    window.scrollTo(0, 0);
    setView('RESULTS');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-32 ${darkMode ? 'dark bg-gray-900 text-white' : 'text-gray-900'}`}>
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => { setView('GRID'); setSelectedPlants([]); }}
          >
            <span className="text-2xl">🌿</span>
            <span className="text-xl font-bold font-sans tracking-tight text-green-700 dark:text-green-400">
              Plantiq AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setView('DASHBOARD'); window.scrollTo(0,0); }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm"
            >
              <Activity className="w-4 h-4 text-green-500" />
              History Dashboard
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 shadow-sm"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 relative z-10">
        {view === 'GRID' && (
          <div className="animate-in fade-in duration-500">
            <Hero />
            <div className="mt-12">
              <FilterBar />
              <PlantGrid selectedPlants={selectedPlants} onTogglePlant={handleTogglePlant} />
            </div>
          </div>
        )}

        {view === 'WIZARD' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <WizardFlow 
              selectedPlants={selectedPlants} 
              onComplete={handleCompleteWizard} 
              onCancel={() => setView('GRID')} 
            />
          </div>
        )}

        {view === 'RESULTS' && (
          <ResultsDashboard 
            payload={payload} 
            onResultsLoaded={setLatestResults}
            onRestart={() => { setView('GRID'); setSelectedPlants([]); setPayload(null); setLatestResults(null); }} 
          />
        )}

        {view === 'DASHBOARD' && (
          <DashboardPage onBack={() => { setView('GRID'); }} />
        )}
      </main>

      {/* Floating Action Bar for Grid View */}
      {view === 'GRID' && selectedPlants.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-40 animate-in slide-in-from-bottom-full duration-300 pointer-events-none">
          <div className="max-w-xl mx-auto bg-gray-900/95 backdrop-blur-md dark:bg-white/95 text-white dark:text-gray-900 rounded-2xl shadow-2xl p-4 flex items-center justify-between pointer-events-auto border border-gray-800 dark:border-gray-200">
            <div className="font-semibold text-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 dark:bg-green-100 flex items-center justify-center font-bold">
                {selectedPlants.length}
              </div>
              Plant{selectedPlants.length > 1 ? 's' : ''} Selected
            </div>
            <button 
              onClick={handleStartWizard}
              className="py-3 px-6 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg"
            >
              Analyze <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Independent Floating Components */}
      <ChatWidget latestResults={latestResults} />
    </div>
  );
}

export default App;
