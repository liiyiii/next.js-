// src/components/FaqItem.tsx
'use client';
import React, { useState } from 'react'; // Import useState
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronRight } from 'lucide-react'; // Import ChevronRight icon

interface FaqItemProps {
  questionId: string;
  questionTextKey: string;
  answerId: string;
  answerTextKey: string;
}

const FaqItem: React.FC<FaqItemProps> = ({ questionId, questionTextKey, answerId, answerTextKey }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-300 group border border-gray-700">
      <h3 
        className="text-lg md:text-xl font-semibold mb-3 text-gray-100 flex justify-between items-center" 
        id={questionId}
        onClick={toggleOpen} // Make the h3 clickable
      >
        {t(questionTextKey)}
        <ChevronRight 
          className={`w-5 h-5 md:w-6 md:h-6 text-gray-400 transform transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} 
        />
      </h3>
      {isOpen && (
        <p className="text-gray-300 text-sm md:text-base" id={answerId}>
          {t(answerTextKey)}
        </p>
      )}
    </div>
  );
};

export default FaqItem;
