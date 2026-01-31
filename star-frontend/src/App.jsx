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
import Login from './components/Login';         // [AUTH] Import Login
import { LogOut } from 'lucide-react';          // [AUTH] Import Logout Icon

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
                <div className="absolute inset-0 bg-orange-400 blur-sm rounded-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative p-2 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg text-white shadow-sm">
                  <Flower className="w-6 h-6 animate-[spin_10s_linear_infinite_paused] group-hover:animate-[spin_10s_linear_infinite]" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold font-heading text-gray-900 leading-none">S.T.A.R.</span>
                <span className="text-[10px] font-semibold tracking-[0.2em] text-orange-600 uppercase mt-0.5">{t.appSubtitle}</span>
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
                <Languages className="w-4 h-4" />
                <span>{lang === 'EN' ? 'ಕನ್ನಡ' : 'ENGLISH'}</span>
              </button>

              <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>

              {/* Navigation Buttons Row */}
              <div className="flex bg-gray-100/50 rounded-lg p-1 border border-gray-200 backdrop-blur-sm mr-2">
                <button
                  onClick={() => setActivePage('home')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activePage === 'home' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <Home size={14} /> {t.catalog}
                </button>
                <button
                  onClick={() => setActivePage('dashboard')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activePage === 'dashboard' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <Users size={14} /> {t.dashboard}
                </button>
                <button
                  onClick={() => setActivePage('reports')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activePage === 'reports' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <BarChart3 size={14} /> {t.reports}
                </button>
              </div>

              {/* [AUTH] Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">{t.logout}</span>
              </button>
            </div>

          </div>
        </div>
      </nav >

      {/* Main Content */}
      < main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up" >

        {/* HOME PAGE - Seva Catalog */}
        {
          activePage === 'home' && (
            <>
              <div className="text-center mb-10">
                <h2 className="text-4xl text-gray-800 mb-3 font-heading font-bold">
                  {t.appTitle}
                </h2>
                <p className="text-gray-500 max-w-2xl mx-auto text-lg font-light">
                  {lang === 'EN' ? 'Select a sacred offering to manage bookings. All sevas are performed with traditional Vedic precision.' : 'ಬುಕಿಂಗ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸಲು ಪವಿತ್ರ ಸೇವೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.'}
                </p>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
                  <span className="ml-3 text-gray-500 text-lg font-medium">{t.loading}</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center max-w-md mx-auto shadow-sm">
                  <p className="font-semibold">{error}</p>
                  <p className="text-sm mt-2 opacity-80">Make sure the backend server is running</p>
                </div>
              )}

              {/* Seva Grid */}
              {!loading && !error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sevas.map((seva) => {
                    const theme = getSevaTheme(seva.name_eng);
                    const bgImage = getSevaImage(seva.name_eng);

                    return (
                      <div
                        key={seva.id}
                        onClick={() => handleSevaClick(seva)}
                        className="relative h-64 rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-2xl transition-all duration-500"
                      >
                        {/* Background Image with Zoom Effect */}
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          style={{ backgroundImage: `url(${bgImage})` }}
                        />

                        {/* Dark Overlay for Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 group-hover:opacity-90 transition-opacity duration-300" />

                        {/* Content Container */}
                        <div className="relative z-10 h-full p-5 flex flex-col justify-between">

                          {/* Top Row: Price Badge */}
                          <div className="flex justify-end">
                            <div className="backdrop-blur-md bg-white/20 border border-white/30 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase shadow-sm">
                              {parseFloat(seva.price) > 0 ? `₹${parseFloat(seva.price).toFixed(0)}` : 'Custom'}
                            </div>
                          </div>

                          {/* Bottom Row: Info & Action */}
                          <div>
                            {/* Tags */}
                            <div className="flex gap-2 mb-2">
                              {seva.is_shaswata && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-violet-500/80 text-white backdrop-blur-sm">Shaswata</span>
                              )}
                              {seva.is_slot_based && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/80 text-white backdrop-blur-sm">Slot Based</span>
                              )}
                            </div>

                            <h3 className="text-xl font-bold text-white font-heading mb-1 leading-tight drop-shadow-md group-hover:text-orange-200 transition-colors">
                              {lang === 'KN' && seva.name_kan ? seva.name_kan : seva.name_eng}
                            </h3>

                            {/* Action Button (Hidden by default, slides up or just stays visible) */}
                            <button className={`w-full py-2 rounded-lg text-sm font-bold bg-white/10 backdrop-blur-md border border-white/40 text-white hover:bg-white hover:text-orange-600 transition-all`}>
                              {seva.is_shaswata ? t.subscribeNow : t.bookNow}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer Info */}
              {!loading && !error && sevas.length > 0 && (
                <div className="text-center mt-16 pb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-500 text-xs font-medium uppercase tracking-widest">
                    <Sparkles className="w-3 h-3" />
                    <span>{sevas.length} Sevas Available</span>
                    <Sparkles className="w-3 h-3" />
                  </div>
                </div>
              )}
            </>
          )
        }

        {/* Removed ShaswataForm from here - moved outside main */}
      </main >

      {/* CLERK DASHBOARD - Full Page (outside main) */}
      {
        activePage === 'dashboard' && (
          <Dashboard onBack={() => setActivePage('home')} lang={lang} />
        )
      }

      {/* REPORTS DASHBOARD - Full Page (outside main) */}
      {
        activePage === 'reports' && (
          <ReportsDashboard onBack={() => setActivePage('home')} lang={lang} />
        )
      }

      {/* GLOBAL MODALS */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        seva={selectedSeva}
        lang={lang}
      />

      {/* SHASWATA FORM MODAL */}
      <ShaswataForm
        isOpen={activePage === 'shaswata'}
        onClose={() => setActivePage('home')}
        lang={lang}
      />
    </div >
  );
}

export default App;
