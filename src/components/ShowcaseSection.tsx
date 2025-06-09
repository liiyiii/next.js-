// src/components/ShowcaseSection.tsx
'use client';
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const ShowcaseSection = () => {
  const { t } = useLanguage();

  return (
    <section id="showcase" className="py-20 bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-100" id="showcase-title">{t('showcaseTitle')}</h2>
        <p className="text-xl text-gray-300 text-center mb-16 max-w-3xl mx-auto" id="showcase-subtitle">{t('showcaseSubtitle')}</p>

        <div className="mb-20">
          <h3 className="text-2xl font-bold text-center mb-10 text-gray-100" id="showcase-digital-title">{t('showcaseDigitalTitle')}</h3>
          <div className="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-12">
            <div className="w-64 h-80 bg-gray-800 rounded-lg shadow-lg flex items-center justify-center text-gray-400 text-sm mb-4 border border-gray-700">
              <img src="https://placehold.co/256x320/374151/9CA3AF?text=Original+Digital+PDF" alt="Original Digital PDF" className="w-full h-full object-cover rounded-lg" />
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right text-purple-500 flex-shrink-0 animate-bounce-horizontal"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            <div className="w-64 h-80 bg-gray-800 rounded-lg shadow-lg flex items-center justify-center text-gray-400 text-sm mb-4 border border-gray-700">
              <img src="https://placehold.co/256x320/374151/9CA3AF?text=Converted+Digital+Word" alt="Converted Digital Word Document" className="w-full h-full object-cover rounded-lg" />
            </div>
          </div>
          <p className="text-gray-300 font-semibold mt-4 text-center" id="showcase-original-digital">{t('showcaseOriginal')}</p>
          <p className="text-gray-300 font-semibold mt-2 text-center" id="showcase-converted-digital">{t('showcaseConverted')}</p>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-center mb-10 text-gray-100" id="showcase-image-title">{t('showcaseImageTitle')}</h3>
          <div className="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-12">
            <div className="w-64 h-80 bg-gray-800 rounded-lg shadow-lg flex items-center justify-center text-gray-400 text-sm mb-4 border border-gray-700">
              <img src="https://placehold.co/256x320/374151/9CA3AF?text=Original+Image+PDF" alt="Original Image PDF" className="w-full h-full object-cover rounded-lg" />
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right text-orange-500 flex-shrink-0 animate-bounce-horizontal"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            <div className="w-64 h-80 bg-gray-800 rounded-lg shadow-lg border border-gray-700 flex items-center justify-center text-gray-400 text-sm mb-4">
              <img src="https://placehold.co/256x320/374151/9CA3AF?text=Converted+Image+Word" alt="Converted Image Word Document" className="w-full h-full object-cover rounded-lg" />
            </div>
          </div>
          <p className="text-gray-300 font-semibold mt-4 text-center" id="showcase-original-image">{t('showcaseOriginal')}</p>
          <p className="text-gray-300 font-semibold mt-2 text-center" id="showcase-converted-image">{t('showcaseConverted')}</p>
        </div>
      </div>
    </section>
  );
};

export default ShowcaseSection;
