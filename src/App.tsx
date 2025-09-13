import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ControlPanelPage from './pages/ControlPanelPage';
import StatisticsPage from './pages/StatisticsPage';
import ActivityLogPage from './pages/ActivityLogPage';
import './i18n';
import './index.css';

// Auto-logout after 30 minutes of inactivity
let inactivityTimer: NodeJS.Timeout;

const resetInactivityTimer = () => {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  }, 30 * 60 * 1000); // 30 minutes
};

// Track user activity
const trackActivity = () => {
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
    document.addEventListener(event, resetInactivityTimer, true);
  });
};

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
        <span className="text-white font-bold text-sm">MHV</span>
      </div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      setError(event.error?.message || 'An unexpected error occurred');
      setHasError(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setError(event.reason?.message || 'Network or server error');
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setHasError(false);
              setError('');
              window.location.reload();
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Initialize activity tracking when user is logged in
  React.useEffect(() => {
    if (user) {
      trackActivity();
      resetInactivityTimer();
    }
    
    return () => {
      clearTimeout(inactivityTimer);
    };
  }, [user]);

  // Handle client-side routing
  React.useEffect(() => {
    // Prevent navigation to unknown routes
    const validRoutes = ['/', '/control-panel', '/statistics', '/activity-log'];
    if (user && !validRoutes.includes(location.pathname)) {
      window.history.replaceState(null, '', '/');
    }
  }, [location.pathname, user]);
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/control-panel" 
          element={
            user.role === 'admin' ? 
            <ControlPanelPage /> : 
            <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/statistics" 
          element={
            ['admin', 'manager'].includes(user.role) ? 
            <StatisticsPage /> : 
            <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/activity-log" 
          element={
            ['admin', 'manager', 'security_officer'].includes(user.role) ? 
            <ActivityLogPage /> : 
            <Navigate to="/" replace />
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize the app
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;