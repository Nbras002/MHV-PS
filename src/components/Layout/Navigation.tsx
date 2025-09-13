import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Home, Settings, BarChart3, Activity, LogOut, Globe } from 'lucide-react';

const Navigation: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { isRTL, language, setLanguage } = useLanguage();

  if (!user) return null;

  const canAccessControlPanel = user.role === 'admin';
  const canAccessStatistics = ['admin', 'manager'].includes(user.role);
  const canAccessActivityLog = ['admin', 'manager', 'security_officer'].includes(user.role);

  const handleNavigation = (path: string) => {
    const currentPath = window.location.pathname;
    if (currentPath !== path) {
      window.history.pushState(null, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-40 max-w-full">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16 overflow-x-hidden">

          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-xs">MHV</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900 hidden sm:block">
                {t('permits.title')}
              </span>
            </div>
          </div>

          <div className={`flex items-center${isRTL ? ' mr-5' : ' ml-5'}`}>
            <div className="hidden lg:flex items-center bg-white rounded-lg border border-gray-200 p-1">
              <Globe className="w-3 h-3 text-gray-500 mr-1" />
              <button
                onClick={() => setLanguage('ar')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${language === 'ar' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:text-purple-600'}`}
              >
                العربية
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${language === 'en' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:text-purple-600'}`}
              >
                English
              </button>
            </div>
            {/* Mobile Language Toggle */}
            <div className="flex lg:hidden items-center bg-gray-100 rounded-lg p-1">
              <Globe className="w-3 h-3 text-gray-500 mr-1" />
              <button
                onClick={() => setLanguage('ar')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${language === 'ar' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:text-purple-600'}`}
              >
                ع
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${language === 'en' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:text-purple-600'}`}
              >
                EN
              </button>
            </div>
          </div>

          <div className={`flex items-center space-x-2 sm:space-x-4 lg:space-x-6 ${isRTL ? 'space-x-reverse' : ''}`}>
            <button
              onClick={() => handleNavigation('/')}
              className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-purple-600 transition-colors"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base hidden sm:inline">{t('nav.home')}</span>
            </button>
            {canAccessControlPanel && (
              <button
                onClick={() => handleNavigation('/control-panel')}
                className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-purple-600 transition-colors"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base hidden sm:inline">{t('nav.controlPanel')}</span>
              </button>
            )}
            {canAccessStatistics && (
              <button
                onClick={() => handleNavigation('/statistics')}
                className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-purple-600 transition-colors"
              >
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base hidden sm:inline">{t('nav.statistics')}</span>
              </button>
            )}
            {canAccessActivityLog && (
              <button
                onClick={() => handleNavigation('/activity-log')}
                className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-purple-600 transition-colors"
              >
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base hidden sm:inline">{t('nav.activityLog')}</span>
              </button>
            )}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                <span className="font-medium">{user.firstName || user.first_name} {user.lastName || user.last_name}</span>
                <span className="block text-xs text-gray-500 hidden lg:block">{t(`roles.${user.role}`)}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base hidden sm:inline">{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;