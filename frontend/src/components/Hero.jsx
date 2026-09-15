import React from 'react';
import { ArrowRight, Leaf, Sprout, Brain, Activity, ShieldCheck, Search, AreaChart } from 'lucide-react';

const Hero = ({ onScrollToGrid }) => {
  return (
    <div className="flex flex-col w-full">
      {/* 2. HERO */}
      <section className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-green-200/40 to-emerald-600/20 blur-3xl"></div>
        <div className="absolute top-48 -left-24 w-72 h-72 rounded-full bg-emerald-900/10 blur-3xl dark:bg-emerald-400/10"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium mb-6">
            <Leaf className="w-4 h-4" />
            <span>Intelligent Plant Parenting</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 leading-tight">
            Better care starts with <br className="hidden sm:block" />
            <span className="gradient-text">understanding your plant.</span>
          </h1>
          <p className="mt-4 text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
            Plantiq helps plant parents understand their plants, track their care, spot potential problems, and make better decisions over time.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onScrollToGrid}
              className="w-full sm:w-auto px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold text-lg shadow-xl shadow-green-900/20 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1 active:scale-95"
            >
              Start Your Garden <ArrowRight className="w-5 h-5" />
            </button>
            <a 
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-full font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
            >
              Explore How It Works
            </a>
          </div>
        </div>
      </section>

      {/* 3. VALUE STRIP */}
      <section className="py-12 border-y border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-gray-200 dark:divide-gray-800">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white mb-2">40 Plants</span>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Curated Knowledge</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Personalized</span>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Care Recommendations</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white mb-2">History</span>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Track Progress</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Guidance</span>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Context-Aware Help</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PROBLEM SECTION */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Plants can't tell you what's wrong.
        </h2>
        <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300 font-light text-left md:text-center">
          <p>Generic plant-care advice has limitations. Different plants have different needs, and the same symptom can have entirely different causes depending on the species and environment.</p>
          <p>Care requirements change as plants grow, and your previous care decisions matter. But people often forget what they tried before.</p>
          <p>Without context, diagnosing plant health is just guesswork.</p>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-gray-50 dark:bg-gray-800/30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">A structured approach to better plant parenting.</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="relative p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6 font-bold text-xl">01</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Add your plants</h3>
              <p className="text-gray-600 dark:text-gray-400">Build your personal garden.</p>
            </div>
            
            <div className="relative p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6 font-bold text-xl">02</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Tell Plantiq what you see</h3>
              <p className="text-gray-600 dark:text-gray-400">Answer relevant questions about the plant and its current condition.</p>
            </div>
            
            <div className="relative p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6 font-bold text-xl">03</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Understand what matters</h3>
              <p className="text-gray-600 dark:text-gray-400">Plantiq combines plant knowledge, your observations, and plant history to surface relevant findings and recommendations.</p>
            </div>
            
            <div className="relative p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6 font-bold text-xl">04</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Improve over time</h3>
              <p className="text-gray-600 dark:text-gray-400">Track assessments and progress so future decisions have context.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PLANT KNOWLEDGE */}
      <section id="plant-knowledge" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Plant care shouldn't be one-size-fits-all.
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Different plants have fundamentally different care requirements. Plantiq is built on a curated knowledge foundation covering exactly 40 plants across various categories, ensuring guidance is tailored to the specific species.
            </p>
            <div className="flex flex-wrap gap-3">
              {['Indoor Foliage', 'Succulents', 'Tropical & Decorative', 'Flowering', 'Herbs & Edible', 'Home & Garden'].map(cat => (
                <span key={cat} className="px-4 py-2 bg-green-50 dark:bg-gray-800 text-green-800 dark:text-green-300 rounded-full text-sm font-medium border border-green-100 dark:border-gray-700">
                  {cat}
                </span>
              ))}
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="aspect-square rounded-[3rem] bg-gradient-to-tr from-green-100 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 flex items-center justify-center border border-white/50 dark:border-gray-700/50 shadow-2xl overflow-hidden relative">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900 via-transparent to-transparent"></div>
              <Leaf className="w-32 h-32 text-green-500 opacity-80" />
            </div>
          </div>
        </div>
      </section>

      {/* 7. FEATURE GRID */}
      <section id="features" className="py-24 bg-gray-50 dark:bg-gray-800/30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Everything you need</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">Features designed for better plant parenting.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                <Sprout className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">My Garden</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Keep your plants in one place and build a persistent personal garden.</p>
            </div>

            <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Plant Profiles</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Keep each plant's important context, care information, and history together.</p>
            </div>

            <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Plant-Aware Assessments</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Answer questions focused on the plant and its current condition.</p>
            </div>

            <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Personalized Care</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Get recommendations informed by current observations and previous context.</p>
            </div>

            <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                <AreaChart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Progress</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">See how your plant's condition changes across assessments.</p>
            </div>

            <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Ask Plantiq</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Ask plant-care questions and get guidance grounded in plant knowledge.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. VISION SECTION */}
      <section id="vision" className="py-32 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-8">
          Not another plant-care checklist.
        </h2>
        <div className="space-y-6 text-xl text-gray-600 dark:text-gray-300 font-light leading-relaxed">
          <p>Plantiq is built around the relationship between you, your plants, their history, and plant knowledge.</p>
          <p>We believe in helping you make better decisions over time, turning observations into intuition, and giving every plant the attention it deserves.</p>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-green-700 dark:bg-green-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-400/30 via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-8">
            Give every plant a better chance to thrive.
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onScrollToGrid}
              className="w-full sm:w-auto px-8 py-4 bg-white text-green-800 hover:bg-gray-50 rounded-full font-bold text-lg shadow-xl transition-all transform hover:-translate-y-1 active:scale-95"
            >
              Create Your Garden
            </button>
            <button 
              onClick={() => window.history.pushState({}, '', '/login') || window.dispatchEvent(new PopStateEvent('popstate'))}
              className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white/30 text-white hover:bg-white/10 rounded-full font-bold text-lg transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="bg-white dark:bg-gray-950 py-12 border-t border-gray-100 dark:border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2">
              <Leaf className="w-6 h-6 text-green-500" />
              <span className="text-xl font-bold font-sans tracking-tight text-gray-900 dark:text-white">
                Plantiq
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center md:text-left max-w-xs">
              Better care starts with understanding your plant. Track care, spot potential problems, and make better decisions.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-gray-600 dark:text-gray-400">
            <a href="#how-it-works" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">How it works</a>
            <a href="#plant-knowledge" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Plant knowledge</a>
            <a href="#features" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Features</a>
            <button onClick={() => window.history.pushState({}, '', '/login') || window.dispatchEvent(new PopStateEvent('popstate'))} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Sign In</button>
            <button onClick={onScrollToGrid} className="hover:text-green-600 dark:hover:text-green-400 transition-colors text-green-600 dark:text-green-400">Get Started</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-100 dark:border-gray-900 text-center text-sm text-gray-400 dark:text-gray-600">
          &copy; {new Date().getFullYear()} Plantiq. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Hero;
