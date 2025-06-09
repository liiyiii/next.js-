// src/contexts/LanguageContext.js
'use client'; // This directive is often needed for context providers in Next.js App Router

import React, { createContext, useState, useContext, useCallback } from 'react';
import { translations } from '@/translations'; // Using @/ for absolute import

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('zh'); // Default to Chinese

  const setLanguage = useCallback((lang) => {
    setCurrentLanguage(lang);
  }, []);

  const t = useCallback((key) => {
    // Fallback logic: current lang -> 'en' -> key itself
    return translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
  }, [currentLanguage]);

  // Special handling for footer copyright year
  const tFooterCopyright = useCallback(() => {
    const year = new Date().getFullYear();
    const companyName = t('logo'); // Get translated logo name
    const rightsReserved = translations[currentLanguage]?.footerCopyright?.split('. ')[1] || translations['en']?.footerCopyright?.split('. ')[1] || 'All rights reserved.';
    return `© ${year} ${companyName}. ${rightsReserved}`;
  }, [t, currentLanguage]);
  
  const tFooterCompany = useCallback(() => {
    const year = new Date().getFullYear();
    return (translations[currentLanguage]?.footerCompany || translations['en']?.footerCompany || "© {year} PDF Converter. All rights reserved.").replace('{year}', year);
  }, [currentLanguage]);


  const value = {
    currentLanguage,
    setLanguage,
    t,
    tFooterCopyright,
    tFooterCompany,
    translationsObject: translations // Provide the full translations object
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
