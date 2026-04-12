import React, { useState } from 'react';
import Hero from './components/Hero';
import FilterBar from './components/FilterBar';
import PlantGrid from './components/PlantGrid';
import WizardFlow from './components/WizardFlow';
import ResultsDashboard from './components/ResultsDashboard';
import { Moon, Sun, ArrowRight } from 'lucide-react';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  
  const [view, setView] = useState('GRID'); // GRID, WIZARD, RESULTS
  const [selectedPlants, setSelectedPlants] = useState([]);
  const [payload, setPayload] = useState(null);

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
    <div className={`min-h-screen transition-colors duration-300 pb-32 ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 glass-panel shadow-sm border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => { setView('GRID'); setSelectedPlants([]); }}
          >
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
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
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
            onRestart={() => { setView('GRID'); setSelectedPlants([]); setPayload(null); }} 
          />
        )}
      </main>

      {/* Floating Action Bar for Grid View */}
      {view === 'GRID' && selectedPlants.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom-full duration-300">
          <div className="max-w-xl mx-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl shadow-2xl p-4 flex items-center justify-between">
            <div className="font-semibold text-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center font-bold">
                {selectedPlants.length}
              </div>
              Plant{selectedPlants.length > 1 ? 's' : ''} Selected
            </div>
            <button 
              onClick={handleStartWizard}
              className="py-3 px-6 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
