import React, { useState, useEffect } from 'react';
import Hero from './components/Hero';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import GardenPage from './components/GardenPage';
import AssessmentPage from './components/AssessmentPage';
import AssessmentQueuePage from './components/AssessmentQueuePage';
import HistoryPage from './components/HistoryPage';
import PlantHistoryPage from './components/PlantHistoryPage';
import AuthenticatedHomePage from './components/AuthenticatedHomePage';
import AskPlantiqPage from './components/AskPlantiqPage';
import PlantProfilePage from './components/PlantProfilePage';
import { useAuth } from './context/AuthContext';
import { Moon, Sun, Leaf, Home, Grid3X3, History, MessageSquare, User, LogOut } from 'lucide-react';

function App() {
  const { user, loading, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  
  const path = window.location.pathname;
  const navigate = (nextPath) => {
    window.history.pushState({}, '', nextPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  
  const [, setLocationVersion] = useState(0);
  useEffect(() => {
    const onPopState = () => setLocationVersion((value) => value + 1);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Ensure authentication loading state is handled correctly.
  // Do not briefly render private content while /auth/me is loading.
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Define route matching logic
  const renderContent = () => {
    // PUBLIC ROUTES
    if (!user) {
      if (path === '/login') return <LoginPage onNavigate={navigate} />;
      if (path === '/register') return <RegisterPage onNavigate={navigate} />;
      // Fallback to landing page for logged out
      return <Hero onScrollToGrid={() => navigate('/register')} />;
    }

    // AUTHENTICATED ROUTES
    if (path === '/garden') return <GardenPage />;
    if (path === '/history') return <HistoryPage />;
    if (path === '/ask') return <AskPlantiqPage />;
    if (path.startsWith('/garden/') && path.endsWith('/history')) {
      const plantId = path.split('/')[2];
      return <PlantHistoryPage plantId={plantId} />;
    }
    if (path.startsWith('/garden/') && path.split('/').length === 3) {
      const plantId = path.split('/')[2];
      return <PlantProfilePage plantId={plantId} />;
    }
    if (path.startsWith('/assess/queue/')) {
      const plantIds = path.split('/')[3].split(',').filter(Boolean);
      return <AssessmentQueuePage plantIds={plantIds} />;
    }
    if (path.startsWith('/assess/')) {
      const plantId = path.split('/')[2];
      return <AssessmentPage plantId={plantId} />;
    }
    
    // Default Authenticated Home
    return <AuthenticatedHomePage />;
  };

  // NavItem helper
  const NavItem = ({ href, icon: Icon, label }) => {
    const isActive = path === href || (href !== '/' && path.startsWith(href));
    return (
      <button 
        onClick={() => navigate(href)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-all duration-200 ${
          isActive
            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/40'
            : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
        }`}
      >
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline">{label}</span>
      </button>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-32 ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Ambient floating particles */}
      <div className="floating-particles">
        <span></span><span></span><span></span>
        <span></span><span></span><span></span>
      </div>

      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => navigate('/')}
          >
            <Leaf className="w-6 h-6 text-green-500" />
            <span className="text-xl font-bold font-sans tracking-tight text-green-700 dark:text-green-400">
              Plantiq
            </span>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {user ? (
              <>
                <NavItem href="/" icon={Home} label="Home" />
                <NavItem href="/garden" icon={Grid3X3} label="My Garden" />
                <NavItem href="/history" icon={History} label="Progress" />
                <NavItem href="/ask" icon={MessageSquare} label="Ask Plantiq" />
                
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 sm:mx-2"></div>
                
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Toggle Dark Mode"
                >
                  {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-500" />}
                </button>
                
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 sm:mx-2"></div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300">
                    <User className="w-4 h-4" />
                  </div>
                  <button 
                    onClick={async () => { await logout(); navigate('/'); }} 
                    className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="hidden md:flex items-center gap-6 mr-6 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  <a href="#how-it-works" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">How it works</a>
                  <a href="#plant-knowledge" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Plant knowledge</a>
                  <a href="#features" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Features</a>
                  <a href="#vision" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">Vision</a>
                </div>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 sm:mx-2 hidden md:block"></div>
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mr-2"
                  aria-label="Toggle Dark Mode"
                >
                  {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-500" />}
                </button>
                
                {path !== '/login' && path !== '/register' && (
                  <>
                    <button 
                      onClick={() => navigate('/login')} 
                      className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={() => navigate('/register')} 
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      {path !== '/login' && path !== '/register' && (
        <main className={`w-full ${user ? 'max-w-7xl mx-auto' : ''}`}>
          {renderContent()}
        </main>
      )}
      
      {/* Full page auth forms shouldn't be wrapped in max-w-7xl typically, but they render themselves */}
      {(path === '/login' || path === '/register') && renderContent()}
      
    </div>
  );
}

export default App;
