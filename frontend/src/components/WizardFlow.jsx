import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Droplets, Sprout, Sun, Leaf } from 'lucide-react';

const QUESTIONS = [
  { id: 'water', title: 'Water Intake', icon: <Droplets className="w-6 h-6 text-blue-500" />, options: ['Overwatered', 'Properly watered', 'Slightly dry', 'Completely dry'] },
  { id: 'sunlight', title: 'Sunlight Exposure', icon: <Sun className="w-6 h-6 text-yellow-500" />, options: ['Full direct sun', 'Partial shade', 'Low indirect light', 'No light'] },
  { id: 'color', title: 'Leaf Color & Health', icon: <Leaf className="w-6 h-6 text-green-500" />, options: ['Healthy green', 'Yellowing edges', 'Brown/crispy', 'Drooping'] },
  { id: 'soil', title: 'Soil Condition', icon: <Sprout className="w-6 h-6 text-amber-700" />, options: ['Soggy', 'Moist', 'Dry topsoil', 'Bone dry'] }
];

const WizardFlow = ({ selectedPlants, onComplete, onCancel }) => {
  const [currentPlantIdx, setCurrentPlantIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  // Store answers as: { plantId: { water: '...', sunlight: '...', color: '...', soil: '...' } }
  const [answers, setAnswers] = useState({});

  const currentPlant = selectedPlants[currentPlantIdx];
  const currentQuestion = QUESTIONS[currentQuestionIdx];

  const handleSelectOption = (option) => {
    const updatedAnswers = {
      ...answers,
      [currentPlant.id]: {
        ...(answers[currentPlant.id] || {}),
        [currentQuestion.id]: option
      }
    };
    setAnswers(updatedAnswers);

    // Proceed logic with a micro-timeout for click UX satisfaction
    setTimeout(() => {
      if (currentQuestionIdx < QUESTIONS.length - 1) {
        setCurrentQuestionIdx(currentQuestionIdx + 1);
      } else {
        // Last question for this plant
        if (currentPlantIdx < selectedPlants.length - 1) {
          setCurrentPlantIdx(currentPlantIdx + 1);
          setCurrentQuestionIdx(0);
        } else {
          // All plants done! Transform payload and dispatch
          const payload = selectedPlants.map(p => ({
            name: p.name,
            water: updatedAnswers[p.id]?.water || 'Properly watered',
            sunlight: updatedAnswers[p.id]?.sunlight || 'Partial shade',
            color: updatedAnswers[p.id]?.color || 'Healthy green',
            soil: updatedAnswers[p.id]?.soil || 'Moist'
          }));
          onComplete(payload);
        }
      }
    }, 150); // slight delay to show selection animation
  };

  const handleBack = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(currentQuestionIdx - 1);
    } else if (currentPlantIdx > 0) {
      setCurrentPlantIdx(currentPlantIdx - 1);
      setCurrentQuestionIdx(QUESTIONS.length - 1);
    } else {
      onCancel();
    }
  };

  const totalSteps = selectedPlants.length * QUESTIONS.length;
  const currentStep = (currentPlantIdx * QUESTIONS.length) + currentQuestionIdx + 1;
  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
        <div className="flex items-center justify-between mb-6">
          <button onClick={handleBack} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-sm font-bold text-gray-400 dark:text-gray-500 tracking-widest uppercase bg-white dark:bg-gray-900 px-4 py-1 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm">
            Step {currentStep} of {totalSteps}
          </div>
          <div className="w-9 h-9"></div> {/* Spacer */}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 shadow-inner">
          <div className="bg-green-500 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }}></div>
        </div>

        <div className="mt-8 flex items-center gap-6 animate-in slide-in-from-left-4 duration-300">
          <img src={currentPlant.image} alt={currentPlant.name} className="w-20 h-20 rounded-2xl object-cover shadow-md bg-gray-100 border border-gray-100 dark:border-gray-700" />
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1.5">{currentPlant.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Plant {currentPlantIdx + 1} of {selectedPlants.length}</p>
          </div>
        </div>
      </div>

      {/* Question Body - Use a consistent key to force React to re-mount and trigger the slide animation */}
      <div key={`${currentPlantIdx}-${currentQuestionIdx}`} className="p-6 md:p-10 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            {currentQuestion.icon}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{currentQuestion.title}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentQuestion.options.map((option) => {
            const isSelected = answers[currentPlant.id] && answers[currentPlant.id][currentQuestion.id] === option;
            return (
              <button
                key={option}
                onClick={() => handleSelectOption(option)}
                className={`p-6 text-left rounded-2xl border-2 transition-all duration-200 shadow-sm ${
                  isSelected 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 scale-[0.98]' 
                    : 'border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 hover:-translate-y-0.5'
                }`}
              >
                <div className="font-semibold text-lg">{option}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default WizardFlow;
