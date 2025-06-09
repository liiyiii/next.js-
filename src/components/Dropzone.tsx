// src/components/Dropzone.tsx
'use client';
import React, { useRef } from 'react'; // Added useRef
import { useLanguage } from '@/contexts/LanguageContext';

interface DropzoneProps {
  id: string; // This is the main ID for the dropzone div
  iconSVG: React.ReactNode; 
  textId: string; // ID for the "Drag & drop..." text paragraph
  subtextId: string; // ID for the "or click to browse" text paragraph
  selectedFileId: string; // ID for the paragraph that displays the selected file name
  onFileSelected: (file: File | null) => void;
  fileNameDisplay: string; // The string to display (either default or selected file name)
}

const Dropzone: React.FC<DropzoneProps> = ({ 
  id, 
  iconSVG, 
  textId, 
  subtextId, 
  selectedFileId, 
  onFileSelected,
  fileNameDisplay 
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onFileSelected(file || null);
    event.target.value = ''; // Reset file input to allow selecting the same file again
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('hover', 'border-purple-400', 'bg-gray-800');
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('hover', 'border-purple-400', 'bg-gray-800');
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('hover', 'border-purple-400', 'bg-gray-800');
    const file = event.dataTransfer.files?.[0];
    onFileSelected(file || null);
  };

  return (
    <div 
      id={id} 
      className="dropzone border-2 border-dashed border-gray-700 rounded-xl p-16 text-center cursor-pointer transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl"
      onClick={handleContainerClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        accept=".pdf" 
        style={{ display: 'none' }} 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
      />
      {iconSVG}
      {/* Conditionally display default text or selected file name */}
      {!fileNameDisplay && (
        <>
          <p className="text-gray-300 text-lg" id={textId}>{t('dropzoneText')}</p>
          <p className="text-gray-400 text-sm mt-1" id={subtextId}>{t('dropzoneSubText')}</p>
        </>
      )}
      <p className="mt-4 text-purple-400 font-semibold text-xl" id={selectedFileId}>
        {fileNameDisplay || ''} {/* Show filename or empty if no file selected (default texts shown above) */}
      </p>
    </div>
  );
};

export default Dropzone;
