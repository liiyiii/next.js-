// src/components/Header.jsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Menu, X as CloseIcon } from 'lucide-react';

const Header = () => {
  const { currentLanguage, setLanguage, t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef(null); // Removed <HTMLElement>

  const handleLanguageChange = (event) => { // Removed event type
    setLanguage(event.target.value);
    setIsMobileMenuOpen(false);
  };

  const handleSmoothScroll = (event, targetId) => { // Removed event type
    event.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      const headerOffset = headerRef.current?.offsetHeight || 0;
      const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => { // Removed event type, 'as Node' cast removed
      if (isMobileMenuOpen && headerRef.current && !headerRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Simplified navLinks for the new app
  // It might make sense to have no internal scroll links if the tool is always visible,
  // or just one link to the main tool section.
  // The 'imageTranslatorHeroCTA' key could be used if a prominent button in hero scrolls to the tool.
  // For now, let's assume the main tool is the primary focus and might not need a nav link if page is simple.
  // Or, if page.jsx has sections like "hero" and "tool", we can link to tool.
  const navLinks = [
    // Example: { id: 'image-translator-tool', key: 'imageTranslatorToolNav' }, // New key needed: "Translator Tool"
    // For an even simpler app, navLinks can be empty if Header is just for logo, lang, auth.
  ];
  // If there are no nav links, the <nav> elements can be removed or hidden.
  // For now, I'll keep the <nav> structure but it will render nothing if navLinks is empty.

  return (
    <header id="header" ref={headerRef} className="bg-gray-900 shadow-lg sticky top-0 z-50 animate-fade-in-down">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div id="logo" className="flex items-center">
          <img src="/1.png" alt={t('imageTranslatorSiteName')} className="h-8 w-12 object-contain rounded-md" />
          <span className="ml-2 text-2xl font-bold text-purple-400">{t('imageTranslatorSiteName')}</span>
        </div>

        {navLinks.length > 0 && (
          <nav className="hidden md:flex space-x-6 items-center">
            {navLinks.map(link => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => handleSmoothScroll(e, link.id)}
                className="text-gray-300 hover:text-purple-400 transition-colors duration-300"
                id={`nav-${link.id}`}
              >
                {t(link.key)}
              </a>
            ))}
          </nav>
        )}
        
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="hidden md:flex items-center space-x-4">
            {/* Login/Register buttons can remain if auth is a future feature */}
            <button className="text-gray-300 hover:text-purple-400 transition-colors duration-300" id="login-btn">{t('loginBtn')}</button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors duration-300 shadow-md" id="register-btn">{t('registerBtn')}</button>
            <select 
              className="ml-4 p-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300 bg-gray-800 text-gray-200" 
              id="language-select-desktop"
              value={currentLanguage}
              onChange={handleLanguageChange}
              aria-label={t('selectLanguage')} // Added generic selectLanguage key
            >
                <option value="zh">中文</option>
                <option value="en">English</option>
            </select>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              className="text-gray-300 hover:text-purple-400 focus:outline-none p-2"
            >
              {isMobileMenuOpen ? <CloseIcon size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div 
          id="mobile-menu" 
          className="md:hidden bg-gray-900 shadow-lg absolute top-full left-0 right-0 z-40 animate-fade-in-down"
        >
          <nav className="flex flex-col space-y-2 px-4 py-3">
            {navLinks.map(link => ( // Will be empty if navLinks is empty
              <a 
                key={`mobile-${link.id}`}
                href={`#${link.id}`} 
                onClick={(e) => handleSmoothScroll(e, link.id)} 
                className="text-gray-300 hover:text-purple-400 transition-colors duration-300 py-2 px-2 rounded-md text-base" 
                id={`mobile-nav-${link.id}`}
              >
                {t(link.key)}
              </a>
            ))}
            {navLinks.length > 0 && <hr className="border-gray-700 my-2"/>}
            <div className="flex flex-col space-y-3 px-2 pt-2 pb-3">
                <button className="text-gray-300 hover:text-purple-400 transition-colors duration-300 text-left py-2" id="mobile-login-btn">{t('loginBtn')}</button>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors duration-300 shadow-md text-left" id="mobile-register-btn">{t('registerBtn')}</button>
                 <select 
                  className="mt-2 p-2 w-full border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300 bg-gray-800 text-gray-200" 
                  id="language-select-mobile"
                  value={currentLanguage}
                  onChange={handleLanguageChange}
                  aria-label={t('selectLanguage')}
                >
                    <option value="zh">中文</option>
                    <option value="en">English</option>
                </select>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
