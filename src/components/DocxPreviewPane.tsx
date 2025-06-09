// src/components/DocxPreviewPane.tsx
'use client';

import React, { useState } from 'react'; // useState for currentImageIndex if needed later
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image'; // Using Next.js Image component for optimization

interface DocxPreviewPaneProps {
  previewImageUrls: string[] | null;
  onPreviewClick: () => void;
  placeholderId?: string;
}

const DocxPreviewPane: React.FC<DocxPreviewPaneProps> = ({ 
  previewImageUrls, 
  onPreviewClick, 
  placeholderId 
}) => {
  const { t } = useLanguage();
  // const [currentImageIndex, setCurrentImageIndex] = useState(0); // For future pagination

  const hasImages = previewImageUrls && previewImageUrls.length > 0 && previewImageUrls[0];

  return (
    <div
      onClick={onPreviewClick}
      className="docx-preview-pane p-2 border border-gray-700 rounded-md bg-gray-900 min-h-[300px] md:min-h-[400px] flex items-center justify-center cursor-pointer overflow-hidden"
      style={{ maxWidth: '100%' }}
    >
      {hasImages ? (
        <Image
          src={previewImageUrls[0]} // Display the first image
          alt={t('docxPreviewAltText')}
          width={500} // Provide a base width, Next/Image needs this unless fill is true
          height={700} // Provide a base height
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%', 
            objectFit: 'contain', // 'contain' or 'scale-down'
            width: 'auto', // Override if you want it to scale within bounds
            height: 'auto' // Override if you want it to scale within bounds
          }}
          // Consider adding unoptimized={true} if image URLs are external and optimization is not needed/possible
          // Or configure remotePatterns in next.config.js if using external URLs often
        />
      ) : (
        <p className="text-gray-500" id={placeholderId || 'docx-preview-placeholder-default'}>
          {t('docxPreviewPlaceholder')}
        </p>
      )}
    </div>
  );
};

export default DocxPreviewPane;
