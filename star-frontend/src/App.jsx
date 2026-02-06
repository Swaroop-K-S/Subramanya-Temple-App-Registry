/**
 * S.T.A.R. - Subramanya Temple App & Registry
 * ============================================
 * Main Application Component (Omni-UI Edition)
 */

import { useState, useEffect } from 'react';
import { TRANSLATIONS } from './components/translations';
import {
  Loader2, Flame, Flower, Home, AlertCircle
} from 'lucide-react';

// Omni-UI Components (Level 11+ Overhaul)
import BookingModal from './components/BookingModal';
import ShaswataForm from './components/ShaswataForm';
import Dashboard from './components/Dashboard';
import ReportsDashboard from './components/ReportsDashboard';
import Panchangam from './components/Panchangam';
import Settings from './components/Settings';
import Login from './components/Login';
import Sidebar from './components/Sidebar';  // [NEW] Floating Sidebar
import Navbar from './components/Navbar';    // [NEW] Celestial Navbar
import GenesisChat from './components/GenesisChat'; // [NEW] Daiva-Setu AI Interface
import PrasadamDispatch from './components/PrasadamDispatch'; // [NEW] Logistics

function App() {
  // [AUTH] Security State
  const [token, setToken] = useState(localStorage.getItem('access_token'));

  // [I18N] Language State
  const [lang, setLang] = useState('EN');
  const t = TRANSLATIONS[lang];

  // Navigation State
  const [activePage, setActivePage] = useState('home');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeva, setSelectedSeva] = useState(null);

  // Theme State (Persist Dark Mode preference if needed, handled in Navbar)

  // [UI] Parallax Background Logic
  useEffect(() => {
    const handleScroll = () => {
      document.body.style.backgroundPositionY = `${-window.scrollY * 0.5}px`;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setActivePage('home');
  };

  const handleSevaClick = (seva) => {
    if (seva.is_shaswata) {
      setActivePage('shaswata');
    } else {
      setSelectedSeva(seva);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-500 bg-slate-50 dark:!bg-slate-950">

      {/* 1. CELESTIAL NAVBAR (Top) */}
      <Navbar lang={lang} setLang={setLang} />

      {/* 2. FLOATING SIDEBAR (Left) */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        handleLogout={handleLogout}
      />

      {/* 3. MAIN CONTENT AREA (Padded for Sidebar) */}
      <main className="pt-24 pb-12 px-4 md:pl-32 lg:pl-32 transition-all duration-300 max-w-[1600px] mx-auto">

        {/* VIEW ROUTING */}

        {/* A. HOME CATALOG (Merged with Dashboard) */}
        {activePage === 'home' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Dashboard
              onBack={() => { }} // No back action needed on Home
              lang={lang}
              isHome={true}
            />
          </div>
        )}

        {/* B. OTHER PAGES */}
        {activePage === 'shaswata' && <ShaswataForm onBack={() => setActivePage('home')} />}

        {activePage === 'reports' && <ReportsDashboard onBack={() => setActivePage('home')} />}
        {activePage === 'dispatch' && <PrasadamDispatch onBack={() => setActivePage('home')} lang={lang} />}
        {activePage === 'panchangam' && <Panchangam />}
        {activePage === 'settings' && <Settings onBack={() => setActivePage('home')} />}

      </main>

      {/* GLOBAL MODALS */}
      {isModalOpen && selectedSeva && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          seva={selectedSeva}
          lang={lang}
        />
      )}

      {/* DAIVA-SETU AI ENGINE (Level 15) */}
      <GenesisChat />

    </div>
  );
}

export default App;
