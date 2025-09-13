import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface VehiclePlateInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  isRequired?: boolean;
  className?: string;
}

const VehiclePlateInput: React.FC<VehiclePlateInputProps> = ({
  value,
  onChange,
  disabled = false,
  required = false,
  isRequired = false,
  className = ''
}) => {
  const { language } = useLanguage();
  
  // Parse the current value into parts
  const parseValue = (val: string) => {
    if (val === 'N/A') return { digits: ['', '', '', ''], letters: ['', '', ''] };
    
    // Remove spaces and extract digits and letters
    const clean = val.replace(/\s/g, '');
    const digits = clean.match(/\d/g) || [];
    const letters = clean.match(/[ابحدرسصطعقكلمنهـوىABJDRSXTEGKLZNHUV]/g) || [];
    
    return {
      digits: [
        digits[0] || '',
        digits[1] || '',
        digits[2] || '',
        digits[3] || ''
      ],
      letters: [
        letters[0] || '',
        letters[1] || '',
        letters[2] || ''
      ]
    };
  };

  const { digits, letters } = parseValue(value);

  const handleDigitChange = (index: number, newValue: string) => {
    if (disabled) return;
    
    // Only allow digits
    if (newValue && !/^\d$/.test(newValue)) return;
    
    const newDigits = [...digits];
    newDigits[index] = newValue;
    
    // Auto-focus next field
    if (newValue && index < 3) {
      const nextInput = document.querySelector(`input[data-digit="${index + 1}"]`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
    
    updateValue(newDigits, letters);
  };

  const handleLetterChange = (index: number, newValue: string) => {
    if (disabled) return;
    
    // Only allow valid Arabic or English letters
    if (newValue && !/^[ابحدرسصطعقكلمنهـوىABJDRSXTEGKLZNHUV]$/i.test(newValue)) return;
    
    const newLetters = [...letters];
    newLetters[index] = newValue.toUpperCase();
    
    // Auto-focus next field
    if (newValue && index < 2) {
      const nextInput = document.querySelector(`input[data-letter="${index + 1}"]`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
    
    updateValue(digits, newLetters);
  };

  const updateValue = (newDigits: string[], newLetters: string[]) => {
    const digitsStr = newDigits.join('');
    const lettersStr = newLetters.join('');
    
    if (!digitsStr && !lettersStr) {
      onChange('');
      return;
    }
    
    // Format based on language
    if (language === 'ar') {
      // Arabic format: letters first, then digits
      const formattedLetters = newLetters.filter(l => l).join(' ');
      const formattedDigits = newDigits.filter(d => d).join('');
      
      if (formattedLetters && formattedDigits) {
        onChange(`${formattedLetters} ${formattedDigits}`);
      } else if (formattedLetters) {
        onChange(formattedLetters);
      } else if (formattedDigits) {
        onChange(formattedDigits);
      } else {
        onChange('');
      }
    } else {
      // English format: digits first, then letters
      const formattedDigits = newDigits.filter(d => d).join('');
      const formattedLetters = newLetters.filter(l => l).join(' ');
      
      if (formattedDigits && formattedLetters) {
        onChange(`${formattedDigits} ${formattedLetters}`);
      } else if (formattedDigits) {
        onChange(formattedDigits);
      } else if (formattedLetters) {
        onChange(formattedLetters);
      } else {
        onChange('');
      }
    }
  };

  if (disabled) {
    return (
      <input
        type="text"
        value="N/A"
        disabled
        required={false}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 ${className}`}
      />
    );
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      {language === 'ar' ? (
        // Arabic layout: letters first, then digits
        <>
          {/* Letters */}
          {letters.map((letter, index) => (
            <input
              key={`letter-${index}`}
              type="text"
              value={letter}
              onChange={(e) => handleLetterChange(index, e.target.value)}
              className="w-12 h-10 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
              maxLength={1}
              placeholder="ح"
              required={isRequired}
            />
          ))}
          
          {/* Separator */}
          <div className="flex items-center">
            <span className="text-gray-400">-</span>
          </div>
          
          {/* Digits */}
          {digits.map((digit, index) => (
            <input
              key={`digit-${index}`}
              type="text"
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              className="w-12 h-10 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
              maxLength={1}
              placeholder="1"
              required={isRequired}
            />
          ))}
        </>
      ) : (
        // English layout: digits first, then letters
        <>
          {/* Digits */}
          {digits.map((digit, index) => (
            <input
              key={`digit-${index}`}
              data-digit={index}
              type="text"
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              className="w-12 h-10 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
              maxLength={1}
              placeholder="1"
              required={isRequired}
            />
          ))}
          
          {/* Separator */}
          <div className="flex items-center">
            <span className="text-gray-400">-</span>
          </div>
          
          {/* Letters */}
          {letters.map((letter, index) => (
            <input
              key={`letter-${index}`}
              data-letter={index}
              data-letter={index}
              type="text"
              value={letter}
              onChange={(e) => handleLetterChange(index, e.target.value)}
              className="w-12 h-10 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
              maxLength={1}
              placeholder="T"
              required={isRequired}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default VehiclePlateInput;