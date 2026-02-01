/**
 * S.T.A.R. - Subramanya Temple App & Registry
 * ============================================
 * Main Application Component
 */

import { useState, useEffect } from 'react';
import { getAllSevas } from './services/api';
import { TRANSLATIONS } from './components/translations'; // [1] Import Translations
import {
  IndianRupee, CalendarCheck, Clock, Loader2, Sparkles,
  Home, Users, BarChart3, Languages, // Added Languages Icon
  Flame, Droplets, Flower, Crown, Utensils, Calendar
} from 'lucide-react';
import BookingModal from './components/BookingModal';
import ShaswataForm from './components/ShaswataForm';
import Dashboard from './components/Dashboard';
import ReportsDashboard from './components/ReportsDashboard';
import Panchangam from './components/Panchangam'; // [NEW] Import Panchangam
import Settings from './components/Settings';   // [SETTINGS] Import Settings
import Login from './components/Login';         // [AUTH] Import Login
import { LogOut, Settings as SettingsIcon } from 'lucide-react'; // [AUTH] Import Logout Icon + Settings Icon

// Image Mappings for Seva Cards
const SEVA_IMAGES = {
  "archane": "https://imgs.search.brave.com/S8D6jnYDZvtClZshgOrGtrjGfdG_bXy4NcjyU4lTLro/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbi5z/d2FoYXByb2R1Y3Rz/LmNvbS9jZG4vc2hv/cC9wcm9kdWN0cy9V/bnRpdGxlZGRlc2ln/bl8xXzE5Zjk4MWNm/LWUxZmYtNDgxYy1h/YTMxLWIxNjMwN2Iz/OTlhMC5qcGc_dj0x/NzM2NzY1OTE1Jndp/ZHRoPTgwMA",      // Red Turmeric/Kumkum (User Provided)
  "panchamrutha": "/panchamrutha.jpeg", // Local Image (User Provided)
  "abhisheka": "https://images.unsplash.com/photo-1601056639638-cd69862283e5?q=80&w=600",    // Milk/Abhisheka
  "alankara": "https://images.unsplash.com/photo-1623838466185-3c126d459648?q=80&w=600",     // Flowers/Decoration
  "anna": "https://images.unsplash.com/photo-1595955545772-50d4f1863695?q=80&w=600",         // Food/Rice
  "shaswata": "https://images.unsplash.com/photo-1510255393664-9a840e4f3a9e?q=80&w=600",     // Lamp/Diya
  "default": "https://images.unsplash.com/photo-1623945413009-b6ffdf317457?q=80&w=600"       // Temple Texture
};

const getSevaImage = (sevaName) => {
  const name = (sevaName || '').toLowerCase();
  if (name.includes('kumkum') || name.includes('archane')) return SEVA_IMAGES.archane;
  if (name.includes('pancha') || name.includes('abhisheka')) return SEVA_IMAGES.panchamrutha;
  if (name.includes('alankara') || name.includes('pushpa')) return SEVA_IMAGES.alankara;
  if (name.includes('anna') || name.includes('prasada')) return SEVA_IMAGES.anna;
  if (name.includes('shaswata')) return SEVA_IMAGES.shaswata;
  return SEVA_IMAGES.default;
};

