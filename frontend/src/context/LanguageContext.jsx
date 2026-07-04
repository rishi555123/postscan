import React, { createContext, useContext, useState } from 'react';
import en from '../locales/en.json';
import te from '../locales/te.json';
import hi from '../locales/hi.json';
import ta from '../locales/ta.json';
import kn from '../locales/kn.json';
import ml from '../locales/ml.json';
import mr from '../locales/mr.json';

const dictionaries = { en, te, hi, ta, kn, ml, mr };

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('postscan_language') || 'en';
  });

  const setLanguage = (lang) => {
    if (dictionaries[lang]) {
      setCurrentLanguage(lang);
      localStorage.setItem('postscan_language', lang);
    }
  };

  const t = (key) => {
    const dict = dictionaries[currentLanguage] || en;
    const value = dict[key] || en[key] || key;
    return value;
  };

  const value = {
    currentLanguage,
    setLanguage,
    t,
    languages: [
      { code: 'en', name: 'English' },
      { code: 'te', name: 'తెలుగు (Telugu)' },
      { code: 'hi', name: 'हिन्दी (Hindi)' },
      { code: 'ta', name: 'தமிழ் (Tamil)' },
      { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
      { code: 'ml', name: 'മലയാളം (Malayalam)' },
      { code: 'mr', name: 'मराठी (Marathi)' }
    ]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
