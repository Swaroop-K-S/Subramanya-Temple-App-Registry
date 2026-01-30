/**
 * S.T.A.R. - Subramanya Temple App & Registry
 * ============================================
 * Main Application Component
 */

import { useState, useEffect } from 'react';
import { getAllSevas } from './services/api';
import { Flower2, IndianRupee, CalendarCheck, Clock, Loader2, Sparkles, Home, Users, BarChart3 } from 'lucide-react';
import BookingModal from './components/BookingModal';
import ShaswataForm from './components/ShaswataForm';
import PriestDashboard from './components/PriestDashboard';
import ReportsDashboard from './components/ReportsDashboard';

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <Flower2 className="w-10 h-10 text-yellow-200" />
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-wide">S.T.A.R.</h1>
              <p className="text-orange-100 text-sm">Subramanya Temple App & Registry - Tarikere</p>
            </div>
            <Flower2 className="w-10 h-10 text-yellow-200" />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActivePage('home')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all border-b-2 ${activePage === 'home'
                ? 'text-orange-600 border-orange-500 bg-orange-50'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Home className="w-4 h-4" />
              Seva Catalog
            </button>
            <button
              onClick={() => setActivePage('shaswata')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all border-b-2 ${activePage === 'shaswata'
                ? 'text-purple-600 border-purple-500 bg-purple-50'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Sparkles className="w-4 h-4" />
              Shaswata Puje
            </button>
            <button
              onClick={() => setActivePage('priest')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all border-b-2 ${activePage === 'priest'
                ? 'text-indigo-600 border-indigo-500 bg-indigo-50'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Users className="w-4 h-4" />
              Priest View
            </button>
            <button
              onClick={() => setActivePage('reports')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all border-b-2 ${activePage === 'reports'
                ? 'text-emerald-600 border-emerald-500 bg-emerald-50'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <BarChart3 className="w-4 h-4" />
              Reports
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* HOME PAGE - Seva Catalog */}
        {activePage === 'home' && (
          <>
            <h2 className="text-2xl font-semibold text-orange-800 mb-2 text-center">
              🙏 Seva Catalog
            </h2>
            <p className="text-center text-gray-500 mb-6">Click on a seva card to book</p>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                <span className="ml-3 text-orange-600 text-lg">Loading sevas...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg text-center">
                <p className="font-medium">{error}</p>
                <p className="text-sm mt-2">Make sure the backend server is running at http://127.0.0.1:8000</p>
              </div>
            )}

            {/* Seva Grid */}
            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sevas.map((seva) => (
                  <div
                    key={seva.id}
                    onClick={() => handleSevaClick(seva)}
                    className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border hover:-translate-y-1 cursor-pointer ${seva.is_shaswata
                      ? 'border-purple-200 hover:border-purple-400'
                      : 'border-orange-100 hover:border-orange-300'
                      }`}
                  >
                    {/* Card Header */}
                    <div className={`px-4 py-3 ${seva.is_shaswata
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500'
                      }`}>
                      <h3 className="text-white font-semibold text-lg truncate">
                        {seva.name_eng}
                      </h3>
                      {seva.name_kan && (
                        <p className="text-white/80 text-sm">{seva.name_kan}</p>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      {/* Price */}
                      <div className="flex items-center gap-2 text-gray-700">
                        <IndianRupee className="w-5 h-5 text-green-600" />
                        <span className="text-xl font-bold text-green-700">
                          {parseFloat(seva.price) > 0 ? `₹${parseFloat(seva.price).toFixed(0)}` : 'Variable'}
                        </span>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        {seva.is_shaswata && (
                          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                            <CalendarCheck className="w-3 h-3" />
                            Shashwata
                          </span>
                        )}
                        {seva.is_slot_based && (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                            <Clock className="w-3 h-3" />
                            Slot Based
                          </span>
                        )}
                        {seva.daily_limit && (
                          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">
                            Limit: {seva.daily_limit}/day
                          </span>
                        )}
                      </div>

                      {/* Book Now Button */}
                      <button className={`w-full mt-2 py-2 font-medium rounded-lg transition-colors ${seva.is_shaswata
                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        }`}>
                        {seva.is_shaswata ? '✨ Subscribe' : '📝 Book Now'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer Info */}
            {!loading && !error && sevas.length > 0 && (
              <p className="text-center text-gray-500 mt-8">
                Total Sevas: <span className="font-semibold text-orange-600">{sevas.length}</span>
              </p>
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

      {/* Footer - Hide on priest and reports pages */}
      {!['priest', 'reports'].includes(activePage) && (
        <footer className="bg-orange-800 text-orange-100 text-center py-4 mt-auto">
          <p className="text-sm">© 2026 Sri Subramanya Temple, Tarikere | S.T.A.R. v1.0</p>
        </footer>
      )}

      {/* Booking Modal (for regular sevas) */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        seva={selectedSeva}
      />
    </div>
  );
}

export default App;