// Helper to determine Seva Theme based on name
const getSevaTheme = (sevaName) => {
  const name = sevaName.toLowerCase();

  // Fire / Homa / Archane -> Orange/Red
  if (name.includes('archane') || name.includes('homa') || name.includes('mangalarathi')) {
    return {
      borderColor: 'border-orange-200',
      bgGradient: 'from-orange-500 to-red-500',
      iconColor: 'text-orange-600',
      badgeBg: 'bg-orange-50',
      badgeText: 'text-orange-700',
      buttonBorder: 'border-orange-200 hover:bg-orange-50 text-orange-700',
      icon: <Flame className="w-6 h-6 text-white" />
    };
  }

  // Water / Abhisheka -> Blue/Cyan
  if (name.includes('abhisheka') || name.includes('theertha')) {
    return {
      borderColor: 'border-blue-200',
      bgGradient: 'from-blue-500 to-cyan-500',
      iconColor: 'text-blue-600',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      buttonBorder: 'border-blue-200 hover:bg-blue-50 text-blue-700',
      icon: <Droplets className="w-6 h-6 text-white" />
    };
  }

  // Flower / Alankara -> Pink/Rose
  if (name.includes('alankara') || name.includes('pushpa')) {
    return {
      borderColor: 'border-pink-200',
      bgGradient: 'from-pink-500 to-rose-500',
      iconColor: 'text-pink-600',
      badgeBg: 'bg-pink-50',
      badgeText: 'text-pink-700',
      buttonBorder: 'border-pink-200 hover:bg-pink-50 text-pink-700',
      icon: <Flower className="w-6 h-6 text-white" />
    };
  }

  // Food / Anna -> Amber/Yellow
  if (name.includes('anna') || name.includes('prasada')) {
    return {
      borderColor: 'border-amber-200',
      bgGradient: 'from-amber-500 to-yellow-500',
      iconColor: 'text-amber-600',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      buttonBorder: 'border-amber-200 hover:bg-amber-50 text-amber-700',
      icon: <Utensils className="w-6 h-6 text-white" />
    };
  }

  // Shaswata / Special -> Violet/Purple
  if (name.includes('shaswata') || name.includes('subscription')) {
    return {
      borderColor: 'border-violet-200',
      bgGradient: 'from-violet-500 to-purple-500',
      iconColor: 'text-violet-600',
      badgeBg: 'bg-violet-50',
      badgeText: 'text-violet-700',
      buttonBorder: 'border-violet-200 hover:bg-violet-50 text-violet-700',
      icon: <Calendar className="w-6 h-6 text-white" />
    };
  }

  // Royal / Mahapooja -> Indigo
  if (name.includes('mahapooja') || name.includes('sarva') || name.includes('kalyana')) {
    return {
      borderColor: 'border-indigo-200',
      bgGradient: 'from-indigo-500 to-blue-600',
      iconColor: 'text-indigo-600',
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-700',
      buttonBorder: 'border-indigo-200 hover:bg-indigo-50 text-indigo-700',
      icon: <Crown className="w-6 h-6 text-white" />
    };
  }

  // Default -> Emerald
  return {
    borderColor: 'border-emerald-200',
    bgGradient: 'from-emerald-500 to-teal-500',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    buttonBorder: 'border-emerald-200 hover:bg-emerald-50 text-emerald-700',
    icon: <Sparkles className="w-6 h-6 text-white" />
  };
};

