// src/components/TestimonialCard.jsx
'use client';
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * @param {{
 *   testimonialId: string;
 *   textKey: string;
 *   authorKey?: string; // Optional: for author name
 *   borderColorClass: string;
 * }} props
 */
const TestimonialCard = ({ testimonialId, textKey, authorKey, borderColorClass }) => {
  const { t } = useLanguage();
  return (
    <div className={`bg-gray-700 p-8 rounded-xl shadow-lg border-l-4 ${borderColorClass} flex flex-col justify-between transform hover:scale-105 transition-transform duration-300 min-h-[200px] sm:min-h-[220px]`}>
      <p className="text-gray-300 text-lg mb-6 italic" id={testimonialId}>"{t(textKey)}"</p>
      <div className="mt-auto">
        {authorKey && (
          <p className="text-right text-purple-300 font-semibold mb-2">- {t(authorKey)}</p>
        )}
        <div className="flex items-center justify-center text-yellow-400">
          {[...Array(5)].map((_, i) => (
            <svg key={i} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star h-6 w-6"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
