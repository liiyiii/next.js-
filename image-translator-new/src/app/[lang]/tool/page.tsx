'use client';

import React, { useState, useEffect } from 'react'; // Added useEffect
import { useTranslation } from 'react-i18next';
import ImageCanvas from '@/components/ImageCanvas';
import { mockIPCService, mockPartialScanIPCService, OCRBlock as IPC_OCRBlock } from '@/services/ipcService';
import { EditorProvider, useEditorContext } from '@/contexts/EditorContext';
import { Area } from '@/types';
import { UploadCloud } from 'lucide-react';
import TextEditor from '@/components/TextEditor';
import ExportPro from '@/components/ExportPro'; // Import ExportPro

function ToolPageContent() {
  const { t } = useTranslation();
  const {
    areas, setAreas,
    backgroundImageUrl, setBackgroundImageUrl,
    originalImageFile,
    setOriginalImageFile,
    estimatedFontSize,
    setEstimatedFontSize,
    setSelectedAreaId // Destructure setSelectedAreaId
  } = useEditorContext();

  const [isLoading, setIsLoading] = useState(false);
  const [isPartialScanning, setIsPartialScanning] = useState(false); // For "框选补漏"
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const processFile = async (file: File) => {
    setOriginalImageFile(file);
    setFileName(file.name);
    setError(null);
    setIsLoading(true);
    setAreas([]);
    setBackgroundImageUrl(null);

    try {
      const response = await mockIPCService(file);
      if (response.error) {
        setError(response.error);
      } else {
        setBackgroundImageUrl(response.imagePath);
        setEstimatedFontSize(response.estimatedFontSize || 16);

        const newAreas: Area[] = response.ocrData.map(block => ({
          id: block.id,
          bbox: block.bbox,
          sourceString: block.text,
          translatedString: block.translatedText || block.text,
          style: {
            fontSize: response.estimatedFontSize || 16,
            backgroundColor: 'rgba(255, 255, 255, 0.0)',
            color: '#FFFFFF',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            textAlign: 'left',
          }
        }));
        setAreas(newAreas);
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    } else {
      setFileName(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    } else {
      setError("Invalid file type. Please drop an image.");
      setFileName(null);
    }
  };

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (isLoading || isPartialScanning) return;

      const items = event.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              event.preventDefault();
              processFile(file);
            }
            break;
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [isLoading, isPartialScanning]); // Added isPartialScanning to deps

  const handleNewAreaSelected = async (bbox: [number, number, number, number]) => {
    if (!originalImageFile) {
      setError("Original image not found for partial scan. Please upload an image first.");
      return;
    }
    setIsPartialScanning(true);
    setError(null);
    try {
      const newBlock = await mockPartialScanIPCService(); // Pass cropped image data if available/needed

      if (newBlock) {
        const newArea: Area = {
          id: newBlock.id,
          bbox: bbox,
          sourceString: newBlock.text,
          translatedString: newBlock.translatedText || newBlock.text,
          style: {
            fontSize: estimatedFontSize || 16,
            backgroundColor: 'rgba(139, 92, 246, 0.1)', // Slight tint for newly added
            color: '#FFFFFF',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            textAlign: 'left',
          }
        };
        setAreas(prevAreas => [...prevAreas, newArea]);
        setSelectedAreaId(newArea.id); // Select the new area
      } else {
        setError("Partial scan did not return a new block.");
      }
    } catch (e: any) {
      setError(e.message || "Error during partial scan.");
    } finally {
      setIsPartialScanning(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 md:p-6 w-full">
      <div className={`mb-6 w-full max-w-lg bg-gray-800 p-6 rounded-xl shadow-xl transition-all duration-300 ${isDraggingOver ? 'ring-4 ring-brand-blue ring-offset-2 ring-offset-gray-900' : ''}`}>
        <label
          htmlFor="imageUpload"
          className={`flex flex-col items-center justify-center w-full h-64 border-2  border-dashed rounded-lg cursor-pointer transition-colors ${isDraggingOver ? 'border-brand-blue bg-gray-600' : 'border-gray-600 bg-gray-700 hover:bg-gray-600'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className={`w-12 h-12 mb-4 ${isDraggingOver ? 'text-brand-blue' : 'text-gray-400'}`} />
            <p className={`mb-2 text-md ${isDraggingOver ? 'text-white' : 'text-gray-400'}`}>
              <span className="font-semibold text-brand-blue">Click to upload</span>, drag & drop, or paste image
            </p>
            <p className={`text-sm ${isDraggingOver ? 'text-gray-300' : 'text-gray-500'}`}>PNG, JPG, WEBP (MAX. 10MB)</p>
          </div>
          <input
            type="file"
            id="imageUpload"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        {fileName && <p className="mt-3 text-sm text-center text-gray-400">Selected: {fileName}</p>}
      </div>

      {isLoading && <p className="text-lg text-brand-blue animate-pulse my-4">Processing initial image...</p>}
      {isPartialScanning && <p className="text-sm text-brand-green animate-pulse my-2">Processing selected area...</p>}
      {error && <p className="text-lg text-red-500 my-4">Error: {error}</p>}

      {backgroundImageUrl && (
        <div className="w-full flex justify-center items-center mt-4 relative">
          <ImageCanvas onNewAreaSelect={handleNewAreaSelected} />
          <TextEditor />
        </div>
      )}

      {/* Debug display of areas from context */}
      {/* {areas.length > 0 && !isLoading && !isPartialScanning && (
          <div className="mt-6 p-4 bg-gray-800 rounded w-full max-w-4xl">
            <h3 className="text-xl font-semibold mb-2 text-gray-200">Processed Areas (from Context):</h3>
            <pre className="text-xs bg-gray-900 p-3 rounded overflow-x-auto custom-scrollbar text-gray-300">
              {JSON.stringify(areas, null, 2)}
            </pre>
          </div>
      )} */}

      {/* ExportPro component */}
      {backgroundImageUrl && areas.length > 0 && (
        <ExportPro />
      )}
    </div>
  );
}

export default function ToolPageContainer() {
  return (
    <EditorProvider>
      <ToolPageContent />
    </EditorProvider>
  );
}
