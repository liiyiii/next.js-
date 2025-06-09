// src/components/FeatureCard.tsx
'use client';
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FeatureCardProps {
  iconSVG: string; 
  titleKey: string;
  descriptionKey: string;
  bgColor: string;
  borderColor: string;
  idPrefix: string; 
  featureIndex: number; 
}

const FeatureCard: React.FC<FeatureCardProps> = ({ iconSVG, titleKey, descriptionKey, bgColor, borderColor, idPrefix, featureIndex }) => {
  const { t } = useLanguage();
  return (
    <div className={`flex flex-col items-center text-center p-6 ${bgColor} rounded-xl shadow-lg border ${borderColor}`}>
      <div dangerouslySetInnerHTML={{ __html: iconSVG }} className="mb-4" />
      <h3 className="text-xl font-semibold mb-2 text-gray-100" id={`${idPrefix}-feature${featureIndex}-title`}>{t(titleKey)}</h3>
      <p className="text-gray-300" id={`${idPrefix}-feature${featureIndex}-desc`}>{t(descriptionKey)}</p>
    </div>
  );
};

export default FeatureCard;
