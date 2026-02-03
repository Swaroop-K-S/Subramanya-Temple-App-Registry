/**
 * S.T.A.R. - Subramanya Temple App & Registry
 * ============================================
 * Main Application Component (Omni-UI Edition)
 */

import { useState, useEffect } from 'react';
import { getAllSevas } from './services/api';
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

function App() {
  // [AUTH] Security State
  const [token, setToken] = useState(localStorage.getItem('access_token'));

  // [I18N] Language State
  const [lang, setLang] = useState('EN');
  const t = TRANSLATIONS[lang];

  // Data State
  const [sevas, setSevas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Navigation State
  const [activePage, setActivePage] = useState('home');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeva, setSelectedSeva] = useState(null);

  // Theme State (Persist Dark Mode preference if needed, handled in Navbar)
  // --- LOGIC: FETCH SEVAS (Only when Home is active) ---
  useEffect(() => {
    // Only fetch if we are on home to save bandwidth
    if (activePage === 'home' && token) {
      const fetchSevas = async () => {
        try {
          setLoading(true);
          const data = await getAllSevas();
          setSevas(data);
          setError(null);
        } catch (err) {
          console.error('Failed to fetch sevas:', err);
          setError('Temple Server Unreachable. Please check connection.');
        } finally {
          setLoading(false);
        }
      };
      fetchSevas();
    }
  }, [activePage, token]);

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
    <div className="min-h-screen transition-colors duration-500 bg-slate-50 dark:bg-slate-900">

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

        {/* A. HOME CATALOG */}
        {activePage === 'home' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <header className="mb-12 text-center relative py-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-temple-saffron/20 blur-[100px] rounded-full animate-pulse pointer-events-none" />
              <h1 className="text-4xl md:text-6xl font-black text-slate-800 dark:text-amber-100 mb-6 font-heading tracking-tight">
                {t.mainTitle}
              </h1>
              <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                {t.mainSubtitle}
              </p>
            </header>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
              {loading ? (
                // Pulse Skeletons
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-96 rounded-[2rem] bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 animate-pulse relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-shine" />
                  </div>
                ))
              ) : error ? (
                <div className="col-span-full py-20 text-center">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <p className="text-red-500 font-bold text-xl">{error}</p>
                </div>
              ) : (
                sevas.map((seva) => (
                  // Using the Dashboard's Card Logic reused here or keeping simple for Catalog?
                  // Let's use a nice simple card for the catalog view since Dashboard has the heavy glass one
                  <div
                    key={seva.id}
                    onClick={() => handleSevaClick(seva)}
                    className="group relative h-[28rem] rounded-[2.5rem] overflow-hidden cursor-pointer shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl bg-white dark:bg-slate-800"
                  >
                    {/* Image */}
                    <div className="absolute inset-0 h-full w-full">
                      <img
                        src={
                          seva.name_eng.toLowerCase().includes('archana') ? "https://imgs.search.brave.com/S8D6jnYDZvtClZshgOrGtrjGfdG_bXy4NcjyU4lTLro/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbi5z/d2FoYXByb2R1Y3Rz/LmNvbS9jZG4vc2hv/cC9wcm9kdWN0cy9V/bnRpdGxlZGRlc2ln/bl8xXzE5Zjk4MWNm/LWUxZmYtNDgxYy1h/YTMxLWIxNjMwN2Iz/OTlhMC5qcGc_dj0x/NzM2NzY1OTE1Jndp/ZHRoPTgwMA" :
                            seva.name_eng.toLowerCase().includes('abhisheka') ? "https://images.unsplash.com/photo-1601056639638-cd69862283e5?q=80&w=600" :
                              "https://images.unsplash.com/photo-1623945413009-b6ffdf317457?q=80&w=600"
                        }
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={seva.name_eng}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col gap-2">
                      <h3 className="text-2xl font-black text-white font-heading leading-tight drop-shadow-lg">
                        {lang === 'KN' ? seva.name_kan : seva.name_eng}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-amber-400 font-bold text-lg">₹{seva.price}</span>
                        <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-wider border border-white/30 group-hover:bg-white group-hover:text-black transition-colors">
                          {t.bookNow}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* B. OTHER PAGES */}
        {activePage === 'shaswata' && <ShaswataForm onBack={() => setActivePage('home')} />}
        {activePage === 'dashboard' && <Dashboard onBack={() => setActivePage('home')} lang={lang} />}
        {activePage === 'reports' && <ReportsDashboard onBack={() => setActivePage('home')} />}
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
