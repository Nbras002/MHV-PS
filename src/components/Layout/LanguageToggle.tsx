import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 text-xs sm:text-sm">
      <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mx-1 sm:mx-2" />
      <button
        onClick={() => setLanguage('ar')}
        className={`px-2 sm:px-3 py-1 rounded font-medium transition-all ${
          language === 'ar'
            ? 'bg-purple-600 text-white'
            : 'text-gray-600 hover:text-purple-600'
        }`}
      >
        العربية
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 sm:px-3 py-1 rounded font-medium transition-all ${
          language === 'en'
            ? 'bg-purple-600 text-white'
            : 'text-gray-600 hover:text-purple-600'
        }`}
      >
        English
      </button>
    </div>
  );
};

export default LanguageToggle;