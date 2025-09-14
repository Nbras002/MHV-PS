import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Navigation from './Navigation';
import LanguageToggle from './LanguageToggle';

interface LayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showNavigation = true }) => {
  const { user } = useAuth();
  const { isRTL } = useLanguage();

  return (
    <div className={`min-h-screen bg-gray-50 overflow-x-hidden safe-area-padding ${isRTL ? 'font-arabic' : ''}`}>
      {showNavigation && user && <Navigation />}
      
      <main className={`${showNavigation && user ? 'pt-20 pb-20' : 'py-4'} max-w-full min-viewport-spacing`}>
        {!showNavigation && (
          <div className="flex justify-center pt-4 pb-2">
            <LanguageToggle />
          </div>
        )}
        {children}
        <footer className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-200 py-3 max-w-full safe-area-padding">
          <div className="text-center text-xs text-gray-500">
            {isRTL ? 'النظام في الإصدار التجريبي 0.1' : 'The system in Alpha version 0.1'}
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Layout;