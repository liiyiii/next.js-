// src/components/FeatureCard.jsx
'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * @param {{
 *   iconSVG: string;
 *   titleKey: string;
 *   descriptionKey: string;
 *   idPrefix?: string;
 *   featureIndex?: number;
 * }} props
 */
const FeatureCard = ({ iconSVG, titleKey, descriptionKey, idPrefix = "feature", featureIndex = 0 }) => {
  const { t } = useLanguage();

  // Default styling, can be overridden by props or a more complex setup if needed
  const bgColor = 'bg-gray-800'; // Consistent with other new sections
  const borderColor = 'border-gray-700';
  const titleColor = 'text-purple-300';
  const descriptionColor = 'text-gray-300';

  return (
    <div
      className={`p-6 rounded-xl shadow-lg border ${borderColor} ${bgColor} transform hover:scale-105 transition-transform duration-300 ease-in-out h-full flex flex-col`}
      id={`${idPrefix}-card-${featureIndex}`}
    >
      <div
        className="mb-4 text-purple-400" // Icon color can also be part of iconSVG if it contains classes
        dangerouslySetInnerHTML={{ __html: iconSVG }}
        id={`${idPrefix}-icon-${featureIndex}`}
      />
      <h3
        className={`text-xl font-semibold mb-2 ${titleColor}`}
        id={`${idPrefix}-title-${featureIndex}`}
      >
        {t(titleKey)}
      </h3>
      <p
        className={`${descriptionColor} text-sm`}
        id={`${idPrefix}-desc-${featureIndex}`}
      >
        {t(descriptionKey)}
      </p>
    </div>
  );
};

export default FeatureCard;
