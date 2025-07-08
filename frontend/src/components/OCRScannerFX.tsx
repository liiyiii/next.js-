'use client';

import React from 'react';

interface OCRScannerFXProps {
  isScanning: boolean;
}

// Simple placeholder for "粒子轨迹扫描" (Particle Trace Scan)
// For actual Three.js particles, this would be a much more complex component.
const OCRScannerFX: React.FC<OCRScannerFXProps> = ({ isScanning }) => {
  if (!isScanning) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-[100]">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-500"></div>
      <p className="text-white text-lg mt-4">Scanning Image...</p>
      {/*
        Future enhancements for particle animation:
        - A <canvas> element here for Three.js
        - Logic to render particles tracing paths or a "scan line" effect.
        - "可中断扫描动画" (Interruptible scan animation) would require a cancel button
          and a way to signal the backend to halt processing if possible.
        - "实时进度可视化" (Real-time progress visualization) would need progress data
          from the backend OCR API.
      */}
    </div>
  );
};

export default OCRScannerFX;
