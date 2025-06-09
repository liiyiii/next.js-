// src/components/Footer.tsx
'use client';
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { t, tFooterCopyright, tFooterCompany } = useLanguage();

  return (
    <footer id="footer" className="bg-gray-950 text-gray-500 py-12 text-center">
      <div className="container mx-auto px-4">
        <p className="mb-4 text-lg" id="footer-company">{tFooterCompany()}</p>
        <p className="mb-6" id="footer-email">{t('footerEmail')}</p>
        <div className="flex justify-center space-x-8 mb-6 text-gray-600">
          <a href="#" className="hover:text-purple-400 transition-colors duration-300" id="footer-user-agreement">{t('footerUserAgreement')}</a>
          <a href="#" className="hover:text-purple-400 transition-colors duration-300" id="footer-privacy-policy">{t('footerPrivacyPolicy')}</a>
        </div>
        <div className="flex justify-center space-x-6 text-gray-600">
          {/* Social media links can be translated if needed, or kept static */}
          <a href="#" className="hover:text-purple-400 transition-colors duration-300">
                Twitter
          </a>
          <a href="#" className="hover:text-purple-400 transition-colors duration-300">
                Facebook
          </a>
          <a href="#" className="hover:text-purple-400 transition-colors duration-300">
                Instagram
          </a>
        </div>
        <p className="mt-8 text-gray-600" id="footer-copyright">{tFooterCopyright()}</p>
      </div>
    </footer>
  );
};

export default Footer;
