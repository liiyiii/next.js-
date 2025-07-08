'use client';

import React, { useState } from 'react';
import { Download, FileText, Image as ImageIcon, FileJson, X, Settings } from 'lucide-react';

interface ExportProProps {
  onExport: (format: 'pdf' | 'jpg' | 'json') => void;
  // Future: add options for PDF (printable, etc.), JPG quality, JSON versioning
}

const ExportPro: React.FC<ExportProProps> = ({ onExport }) => {
  const [isOpen, setIsOpen] = useState(false);
  // const [pdfOptions, setPdfOptions] = useState({ printable: true }); // Example for future

  const handleExport = (format: 'pdf' | 'jpg' | 'json') => {
    onExport(format);
    setIsOpen(false); // Close modal after initiating export
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-6 py-3 rounded-full text-lg font-semibold hover:from-purple-700 hover:to-indigo-800 transition-all duration-300 shadow-xl flex items-center transform hover:scale-105 z-40"
        title="Export Options"
      >
        <Download size={22} className="mr-2" /> Export
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[60]">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-purple-400 flex items-center">
            <Settings size={26} className="mr-3 text-purple-500" />
            Pro Export Options
          </h2>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
            <X size={28} />
          </button>
        </div>

        <p className="text-gray-300 mb-8">
          Choose your desired output format. Advanced settings for each format will be available in future versions.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => handleExport('pdf')}
            className="w-full flex items-center justify-center text-left px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-150 text-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <FileText size={24} className="mr-4 text-red-400" />
            Export as PDF
            {/* Future: <span className="text-xs ml-auto text-gray-400">Print-ready, Editable</span> */}
          </button>
          <button
            onClick={() => handleExport('jpg')}
            className="w-full flex items-center justify-center text-left px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-150 text-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <ImageIcon size={24} className="mr-4 text-blue-400" />
            Export as JPG
             {/* Future: <span className="text-xs ml-auto text-gray-400">With Layers</span> */}
          </button>
          <button
            onClick={() => handleExport('json')}
            className="w-full flex items-center justify-center text-left px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-150 text-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <FileJson size={24} className="mr-4 text-green-400" />
            Export as JSON
            {/* Future: <span className="text-xs ml-auto text-gray-400">Structured Data</span> */}
          </button>
        </div>

        {/* Placeholder for future "PDF打印预设" (PDF Print Presets) and "JSON版本控制" (JSON Version Control) */}
        {/* <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-500">Advanced options like PDF print presets and JSON versioning coming soon.</p>
        </div> */}

      </div>
    </div>
  );
};

export default ExportPro;
