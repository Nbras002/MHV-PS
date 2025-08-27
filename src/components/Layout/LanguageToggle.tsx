import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
      <Globe className="w-4 h-4 text-gray-500 mx-2" />
      <button
        onClick={() => setLanguage('ar')}
        className={`px-3 py-1 rounded text-sm font-medium transition-all ${
          language === 'ar'
            ? 'bg-purple-600 text-white'
            : 'text-gray-600 hover:text-purple-600'
        }`}
      >
        العربية
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded text-sm font-medium transition-all ${
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