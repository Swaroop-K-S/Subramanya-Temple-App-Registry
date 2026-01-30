/**
 * S.T.A.R. - Subramanya Temple App & Registry
 * ============================================
 * Main Application Component
 */

import { useState, useEffect } from 'react';
import { getAllSevas } from './services/api';
import {
  IndianRupee, CalendarCheck, Clock, Loader2, Sparkles,
  Home, Users, BarChart3,
  Flame, Droplets, Flower, Crown, Utensils, Calendar
} from 'lucide-react';
import BookingModal from './components/BookingModal';
import ShaswataForm from './components/ShaswataForm';
import PriestDashboard from './components/PriestDashboard';
import ReportsDashboard from './components/ReportsDashboard';

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
  const [sevas, setSevas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Navigation state: 'home', 'shaswata', 'priest', or 'reports'
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

    fetchSevas();
  }, []);

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
                <span className="text-[10px] font-semibold tracking-[0.2em] text-orange-600 uppercase mt-0.5">Tarikere</span>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={() => setActivePage('home')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activePage === 'home'
                    ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-100'
                    : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
                  }`}
              >
                <Home className="w-4 h-4" />
                <span className="hidden md:inline">Catalog</span>
              </button>

              <button
                onClick={() => setActivePage('shaswata')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activePage === 'shaswata'
                    ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-100'
                    : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
                  }`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden md:inline">Shaswata</span>
              </button>

              <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>

              <button
                onClick={() => setActivePage('priest')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activePage === 'priest'
                    ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-100'
                    : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
                  }`}
              >
                <Users className="w-4 h-4" />
                <span className="hidden md:inline">Priest</span>
              </button>

              <button
                onClick={() => setActivePage('reports')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activePage === 'reports'
                    ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-100'
                    : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
                  }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden md:inline">Reports</span>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up">

        {/* HOME PAGE - Seva Catalog */}
        {activePage === 'home' && (
          <>
            <div className="text-center mb-10">
              <h2 className="text-4xl text-gray-800 mb-3 font-heading font-bold">
                Seva Catalog
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-lg font-light">
                Select a sacred offering to manage bookings. All sevas are performed with traditional Vedic precision.
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
                <span className="ml-3 text-gray-500 text-lg font-medium">Loading sevas...</span>
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

                  return (
                    <div
                      key={seva.id}
                      onClick={() => handleSevaClick(seva)}
                      className={`relative bg-white rounded-xl border-2 ${theme.borderColor} p-5 cursor-pointer card-hover group`}
                    >
                      {/* Header: Icon & Price */}
                      <div className="flex justify-between items-start mb-4">
                        {/* Icon Box */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.bgGradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                          {theme.icon}
                        </div>

                        {/* Price Badge */}
                        <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${theme.badgeBg} ${theme.badgeText}`}>
                          {parseFloat(seva.price) > 0 ? `₹${parseFloat(seva.price).toFixed(0)}` : 'Custom'}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-800 font-heading mb-1 leading-tight line-clamp-2">
                          {seva.name_eng}
                        </h3>
                        {seva.name_kan && (
                          <p className="text-gray-500 text-sm font-medium">{seva.name_kan}</p>
                        )}
                      </div>

                      {/* Tag list */}
                      <div className="flex flex-wrap gap-2 mb-5 min-h-[1.5rem]">
                        {seva.is_shaswata && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700">
                            Shaswata
                          </span>
                        )}
                        {seva.is_slot_based && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-700">
                            Slot Based
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      <button className={`w-full py-2.5 rounded-lg text-sm font-semibold border-2 bg-transparent transition-colors ${theme.buttonBorder}`}>
                        {seva.is_shaswata ? 'Subscribe Now' : 'Book Seva'}
                      </button>
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
        )}

        {/* SHASWATA PAGE */}
        {activePage === 'shaswata' && (
          <div className="py-4">
            <ShaswataForm
              onSuccess={(result) => {
                console.log('Shaswata subscription created:', result);
              }}
            />
          </div>
        )}
      </main>

      {/* PRIEST DASHBOARD - Full Page (outside main) */}
      {activePage === 'priest' && (
        <PriestDashboard onBack={() => setActivePage('home')} />
      )}

      {/* REPORTS DASHBOARD - Full Page (outside main) */}
      {activePage === 'reports' && (
        <ReportsDashboard onBack={() => setActivePage('home')} />
      )}
    </div>
  );
}

export default App;
