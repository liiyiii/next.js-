// src/components/FullScreenPreviewModal.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'; // Removed direct import
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X as CloseIcon, Loader2 } from 'lucide-react';

export interface FullScreenPreviewModalProps { 
  isOpen: boolean;
  onClose: () => void;
  documentType: 'pdf' | 'docx' | null;
  pdfFile: File | null;
  docxImageUrls: string[] | null;
  initialPage?: number;
}

const FullScreenPreviewModal: React.FC<FullScreenPreviewModalProps> = ({
  isOpen,
  onClose,
  documentType,
  pdfFile,
  docxImageUrls,
  initialPage = 1,
}) => {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [numPages, setNumPages] = useState<number>(0);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null); // Using any for PDFDocumentProxy
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfJsLibInstance, setPdfJsLibInstance] = useState<any>(null);

  useEffect(() => {
    if ((window as any).pdfjsLib) {
      setPdfJsLibInstance((window as any).pdfjsLib);
    } else {
      console.warn("PDF.js library not immediately available in FullScreenPreviewModal.");
      // Consider setting an error or a retry mechanism if PdfJsWorkerConfig might take time
    }
  }, []);

  const renderPdfPage = async (pdfDocument: any, pageNum: number) => {
    if (!canvasRef.current || !pdfJsLibInstance) return;
    setIsLoading(true);
    try {
      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale: Math.min(2, (canvasRef.current.parentElement?.clientHeight || 1000) / page.getViewport({scale:1}).height ) }); 

      const canvas = canvasRef.current;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not get canvas context');
      }
      
      await page.render({ canvasContext: context, viewport }).promise;
      setError(null);
    } catch (renderError: any) {
      console.error('Error rendering PDF page:', renderError);
      setError(renderError.message || t('errorDisplayingDocument'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(initialPage);
      setError(null);
      
      if (!pdfJsLibInstance && documentType === 'pdf') {
        setError(t('errorPdfJsNotLoaded'));
        setIsLoading(false);
        return;
      }
      setIsLoading(true); 

      if (documentType === 'pdf' && pdfFile && pdfJsLibInstance) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          if (e.target?.result) {
            try {
              const typedArray = new Uint8Array(e.target.result as ArrayBuffer);
              const loadingTask = pdfJsLibInstance.getDocument({ data: typedArray });
              const loadedPdfDoc = await loadingTask.promise;
              
              setPdfDoc(loadedPdfDoc);
              setNumPages(loadedPdfDoc.numPages);
              if (loadedPdfDoc.numPages > 0) {
                const validInitialPage = Math.max(1, Math.min(initialPage, loadedPdfDoc.numPages));
                setCurrentPage(validInitialPage);
                // Render will be triggered by the next useEffect
              } else {
                setError(t('noDocumentToDisplay')); 
                setIsLoading(false);
              }
            } catch (loadError: any) {
              console.error('Error loading PDF document:', loadError);
              setError(loadError.message || t('errorDisplayingDocument'));
              setPdfDoc(null);
              setNumPages(0);
              setIsLoading(false);
            }
          }
        };
        reader.onerror = () => {
          setError(t('errorDisplayingDocument'));
          setIsLoading(false);
        };
        reader.readAsArrayBuffer(pdfFile);
      } else if (documentType === 'docx' && docxImageUrls && docxImageUrls.length > 0) {
        setNumPages(docxImageUrls.length);
        setCurrentPage(Math.max(1, Math.min(initialPage, docxImageUrls.length))); 
        setIsLoading(false); 
      } else if (documentType) { // If a documentType is specified but conditions not met
        setError(t('noDocumentToDisplay'));
        setNumPages(0);
        setIsLoading(false);
      } else { // No document type
        setIsLoading(false);
      }
    } else {
      if (pdfDoc) {
        pdfDoc.destroy().catch((err:any) => console.error("Error destroying PDF doc:", err));
        setPdfDoc(null);
      }
      setNumPages(0);
      setCurrentPage(1); 
      setIsLoading(false);
      setError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, documentType, pdfFile, docxImageUrls, initialPage, t, pdfJsLibInstance]); 

  useEffect(() => {
    if (isOpen && documentType === 'pdf' && pdfDoc && currentPage > 0 && currentPage <= numPages && pdfJsLibInstance) {
      renderPdfPage(pdfDoc, currentPage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pdfDoc, isOpen, documentType, pdfJsLibInstance]); // Added pdfJsLibInstance

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  if (!isOpen) {
    return null;
  }

  const pageIndicatorText = numPages > 0 
    ? t('pageIndicator', { currentPage: currentPage, numPages: numPages })
    : '';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-gray-800 text-white rounded-lg shadow-2xl w-full h-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-700 flex-shrink-0">
          <div className="text-sm md:text-base">{pageIndicatorText}</div>
          <div className="flex items-center space-x-2 md:space-x-3">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1 || isLoading}
              className="p-1.5 md:p-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={t('previousPage')} 
            >
              <ChevronLeft size={20} className="md:w-5 md:h-5" />
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= numPages || isLoading}
              className="p-1.5 md:p-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={t('nextPage')} 
            >
              <ChevronRight size={20} className="md:w-5 md:h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 md:p-2 rounded-md hover:bg-red-700/80 transition-colors"
              aria-label={t('closeBtn')}
            >
              <CloseIcon size={20} className="md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        <div className="flex-grow flex items-center justify-center overflow-auto p-2 md:p-4 bg-gray-900">
          {isLoading && (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <Loader2 size={48} className="animate-spin text-purple-400 mb-3" />
              {t('loadingDocument')}
            </div>
          )}
          {error && !isLoading && (
            <div className="text-red-400 text-center">
              <p>{t('errorDisplayingDocument')}</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          {!isLoading && !error && documentType === 'pdf' && pdfDoc && (
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain"></canvas>
          )}
          {!isLoading && !error && documentType === 'docx' && docxImageUrls && docxImageUrls.length > 0 && (
            <div className="w-full h-full flex items-center justify-center">
               <Image
                src={docxImageUrls[currentPage - 1]}
                alt={`${t('docxPreviewAltText')} - ${pageIndicatorText}`} 
                layout="intrinsic" 
                width={800} 
                height={1100} 
                objectFit="contain"
                className="max-w-full max-h-full"
              />
            </div>
          )}
           {!isLoading && !error && !pdfDoc && !(documentType === 'docx' && docxImageUrls && docxImageUrls.length > 0) && (
             <p className="text-gray-500">{t('noDocumentToDisplay')}</p>
           )}
        </div>
      </div>
    </div>
  );
};

export default FullScreenPreviewModal;
