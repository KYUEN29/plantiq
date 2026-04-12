import React from 'react';
import { Activity, BellRing, ChevronUp, Droplet } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold font-sans text-gray-900 dark:text-white">Health Overview</h3>
            <select className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm rounded-lg px-3 py-1 outline-none">
              <span className="sr-only">Time frame</span>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2 overflow-hidden px-2">
            {/* Mock Chart Bars */}
            {[45, 60, 55, 75, 80, 70, 95].map((val, i) => (
              <div key={i} className="w-full flex flex-col items-center gap-2 group cursor-pointer">
                <div 
                  className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-[#1f4037]/20 to-[#99f2c8] group-hover:to-[#61dca4] transition-all relative"
                  style={{ height: `${val}%` }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded font-medium transition-opacity">
                    {val}
                  </div>
                </div>
                <span className="text-xs text-gray-500 font-medium">Day {i+1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-blue-500">
              <Droplet className="w-6 h-6" />
            </div>
            <h4 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Watering Efficiency</h4>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">92%</span>
              <span className="flex items-center text-sm font-semibold text-green-500 mb-1">
                <ChevronUp className="w-4 h-4" /> 4%
              </span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-4 text-green-500">
              <Activity className="w-6 h-6" />
            </div>
            <h4 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Avg Plant Health</h4>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">88/100</span>
              <span className="flex items-center text-sm font-semibold text-green-500 mb-1">
                <ChevronUp className="w-4 h-4" /> 2 pts
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#1f4037] text-white rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold">AI Alerts</h3>
          <BellRing className="w-5 h-5 text-[#99f2c8]" />
        </div>
        
        <div className="space-y-4">
          {[
            { tag: 'Monstera', msg: 'Water level critically low.', type: 'urgent' },
            { tag: 'Peace Lily', msg: 'Increased humidity needed.', type: 'warning' },
            { tag: 'Snake Plant', msg: 'Perfect conditions maintained.', type: 'success' }
          ].map((alert, i) => (
            <div key={i} className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/5">
              <span className={`text-xs font-bold uppercase tracking-wider mb-2 inline-block px-2 py-0.5 rounded ${
                alert.type === 'urgent' ? 'bg-red-500/20 text-red-300' :
                alert.type === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-green-500/20 text-green-300'
              }`}>
                {alert.tag}
              </span>
              <p className="text-sm text-gray-200">{alert.msg}</p>
            </div>
          ))}
        </div>

        <button className="w-full mt-8 py-3 bg-[#99f2c8] hover:bg-[#8ae0ab] text-[#1f4037] font-bold rounded-xl transition-colors">
          View All Logs
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
