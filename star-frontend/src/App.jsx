/**
 * S.T.A.R. - Subramanya Temple App & Registry
 * ============================================
 * Main Application Component - React Router Edition
 */

import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from './context/I18nContext';

// Auth
import { useAuth } from './hooks/useAuth';

// Layout Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import GenesisChat from './components/GenesisChat';

// Page Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DailyTransactions from './components/DailyTransactions';
import ReportsDashboard from './components/ReportsDashboard';
import ShaswataForm from './components/ShaswataForm';
import ShaswataUnified from './components/ShaswataUnified';
import Panchangam from './components/Panchangam';
import Settings from './components/Settings';
import BookingModal from './components/BookingModal';

// ============================================================================
// Protected Route Wrapper
// ============================================================================
function ProtectedRoute({ children, requiredAccess }) {
  const { isAuthenticated, authLoading, canAccess } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredAccess && !canAccess(requiredAccess)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// ============================================================================
// App Shell (Layout + Router)
// ============================================================================
function AppShell() {
  const { user, logout } = useAuth();
  const { lang, setLang } = useTranslation();
  const navigate = useNavigate();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeva, setSelectedSeva] = useState(null);

  // [UI] Parallax Background Logic
  useEffect(() => {
    const handleScroll = () => {
      document.body.style.backgroundPositionY = `${-window.scrollY * 0.5}px`;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen transition-colors duration-500 bg-slate-50 dark:!bg-slate-950">

      {/* 1. CELESTIAL NAVBAR (Top) */}
      <Navbar lang={lang} setLang={setLang} user={user} navigate={navigate} />

      {/* 2. FLOATING SIDEBAR (Left) */}
      <Sidebar
        handleLogout={handleLogout}
        user={user}
        lang={lang}
      />

      {/* 3. MAIN CONTENT AREA */}
      <main className="pt-24 pb-12 px-4 md:pl-32 lg:pl-32 transition-all duration-300 max-w-[1600px] mx-auto">
        <Routes>
          <Route path="/dashboard" element={
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Dashboard onBack={() => { }} lang={lang} isHome={true} />
            </div>
          } />
          <Route path="/daily" element={<DailyTransactions lang={lang} />} />
          <Route path="/shaswata" element={<ShaswataForm onBack={() => navigate('/dashboard')} lang={lang} />} />
          <Route path="/reports" element={<ReportsDashboard onBack={() => navigate('/dashboard')} lang={lang} />} />
          <Route path="/dispatch" element={<ShaswataUnified onBack={() => navigate('/dashboard')} lang={lang} />} />
          <Route path="/panchangam" element={<Panchangam lang={lang} />} />
          <Route path="/settings" element={<Settings onBack={() => navigate('/dashboard')} lang={lang} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
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

      {/* DAIVA-SETU AI ENGINE */}
      <GenesisChat />
    </div>
  );
}

// ============================================================================
// Root App Component
// ============================================================================
function App() {
  const { isAuthenticated, authLoading } = useAuth();
  const { lang } = useTranslation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login lang={lang} />
      } />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
