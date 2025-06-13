// src/components/PdfJsWorkerConfig.tsx
'use client';
import { useEffect, useState } from 'react';

// To inform other components if pdfjsLib is ready from CDN
export let isPdfJsLibReady = false;

const PdfJsWorkerConfig = () => {
  useEffect(() => {
    if ((window as any).pdfjsLib) {
      // In case it's somehow loaded already or by another instance
      isPdfJsLibReady = true;
      if (!(window as any).pdfjsLib.GlobalWorkerOptions.workerSrc) {
         (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
      }
      console.log('PDF.js already loaded, worker configured.');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      console.log('PDF.js library v3.11.174 loaded from CDN.');
      if ((window as any).pdfjsLib) {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        (window as any).pdfjsLib.cMapUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/';
        (window as any).pdfjsLib.cMapPacked = true;
        console.log('PDF.js worker v3.11.174 configured from CDN.');
        isPdfJsLibReady = true;
      } else {
        console.error('pdfjsLib not found on window after v3.11.174 script load!');
        isPdfJsLibReady = false;
      }
    };
    script.onerror = () => {
      console.error('Failed to load PDF.js v3.11.174 library from CDN.');
      isPdfJsLibReady = false;
    };
    document.head.appendChild(script);

    return () => {
      // Potentially remove the script, though for a library like this, it's often left
      // document.head.removeChild(script);
      // isPdfJsLibReady = false; // Resetting this might be complex if other components rely on it
    };
  }, []);

  return null;
};

export default PdfJsWorkerConfig;