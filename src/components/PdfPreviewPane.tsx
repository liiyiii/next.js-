// src/components/PdfPreviewPane.tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'; // Removed direct import
import { useLanguage } from '@/contexts/LanguageContext'; 

interface PdfPreviewPaneProps {
  file: File | null;
  onPreviewClick: () => void;
  placeholderId?: string; 
}

const PdfPreviewPane: React.FC<PdfPreviewPaneProps> = ({ file, onPreviewClick, placeholderId }) => {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfJsLibInstance, setPdfJsLibInstance] = useState<any>(null);

  useEffect(() => {
    // Check if PDF.js library is available on the window object
    if ((window as any).pdfjsLib) {
      setPdfJsLibInstance((window as any).pdfjsLib);
    } else {
      // Optionally, you could set up a listener or a timeout to check again,
      // or rely on PdfJsWorkerConfig to have loaded it.
      // For now, if it's not there immediately, we might show an error or wait.
      // This component assumes PdfJsWorkerConfig has done its job.
      console.warn("PDF.js library not immediately available in PdfPreviewPane.");
    }
  }, []);

  useEffect(() => {
    const renderPdf = async () => {
      if (!file) {
        const canvas = canvasRef.current;
        if (canvas) {
          const context = canvas.getContext('2d');
          context?.clearRect(0, 0, canvas.width, canvas.height);
        }
        setIsLoading(false);
        setError(null);
        return;
      }

      if (!pdfJsLibInstance) {
        setError(t('errorPdfJsNotLoaded'));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      const reader = new FileReader();

      reader.onload = async (e) => {
        if (e.target?.result) {
          const arrayBuffer = e.target.result as ArrayBuffer;
          let pdfDocument: any | null = null; // Using any for PDFDocumentProxy type from global
          try {
            const loadingTask = pdfJsLibInstance.getDocument({ data: arrayBuffer });
            pdfDocument = await loadingTask.promise;
            
            if (pdfDocument.numPages > 0 && canvasRef.current) {
              const page = await pdfDocument.getPage(1); 
              const viewport = page.getViewport({ scale: 1.0 }); 

              const canvas = canvasRef.current;
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              
              const canvasContext = canvas.getContext('2d');
              if (!canvasContext) {
                throw new Error('Could not get canvas context');
              }

              const renderContext = {
                canvasContext,
                viewport: viewport,
              };
              await page.render(renderContext).promise;
              setError(null); 
            } else if (pdfDocument.numPages === 0) {
              setError(t('noDocumentToDisplay')); 
            }
          } catch (loadError: any) {
            console.error('Error loading/rendering PDF:', loadError);
            setError(loadError.message || t('errorDisplayingDocument'));
          } finally {
            setIsLoading(false);
            if (pdfDocument) { 
              pdfDocument.destroy().catch((err: any) => console.error("Error destroying PDF doc:", err));
            }
          }
        }
      };

      reader.onerror = (e) => {
        console.error('FileReader error:', e);
        setError(t('errorDisplayingDocument'));
        setIsLoading(false);
      };

      reader.readAsArrayBuffer(file);
    };

    if (pdfJsLibInstance) { // Only attempt to render if the library is loaded
      renderPdf();
    } else if (file) { // If there's a file but library not loaded yet, set loading or error
      setIsLoading(true); // Show loading until library is confirmed missing or loaded
      const checkLibTimeout = setTimeout(() => {
        if (!(window as any).pdfjsLib) {
          setError(t('errorPdfJsNotLoaded'));
          setIsLoading(false);
        } else {
          setPdfJsLibInstance((window as any).pdfjsLib); // Trigger re-render
        }
      }, 2000); // Wait 2s for library to potentially load
      return () => clearTimeout(checkLibTimeout);
    }
  }, [file, t, pdfJsLibInstance]); 

  return (
    <div 
      onClick={onPreviewClick} 
      className="pdf-preview-pane p-2 border border-gray-700 rounded-md bg-gray-900 min-h-[300px] md:min-h-[400px] flex items-center justify-center cursor-pointer overflow-hidden h-full"
      style={{ maxWidth: '100%' }} 
    >
      <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', height: '100%' }}></canvas>
      {!file && !isLoading && !error && (
        <p className="text-gray-500" id={placeholderId || 'pdf-preview-placeholder-default'}>
          {t('editingPlaceholder')} 
        </p>
      )}
      {isLoading && (
        <div className="flex flex-col items-center justify-center text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2 animate-spin text-purple-400 mb-2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          {t('loadingPreview')} 
        </div>
      )}
      {error && !isLoading && (
         <p className="text-red-500">{error}</p>
      )}
    </div>
  );
};

export default PdfPreviewPane;
