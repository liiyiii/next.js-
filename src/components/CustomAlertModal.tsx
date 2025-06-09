// src/components/CustomAlertModal.tsx
'use client';
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAlert } from '@/contexts/AlertContext'; // Import useAlert

interface CustomAlertModalProps {
  // message prop is no longer needed as it comes from context
  // onClose prop is no longer needed as hideAlert from context is used
  // isVisible prop is no longer needed as isAlertOpen from context is used
}

const CustomAlertModal: React.FC<CustomAlertModalProps> = () => {
  const { t } = useLanguage();
  const { isAlertOpen, alertMessage, hideAlert } = useAlert(); // Use context

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
          onClick={hideAlert} // Use hideAlert from context
        >
          {t('OK')} 
        </button>
      </div>
    </div>
  );
};

export default CustomAlertModal;
