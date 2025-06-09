// src/components/SummaryModal.tsx
'use client';
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SummaryModalProps {
  isVisible: boolean;
  onClose: () => void;
  titleId: string;
  // titleTextKey: string; // Changed to use t directly
  contentId: string;
  children?: React.ReactNode; 
}

const SummaryModal: React.FC<SummaryModalProps> = ({ 
  isVisible, 
  onClose, 
  titleId, 
  contentId, 
  children 
}) => {
  const { t } = useLanguage();

  if (!isVisible) {
    return null;
  }

  return (
    <div id="summary-modal" className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-100" id={titleId}>{t('summaryModalTitle')}</h3>
          <button id="summary-modal-close-btn" className="text-gray-400 hover:text-gray-200 transition-colors duration-200" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div id={contentId} className="text-gray-300 text-lg leading-relaxed overflow-y-auto custom-scrollbar flex-grow">
          {children || <p>{t('summaryLoading')}</p>} 
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;
