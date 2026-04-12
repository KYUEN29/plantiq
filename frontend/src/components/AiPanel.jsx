import React, { useState } from 'react';
import { X, Cpu, Droplets, ArrowRight, CheckCircle2, AlertTriangle, Sprout, Sun } from 'lucide-react';

const AiPanel = ({ plant, onClose }) => {
  const [formData, setFormData] = useState({
    plant_name: plant.name,
    watering_frequency: 'Every 2-3 days',
    sunlight: 'Partial sunlight',
    plant_color: 'Healthy green',
    soil_condition: 'Moist',
    location: 'Indoor'
  });

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error("Server not reachable or returned an error.");
      }

      const result = await response.json();
      setPrediction(result);
    } catch (err) {
      alert("AI Server Error 🚨\\n\\nMake sure your backend is running at the configured API URL.\\nError: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return null;
    if (status.includes("Healthy")) return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status.includes("Warning") || status.includes("Overwatered")) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <AlertTriangle className="w-5 h-5 text-red-500" />;
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    if (status.includes("Healthy")) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30";
    if (status.includes("Warning") || status.includes("Overwatered")) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/30";
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/30";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-all overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative animate-in fade-in zoom-in duration-300 transform mt-10 md:mt-0">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>

        {/* Left Side: Form Interactions */}
        <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto max-h-[85vh] border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-md">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">AI Diagnosis</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Tell us about your {plant.name}</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Plant Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Plant Name</label>
              <input 
                type="text" 
                name="plant_name" 
                value={formData.plant_name}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>

            {/* Watering Frequency */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Watering Frequency</label>
              <select name="watering_frequency" value={formData.watering_frequency} onChange={handleChange} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm">
                <option value="Daily">Daily</option>
                <option value="Every 2-3 days">Every 2-3 days</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>

            {/* Sunlight Exposure */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sunlight Exposure</label>
              <select name="sunlight" value={formData.sunlight} onChange={handleChange} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all shadow-sm">
                <option value="Full sunlight">Full sunlight</option>
                <option value="Partial sunlight">Partial sunlight</option>
                <option value="Low light">Low light</option>
              </select>
            </div>

            {/* Plant Color */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Plant Color</label>
              <select name="plant_color" value={formData.plant_color} onChange={handleChange} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all shadow-sm">
                <option value="Healthy green">Healthy green</option>
                <option value="Slightly yellow">Slightly yellow</option>
                <option value="Brown/dry">Brown/dry</option>
              </select>
            </div>

            {/* Soil Condition */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Soil Condition</label>
              <select name="soil_condition" value={formData.soil_condition} onChange={handleChange} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent transition-all shadow-sm">
                <option value="Moist">Moist</option>
                <option value="Dry">Dry</option>
                <option value="Overwatered">Overwatered</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Location</label>
              <select name="location" value={formData.location} onChange={handleChange} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm">
                <option value="Indoor">Indoor</option>
                <option value="Balcony">Balcony</option>
                <option value="Outdoor garden">Outdoor garden</option>
              </select>
            </div>
            
            <div className="pt-6">
              <button 
                onClick={handlePredict}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Analyzing...
                  </span>
                ) : (
                  <>Analyze Plant <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Prediction Output */}
        <div className="w-full md:w-1/2 p-6 md:p-8 bg-gray-50/50 dark:bg-gray-900/50">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-500" /> AI Care Plan
          </h3>
          
          {prediction ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              
              {/* Overall Health Status */}
              <div className={`p-5 rounded-2xl flex items-center gap-4 ${getStatusColor(prediction.health_status)} shadow-sm transition-all`}>
                <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-sm">
                  {getStatusIcon(prediction.health_status)}
                </div>
                <div>
                  <p className="text-sm font-semibold opacity-80 uppercase tracking-wider mb-1">Health Status</p>
                  <h4 className="text-xl font-bold">{prediction.health_status}</h4>
                </div>
              </div>

              {/* Grid Recommendations */}
              <div className="grid grid-cols-1 gap-4">
                
                {/* Watering */}
                <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                      <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h5 className="font-semibold text-gray-900 dark:text-white">Watering Recommendation</h5>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                    {prediction.watering}
                  </p>
                </div>

                {/* Sunlight */}
                <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-lg">
                      <Sun className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h5 className="font-semibold text-gray-900 dark:text-white">Sunlight Requirement</h5>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                    {prediction.sunlight}
                  </p>
                </div>

                {/* Fertilizer / Nutrients */}
                <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                      <Sprout className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h5 className="font-semibold text-gray-900 dark:text-white">Nutrition & Fertilizer</h5>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                    {prediction.fertilizer}
                  </p>
                </div>

              </div>
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-5 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-900 border flex items-center justify-center shadow-inner">
                <Sprout className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <div className="max-w-[250px]">
                <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Awaiting Input</h4>
                <p className="text-gray-400 dark:text-gray-500 text-sm leading-relaxed">
                  Fill out the questionnaire and click 'Analyze Plant' to generate a personalized AI care plan based on your Random Forest model.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiPanel;

