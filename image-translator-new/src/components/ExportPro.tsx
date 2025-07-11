'use client';

import React from 'react';
import { useEditorContext } from '@/contexts/EditorContext';
import { Download } from 'lucide-react';

// Helper function to trigger file download
const downloadFile = (filename: string, content: string, mimeType: string) => {
  const element = document.createElement('a');
  element.setAttribute('href', `${mimeType},${encodeURIComponent(content)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const downloadBlob = (filename: string, blob: Blob) => {
  const element = document.createElement('a');
  const url = URL.createObjectURL(blob);
  element.setAttribute('href', url);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(url);
};


const ExportPro: React.FC = () => {
  const { areas, backgroundImageUrl, originalImageFile, triggerJPGExport } = useEditorContext();

  const handleExportJSON = () => {
    if (areas.length === 0) {
      alert("No areas to export.");
      return;
    }
    const filename = `${originalImageFile?.name.replace(/\.[^/.]+$/, "") || 'export'}_translated.json`;
    // We might want to serialize a simplified version of Area or add more metadata
    const jsonContent = JSON.stringify(areas, null, 2);
    downloadFile(filename, jsonContent, 'data:application/json;charset=utf-8');
  };

  const handleExportJPG = () => {
    const canvasElement = document.querySelector('canvas'); // Assuming only one main canvas for Fabric
    if (!canvasElement || !backgroundImageUrl) {
      alert("Canvas or background image not found for JPG export.");
      return;
    }
    // The Fabric canvas instance is not directly accessible here without passing ref or using a global store for it.
    // For simplicity, let's assume the canvas element can be used with toDataURL for a basic export.
    // A more robust solution would involve accessing the fabricCanvasRef.current.toDataURL().
    const dataUrl = triggerJPGExport();
    if (dataUrl) {
      // The dataUrl from Fabric includes the mime type prefix (e.g., "data:image/jpeg;base64,")
      // We need to process this for download.
      // A simple way is to create a blob and download that.
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          downloadBlob(`${originalImageFile?.name.replace(/\.[^/.]+$/, "") || 'export'}.jpg`, blob);
        })
        .catch(err => {
          console.error("Error creating blob for JPG export:", err);
          alert("Failed to export JPG.");
        });
    } else {
      alert("Failed to generate JPG. Canvas instance might not be available.");
    }
  };

  const handleExportPDF = () => {
    // Placeholder for PDF export using jsPDF and html2canvas or server-side generation
    alert("PDF Export functionality is planned for a future update.");
  };


  return (
    <div className="mt-8 p-6 bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
      <h3 className="text-xl font-semibold text-gray-100 mb-4 text-center">Export Options</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={handleExportJSON}
          disabled={areas.length === 0}
          className="flex items-center justify-center px-4 py-2 bg-brand-green hover:bg-green-700 text-white font-semibold rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={18} className="mr-2" /> JSON
        </button>
        <button
          onClick={handleExportJPG}
          disabled={!backgroundImageUrl}
          className="flex items-center justify-center px-4 py-2 bg-brand-blue hover:bg-blue-700 text-white font-semibold rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={18} className="mr-2" /> JPG
        </button>
        <button
          onClick={handleExportPDF}
          disabled={!backgroundImageUrl} // Basic disable condition
          className="flex items-center justify-center px-4 py-2 bg-brand-purple hover:bg-purple-700 text-white font-semibold rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={18} className="mr-2" /> PDF
        </button>
      </div>
    </div>
  );
};

export default ExportPro;