function App() {
  // [AUTH] Security State
  const [token, setToken] = useState(localStorage.getItem('access_token'));

  // [I18N] Language State
  const [lang, setLang] = useState('EN'); // Default English
  const t = TRANSLATIONS[lang]; // Shortcut for current translation

  const [sevas, setSevas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Navigation state: 'home', 'shaswata', 'dashboard', or 'reports'
  const [activePage, setActivePage] = useState('home');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeva, setSelectedSeva] = useState(null);

  // Fetch sevas on component mount
  useEffect(() => {
    const fetchSevas = async () => {
      try {
        setLoading(true);
        const data = await getAllSevas();
        setSevas(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch sevas:', err);
        setError('Failed to connect to server. Please ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSevas();
    }
  }, [token]);

  // [UI] Parallax Background Effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      // Speed 0.9: Moves background almost at same speed as content to show full height
      // Offset 0px: Starts at top
      document.body.style.backgroundPositionY = `${0 - scrollPosition * 0.9}px`;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // [AUTH] Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setActivePage('home'); // Reset view
  };

  // [AUTH] Route Protection: If no token, show Login Page
  if (!token) {
    return <Login setToken={setToken} />;
  }

  // Handle seva card click - open booking modal for regular sevas
  // or navigate to shaswata page for shaswata sevas
  const handleSevaClick = (seva) => {
    if (seva.is_shaswata) {
      setActivePage('shaswata');
    } else {
      setSelectedSeva(seva);
      setIsModalOpen(true);
    }
  };

  // Close the booking modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSeva(null);
  };

  return (
    <div className="min-h-screen pb-12">

      {/* FINAL GLASSMORPHISM NAV BAR */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/80 border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-3">

            {/* Logo Section */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActivePage('home')}>
              <div className="relative">
                <div className="absolute inset-0 bg-temple-saffron blur-sm rounded-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative p-2 bg-gradient-to-br from-temple-saffron to-temple-gold rounded-lg text-white shadow-sm">
                  <Flower className="w-6 h-6 animate-[spin_10s_linear_infinite_paused] group-hover:animate-[spin_10s_linear_infinite]" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold font-heading text-temple-brown leading-none">S.T.A.R.</span>
                <span className="text-temple-saffron-dark text-[10px] font-bold tracking-[0.2em] uppercase">Temple Registry</span>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center gap-1 md:gap-2">

              {/* [I18N] Language Toggle */}
              <button
                onClick={() => setLang(lang === 'EN' ? 'KN' : 'EN')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 hover:bg-gray-50 transition-colors mr-2 text-gray-600"
                title="Switch Language"
              >
                <Languages size={14} />
                {lang === 'EN' ? 'KN' : 'EN'}
              </button>

              {/* Home / Catalog Tab */}
              <button
                onClick={() => setActivePage('home')}
                className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${activePage === 'home'
                  ? 'text-temple-saffron bg-temple-saffron/10 shadow-sm ring-1 ring-temple-saffron/20'
                  : 'text-gray-500 hover:text-temple-brown hover:bg-gray-50'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <Home size={18} />
                  <span className="hidden md:inline">{t.catalog}</span>
                </span>
                {activePage === 'home' && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-temple-saffron rounded-full mb-1" />
                )}
              </button>

              {/* [NEW] Panchangam / Almanac Tab */}
              <button
                onClick={() => setActivePage('panchangam')}
                className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${activePage === 'panchangam'
                  ? 'text-temple-saffron bg-temple-saffron/10 shadow-sm ring-1 ring-temple-saffron/20'
                  : 'text-gray-500 hover:text-temple-brown hover:bg-gray-50'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <Calendar size={18} />
                  <span className="hidden md:inline">Panchangam</span>
                </span>
                {activePage === 'panchangam' && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-temple-saffron rounded-full mb-1" />
                )}
              </button>

              {/* Dashboard Tab */}
              <button
                onClick={() => setActivePage('dashboard')}
                className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${activePage === 'dashboard'
                  ? 'text-temple-saffron bg-temple-saffron/10 shadow-sm ring-1 ring-temple-saffron/20'
                  : 'text-gray-500 hover:text-temple-brown hover:bg-gray-50'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <BarChart3 size={18} />
                  <span className="hidden md:inline">{t.dashboard}</span>
                </span>
                {activePage === 'dashboard' && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-temple-saffron rounded-full mb-1" />
                )}
              </button>

              {/* Reports Dropdown/Tab */}
              <button
                onClick={() => setActivePage('reports')}
                className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${activePage === 'reports'
                  ? 'text-temple-saffron bg-temple-saffron/10 shadow-sm ring-1 ring-temple-saffron/20'
                  : 'text-gray-500 hover:text-temple-brown hover:bg-gray-50'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <IndianRupee size={18} />
                  <span className="hidden md:inline">{t.reports}</span>
                </span>
                {activePage === 'reports' && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-temple-saffron rounded-full mb-1" />
                )}
              </button>

              {/* Settings Tab */}
              <button
                onClick={() => setActivePage('settings')}
                className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${activePage === 'settings'
                  ? 'text-temple-saffron bg-temple-saffron/10 shadow-sm ring-1 ring-temple-saffron/20'
                  : 'text-gray-500 hover:text-temple-brown hover:bg-gray-50'
                  }`}
                title="Settings"
              >
                <span className="flex items-center gap-2">
                  <SettingsIcon size={18} />
                  <span className="hidden lg:inline">{t.settings}</span>
                </span>
                {activePage === 'settings' && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-temple-saffron rounded-full mb-1" />
                )}
              </button>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activePage === 'home' && (
          <>
            {/* Header Section */}
            <header className="mb-12 text-center relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-temple-saffron blur-[100px] opacity-20 -z-10 rounded-full animate-pulse" />
              <h1 className="text-4xl md:text-5xl font-black text-temple-brown mb-4 font-heading drop-shadow-sm tracking-tight">
                {t.mainTitle}
              </h1>
              <p className="text-lg text-temple-stone max-w-2xl mx-auto font-medium leading-relaxed">
                {t.mainSubtitle}
              </p>
            </header>

            {/* Seva Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                <div className="col-span-full flex flex-col justify-center items-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 text-temple-saffron animate-spin" />
                  <p className="text-temple-stone font-bold animate-pulse">Connecting to Temple Sanctum...</p>
                </div>
              ) : error ? (
                <div className="col-span-full text-center py-20">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
                    <Flame className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-red-500 font-bold text-lg mb-2">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-2 bg-white border border-gray-200 shadow-sm rounded-lg hover:bg-gray-50 font-bold text-gray-600 transition-all"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                sevas.map((seva) => {
                  const theme = getSevaTheme(seva.name_eng);
                  const bgImage = getSevaImage(seva.name_eng);

                  return (
                    <div
                      key={seva.id}
                      onClick={() => handleSevaClick(seva)}
                      className="relative h-96 rounded-2xl overflow-hidden cursor-pointer group shadow-2xl transition-all duration-500 hover:shadow-orange-500/20"
                    >
                      {/* 1. Full-Height Background Image (Cover) */}
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                        style={{ backgroundImage: `url(${bgImage})` }}
                      />

                      {/* 2. Readability Layer: Gradient Overlay (Bottom 50%) */}
                      <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

                      {/* 3. Price Tag: Glassmorphism Pill (Top Right) */}
                      <div className="absolute top-4 right-4 z-20">
                        <div className="backdrop-blur-md bg-black/40 border border-white/20 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg tracking-wide">
                          {parseFloat(seva.price) > 0 ? `₹${parseFloat(seva.price).toFixed(0)}` : 'Custom'}
                        </div>
                      </div>

                      {/* Tags (Top Left) */}
                      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                        {seva.is_shaswata && (
                          <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase bg-violet-600/90 text-white shadow-lg backdrop-blur-sm border border-violet-400/30">Shaswata</span>
                        )}
                        {seva.is_slot_based && (
                          <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase bg-blue-600/90 text-white shadow-lg backdrop-blur-sm border border-blue-400/30">Slot</span>
                        )}
                      </div>


                      {/* 4. Content Container (Bottom Aligned) */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex flex-col gap-4">

                        {/* Title: Bottom-Left, White, Bold Serif */}
                        <h3 className="text-2xl font-bold text-white font-heading leading-tight drop-shadow-md">
                          {lang === 'KN' && seva.name_kan ? seva.name_kan : seva.name_eng}
                        </h3>

                        {/* Book Now Button - Actions */}
                        <button className="w-full mb-4 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wide bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/50 hover:scale-105 active:scale-95 transition-all duration-300">
                          {seva.is_shaswata ? t.subscribeNow : t.bookNow}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* View Routing */}
        {activePage === 'shaswata' && <ShaswataForm onBack={() => setActivePage('home')} />}
        {activePage === 'dashboard' && <Dashboard onBack={() => setActivePage('home')} lang={lang} />}
        {activePage === 'reports' && <ReportsDashboard onBack={() => setActivePage('home')} />}
        {activePage === 'panchangam' && <Panchangam />}
        {activePage === 'settings' && <Settings onBack={() => setActivePage('home')} />}
      </main>

      {/* Booking Modal */}
      {isModalOpen && selectedSeva && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          seva={selectedSeva}
          lang={lang}
        />
      )}
    </div>
  );
}

export default App;
