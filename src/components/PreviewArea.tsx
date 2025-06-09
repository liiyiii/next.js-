// src/components/PreviewArea.tsx
'use client';
import React from 'react'; 
import dynamic from 'next/dynamic'; // Import dynamic
import { useLanguage } from '@/contexts/LanguageContext';
// import PdfPreviewPane from './PdfPreviewPane'; // Removed static import
import DocxPreviewPane from './DocxPreviewPane'; 
import { Download } from 'lucide-react'; 

// Dynamically import PdfPreviewPane with SSR disabled
const PdfPreviewPaneWithNoSSR = dynamic(
  () => import('./PdfPreviewPane'),
  { 
    ssr: false,
    loading: () => <div className="flex-1 p-4 border border-gray-700 rounded-md bg-gray-900 min-h-[300px] md:min-h-[400px] flex items-center justify-center text-gray-500"><p>Loading PDF Preview...</p></div>
  }
);

interface PreviewAreaProps {
  uploadedPdfFile: File | null;
  docxPreviewImageUrls: string[] | null;
  docxDownloadUrl: string | null;
  onPdfPaneClick: () => void;
  onDocxPaneClick: () => void;
  isLoading: boolean;
  conversionHasOccurred: boolean;
}

const PreviewArea: React.FC<PreviewAreaProps> = ({
  uploadedPdfFile,
  docxPreviewImageUrls,
  docxDownloadUrl,
  onPdfPaneClick,
  onDocxPaneClick,
  isLoading,
  conversionHasOccurred,
}) => {
  const { t } = useLanguage();

  const handleDownload = () => {
    if (docxDownloadUrl) {
      const link = document.createElement('a');
      link.href = docxDownloadUrl;
      // Attempt to extract filename or use a generic one
      let filename = "converted_document.docx";
      try {
        // Basic filename extraction, can be improved
        const url = new URL(docxDownloadUrl);
        const pathnameParts = url.pathname.split('/');
        const potentialFilename = pathnameParts[pathnameParts.length - 1];
        if (potentialFilename && potentialFilename.includes('.')) { // Basic check for a file extension
          filename = potentialFilename;
        }
      } catch (e) {
        console.warn("Could not parse filename from URL, using generic name.", e);
      }
      link.setAttribute('download', filename); 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const showDownloadButton = docxDownloadUrl && !isLoading && conversionHasOccurred;

  return (
    <section id="editing" className="py-20 bg-gray-900 relative"> {/* Added relative for overlay positioning */}
      <div className="container mx-auto px-4">
        {conversionHasOccurred && !isLoading && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-100" id="preview-area-title"> 
            {t('previewAreaTitle')}
          </h2>
        )}
        
        <div className="bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700 relative"> {/* Added relative for overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex flex-col items-center justify-center z-10 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2 animate-spin text-purple-400 mb-4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <p className="text-gray-300 text-xl">{t('loadingPreview')}</p>
            </div>
          )}

          {!conversionHasOccurred && !isLoading && (
            <div className="text-center text-gray-500 py-16 min-h-[400px] flex items-center justify-center"> {/* Added min-height */}
              <p className="text-xl">{t('previewAreaInitialPlaceholder')}</p>
            </div>
          )}

          {conversionHasOccurred && !isLoading && (
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <PdfPreviewPaneWithNoSSR 
                file={uploadedPdfFile} 
                onPreviewClick={onPdfPaneClick} 
                placeholderId="pdf-preview-placeholder-in-area" 
              />
              <DocxPreviewPane 
                previewImageUrls={docxPreviewImageUrls} 
                onPreviewClick={onDocxPaneClick}
                placeholderId="docx-preview-placeholder-in-area"
              />
            </div>
          )}
          
          {/* The general placeholder text from 3.html's #editing-placeholder-text is now handled by the !conversionHasOccurred block */}
          
          {showDownloadButton && (
            <div id="download-edited-container" className="text-center mt-10"> 
              <button 
                id="download-converted-docx-btn" // More specific ID
                onClick={handleDownload}
                className="btn bg-green-600 text-white px-10 py-4 rounded-lg text-xl font-semibold hover:bg-green-700 transition-colors duration-300 shadow-lg flex items-center justify-center mx-auto transform hover:scale-105"
              >
                <Download className="mr-3 w-6 h-6" />
                <span id="download-converted-docx-btn-text">{t('downloadConvertedBtn')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PreviewArea;
