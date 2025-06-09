// src/components/PricingCard.tsx
'use client';
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PricingCardProps {
  planTitleKey: string;
  planDescriptionKey: string;
  buttonTextKey: string;
  buttonId: string;
  isFeatured?: boolean;
  borderColor?: string; 
  bgColor?: string; 
  textColor?: string; 
  buttonBgColor?: string; 
  buttonTextColor?: string; 
  buttonHoverBgColor?: string; 
  idPrefix: string; 
  onClick?: () => void; // Added onClick prop
}

const PricingCard: React.FC<PricingCardProps> = ({
  planTitleKey,
  planDescriptionKey,
  buttonTextKey,
  buttonId,
  isFeatured = false,
  borderColor = 'border-gray-600',
  bgColor = 'bg-gray-700',
  textColor = 'text-gray-100',
  buttonBgColor = 'bg-gray-600',
  buttonTextColor = 'text-gray-200',
  buttonHoverBgColor = 'hover:bg-gray-500',
  idPrefix,
  onClick, // Destructure onClick
}) => {
  const { t } = useLanguage();
  const scaleClass = isFeatured ? 'transform scale-105 hover:scale-110' : 'transform hover:scale-105';

  return (
    <div className={`${bgColor} p-8 rounded-xl shadow-lg text-center border-t-4 ${borderColor} flex flex-col justify-between ${scaleClass} transition-transform duration-300`}>
      <div>
        <h3 className={`text-2xl font-bold mb-4 ${isFeatured ? 'text-white' : textColor}`} id={`${idPrefix}-title`}>{t(planTitleKey)}</h3>
        <p className={`${isFeatured ? 'text-purple-200' : 'text-gray-300'} mb-8`} id={`${idPrefix}-desc`}>{t(planDescriptionKey)}</p>
      </div>
      <button 
        className={`${buttonBgColor} ${buttonTextColor} px-8 py-3 rounded-lg text-lg font-semibold ${buttonHoverBgColor} transition-colors duration-300 shadow-md`} 
        id={buttonId}
        onClick={onClick} // Attach onClick handler
      >
        {t(buttonTextKey)}
      </button>
    </div>
  );
};

export default PricingCard;
