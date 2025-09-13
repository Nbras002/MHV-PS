export const validatePassword = (password: string): boolean => {
  const hasLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasLength && hasUppercase && hasLowercase && hasNumbers && hasSymbols;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateVehiclePlate = (plate: string): boolean => {
  // Saudi vehicle plate format: 4 digits + 3 letters
  const plateRegex = /^\d{4}[A-Z]{3}$/;
  return plateRegex.test(plate);
};

export const validatePermitNumber = (permitNumber: string): boolean => {
  // Format: 3 letters + digits (e.g., MHV0000001)
  const permitRegex = /^[A-Z]{3}\d+$/;
  return permitRegex.test(permitNumber);
};

export const formatVehiclePlate = (plate: string, isArabic: boolean): string => {
  if (plate.length !== 7) return plate;
  
  const digits = plate.substring(0, 4);
  const letters = plate.substring(4, 7);
  
  if (isArabic) {
    // If letters are in English, convert to Arabic
    let arabicLetters = letters;
    if (/[A-Z]/.test(letters)) {
      const arabicMap: { [key: string]: string } = {
        'A': 'ا', 'B': 'ب', 'J': 'ح', 'D': 'د', 'R': 'ر', 'S': 'س', 
        'X': 'ص', 'T': 'ط', 'E': 'ع', 'G': 'ق', 'K': 'ك', 'L': 'ل', 
        'Z': 'م', 'N': 'ن', 'H': 'هـ', 'U': 'و', 'V': 'ى'
      };
      arabicLetters = letters.split('').map(letter => arabicMap[letter] || letter).join('');
    }
    return digits && arabicLetters ? `${arabicLetters.split('').join(' ')} ${digits}` : plate;
  }
  // return value.slice(0, -1); // Remove last character if invalid
    // If letters are in Arabic, convert to English
    let englishLetters = letters;
    if (/[ابحدرسصطعقكلمنهـوى]/.test(letters)) {
      const englishMap: { [key: string]: string } = {
        'ا': 'A', 'ب': 'B', 'ح': 'J', 'د': 'D', 'ر': 'R', 'س': 'S',
        'ص': 'X', 'ط': 'T', 'ع': 'E', 'ق': 'G', 'ك': 'K', 'ل': 'L',
        'م': 'Z', 'ن': 'N', 'هـ': 'H', 'و': 'U', 'ى': 'V'
      };
      englishLetters = letters.split('').map(letter => englishMap[letter] || letter).join('');
    }
    return digits && englishLetters ? `${digits} ${englishLetters.split('').join(' ')}` : plate;
};

export const parseVehiclePlate = (formattedPlate: string): string => {
  const plate = formattedPlate;
  if (plate === 'N/A' || !plate) return plate;
  const arabicToEnglishMap: { [key: string]: string } = {
    'ا': 'A', 'ب': 'B', 'ح': 'J', 'د': 'D', 'ر': 'R', 'س': 'S',
    'ص': 'X', 'ط': 'T', 'ع': 'E', 'ق': 'G', 'ك': 'K', 'ل': 'L',
    'م': 'Z', 'ن': 'N', 'هـ': 'H', 'و': 'U', 'ى': 'V'
  };
  
  // Remove existing spaces
  const cleanPlate = plate.replace(/\s/g, '');
  
  // Extract digits and letters
  const digits = cleanPlate.match(/\d+/g)?.join('') || '';
  const letters = cleanPlate.match(/[ابحدرسصطعقكلمنهـوىABJDRSXTEGKLZNHUV]+/g)?.join('') || '';
  
  const englishLetters = letters.split('').map(letter => arabicToEnglishMap[letter] || letter).join('');
  
  return digits + englishLetters;
};