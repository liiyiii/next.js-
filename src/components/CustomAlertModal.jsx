// src/components/CustomAlertModal.jsx
'use client';
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAlert } from '@/contexts/AlertContext';

// No props interface needed for JS version as it takes no props.
// JSDoc could be added for clarity if desired but is minimal for this component.

const CustomAlertModal = () => {
  const { t } = useLanguage();
  const { isAlertOpen, alertMessage, hideAlert } = useAlert();

  if (!isAlertOpen) {
    return null;
  }

  return (
    <div id="custom-alert-modal" className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[10000]">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info text-blue-400 mb-4">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4"/>
          <path d="M12 8h.01"/>
        </svg>
        <p className="text-gray-200 text-lg text-center mb-6">{alertMessage}</p>
        <button 
          id="custom-alert-close-btn" 
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-300"
          onClick={hideAlert}
        >
          {t('OK')} 
        </button>
      </div>
    </div>
  );
};

export default CustomAlertModal;
