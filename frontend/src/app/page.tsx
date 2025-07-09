'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import Head from 'next/head';
import { fabric } from 'fabric'; // Ensure fabric is imported
import ImageCanvas from '@/components/ImageCanvas';
import TextEditor from '@/components/TextEditor';
import OCRScannerFX from '@/components/OCRScannerFX';
import ExportPro from '@/components/ExportPro';
import FileUpload from '@/components/FileUpload';
import { useAppContext, OcrTextBlock } from '@/contexts/AppContext';
import { uploadImageForOcr, translateTexts, exportFile, downloadBlob, OcrBlockData } from '@/services/api';
import { AlertCircle, CheckCircle, Languages, ChevronDown, ChevronUp, Settings2 } from 'lucide-react'; // Added icons

// Helper to convert API block to AppContext block
const adaptApiBlockToContext = (apiBlock: OcrBlockData): OcrTextBlock => ({
  ...apiBlock,
  // translatedText is already optional in OcrTextBlock
});

const adaptContextBlockToApi = (contextBlock: OcrTextBlock): OcrBlockData => ({
  id: contextBlock.id,
  bbox: contextBlock.bbox,
  text: contextBlock.text,
  translatedText: contextBlock.translatedText,
});


export default function Home() {
  const {
    uploadedImageUrl,
    originalImageName, // Corrected: Use originalImageName from context
    ocrBlocks,
    selectedBlockId,
    isScanning,
    isLoading, // General loading from context
    error,
    estimatedFontSize,
    setUploadedImageUrl,
    setOcrBlocks,
    updateOcrBlock,
    addOcrBlock, // Added from context
    deleteOcrBlock, // Added from context
    setSelectedBlockId,
    setIsScanning,
    setIsLoading, // General loading setter from context
    setError,
    setEstimatedFontSize,
    resetStateForNewImage,
  } = useAppContext();

  const [showEditor, setShowEditor] = useState(false);
  const [currentFabricObject, setCurrentFabricObject] = useState<fabric.Object | null>(null);
  const [langOcr, setLangOcr] = useState<'en' | 'ch'>('en'); // Default OCR language
  const [showSettings, setShowSettings] = useState(false);
  const [canvasRenderKey, setCanvasRenderKey] = useState(0); // To force re-render of canvas if needed
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 }); // Initial default

  const selectedBlock = ocrBlocks.find(b => b.id === selectedBlockId) || null;

  useEffect(() => {
    // If an image is uploaded, automatically adjust canvas size to fit it (up to a max)
    if (uploadedImageUrl) {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1200; // Max width for the canvas container
        const MAX_HEIGHT = 800; // Max height for the canvas container
        let newWidth = img.naturalWidth;
        let newHeight = img.naturalHeight;

        if (newWidth > MAX_WIDTH) {
          const ratio = MAX_WIDTH / newWidth;
          newWidth = MAX_WIDTH;
          newHeight *= ratio;
        }
        if (newHeight > MAX_HEIGHT) {
          const ratio = MAX_HEIGHT / newHeight;
          newHeight = MAX_HEIGHT;
          newWidth *= ratio;
        }
        setCanvasSize({ width: newWidth, height: newHeight });
        setCanvasRenderKey(prev => prev + 1); // Force canvas re-render with new dimensions
      };
      img.src = uploadedImageUrl;
    } else {
       // Reset to default if no image
       setCanvasSize({ width:800, height:600});
    }
  }, [uploadedImageUrl]);


  const handleFileSelect = async (file: File) => {
    setError(null);
    resetStateForNewImage(); // Clear previous OCR blocks, etc.
    setIsLoading(true); // Use general loading for file processing
    setIsScanning(true); // Specifically for OCR scanning visual

    const imageUrl = URL.createObjectURL(file);
    setUploadedImageUrl(imageUrl, file); // Store original file too

    try {
      const response = await uploadImageForOcr(file, langOcr);
      setOcrBlocks(response.blocks.map(adaptApiBlockToContext));
      setEstimatedFontSize(response.font_size);
      // The image_url from backend is relative to backend's upload folder.
      // We are already using a local object URL for the initially uploaded image.
      // If backend provides a *processed* image URL that's different, handle here.
      // For now, we assume the frontend's `uploadedImageUrl` is sufficient for display.

    } catch (err: any) {
      console.error("OCR Error:", err);
      setError(err.message || 'Failed to process image OCR.');
      setUploadedImageUrl(null, null); // Clear image on error
    } finally {
      setIsScanning(false);
      setIsLoading(false);
    }
  };

  const handleTextSelect = (block: OcrTextBlock, fabricObject: fabric.Object) => {
    setSelectedBlockId(block.id);
    setCurrentFabricObject(fabricObject); // Store the fabric object for potential direct manipulation
    setShowEditor(true);
  };

  const handleEditorSave = (blockId: string, newText: string, newTranslatedText?: string) => {
    updateOcrBlock(blockId, newText, newTranslatedText);
    // Optionally, update the text on the fabric object directly if displaying text on canvas
    if (currentFabricObject && fabricCanvasRef.current) {
        // This depends on how text is rendered on canvas; placeholder
        // e.g., if fabricObject is a text object: currentFabricObject.set('text', newText);
        fabricCanvasRef.current.renderAll();
    }
    setShowEditor(false);
    setSelectedBlockId(null);
    setCurrentFabricObject(null);
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setSelectedBlockId(null);
    setCurrentFabricObject(null);
  };

  const handleEditorDelete = (blockId: string) => {
    deleteOcrBlock(blockId); // This will also deselect if it was selected
     // Remove from Fabric canvas
    if (fabricCanvasRef.current) {
        const canvas = fabricCanvasRef.current; // Use a const for clarity
        const objectsToRemove = canvas.getObjects().filter((obj: fabric.Object) => obj.data?.id === blockId); // Added type for obj
        objectsToRemove.forEach((obj: fabric.Object) => canvas.remove(obj)); // Added type for obj and use canvas const
        canvas.discardActiveObject();
        canvas.renderAll();
    }
    setShowEditor(false); // Close editor
  };


  const handleAreaSelect = async (bbox: [number, number, number, number]) => {
    if (!localOriginalImageFile) { // Check local state for the file
      setError("Original image not found for partial OCR. Please re-upload if needed.");
      return;
    }
    // This is the "框选补漏" (Box selection for missed areas) feature.
    // For MVP, we'll create a new empty block for the user to fill manually.
    // Future: Send `bbox` and `localOriginalImageFile` to a partial OCR endpoint.

    console.log("Area selected (original image coordinates for file", (localOriginalImageFile as File).name, "):", bbox);
    setIsLoading(true);
    try {
      // Simulate backend call for partial scan or allow direct text input
      // For now, let's create a new block that the user can edit.
      const newBlockId = `manual-${Date.now()}`;
      const newBlock: OcrTextBlock = {
        id: newBlockId,
        bbox: bbox, // This bbox is in original image coordinates
        text: "", // User will fill this
        translatedText: "",
      };
      addOcrBlock(newBlock);
      setSelectedBlockId(newBlockId); // Auto-select the new block for editing
      setCurrentFabricObject(null);
      setShowEditor(true);

    } catch (err: any) {
        console.error("Area Select/Partial OCR Error:", err);
        setError(err.message || "Failed to process selected area.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleTranslateBlock = async (blockId: string) => {
    const blockToTranslate = ocrBlocks.find(b => b.id === blockId);
    if (!blockToTranslate || !blockToTranslate.text) {
      setError("No text to translate for this block.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await translateTexts([blockToTranslate.text], 'en'); // Assuming target is 'en', make dynamic later
      if (response.translated_texts && response.translated_texts.length > 0) {
        updateOcrBlock(blockId, blockToTranslate.text, response.translated_texts[0]);
      }
    } catch (err: any) {
      console.error("Translation Error:", err);
      setError(err.message || "Failed to translate text.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchTranslateAll = async () => {
    const textsToTranslate = ocrBlocks.map(b => b.text).filter(text => !!text);
    if (textsToTranslate.length === 0) {
        setError("No text found in blocks to translate.");
        return;
    }
    setIsLoading(true);
    try {
        const response = await translateTexts(textsToTranslate, 'en'); // Assuming target 'en'
        const translatedTexts = response.translated_texts;

        const updatedBlocks = ocrBlocks.map((block, index) => {
            // This assumes the backend returns translations in the same order
            // and for all non-empty texts. A more robust mapping might be needed.
            if (block.text && translatedTexts.length > index) { // Basic check
                 return { ...block, translatedText: translatedTexts[index] };
            }
            return block;
        });
        setOcrBlocks(updatedBlocks);

    } catch (err:any) {
        console.error("Batch Translation Error:", err);
        setError(err.message || "Failed to batch translate texts.");
    } finally {
        setIsLoading(false);
    }
  };


  const handleExport = async (format: 'pdf' | 'jpg' | 'json') => {
    if (!originalImageFile && format !== 'json') { // originalImageFile needed for PDF/JPG base
      setError("Original image is required for PDF/JPG export.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // The backend /api/export expects the image_url to be accessible by the backend.
      // If using the local object URL, the backend cannot fetch it.
      // For MVP, the backend's export for PDF/JPG is a placeholder.
      // For JSON, we can send the current blocks.
      // A more robust solution would be to re-upload the base image if needed for PDF/JPG export
      // or have the backend use the initially uploaded image path.

      let exportImageUrl: string | null = null;
      if (originalImageFile && (format === 'pdf' || format === 'jpg')) {
          // Option 1: If backend stores and can reuse the initially uploaded file via a path/ID.
          // This requires backend to return an identifier for the stored image.
          // For now, we pass the frontend URL, but backend placeholder won't use it effectively.
          exportImageUrl = uploadedImageUrl;
      }

      const apiBlocks = ocrBlocks.map(adaptContextBlockToApi);
      const result = await exportFile(format, exportImageUrl, apiBlocks);

      if (format === 'json') {
        const jsonString = JSON.stringify(result, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        downloadBlob(blob, `export-${Date.now()}.json`);
      } else if (result instanceof Blob) { // For PDF / JPG
        downloadBlob(result, `export-${Date.now()}.${format}`);
      }
      // Show success message
    } catch (err: any) {
      console.error("Export Error:", err);
      setError(err.message || `Failed to export as ${format}.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Ref for fabric canvas instance for direct manipulation if needed from page
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);


  return (
    <>
      <Head>
        <title>NEXUS-IMAGE TRANSLATOR</title>
        <meta name="description" content="AI打底 + 人工精修 - Professional Image Translation Tool" />
        <link rel="icon" href="/favicon.ico" /> {/* Assuming you have a favicon */}
      </Head>

      {/* Main Application Layout */}
      <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100 font-sans">
        {/* Header Area (Simplified) */}
        <header className="p-4 bg-gray-800 shadow-md sticky top-0 z-50">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gradient-brand">
              NEXUS-IMAGE TRANSLATOR
            </h1>
            <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-md hover:bg-gray-700 transition-colors"
                title="Settings"
            >
                <Settings2 size={24} className={showSettings ? "text-purple-400" : ""} />
            </button>
          </div>
        </header>

        {/* Settings Panel */}
        {showSettings && (
            <div className="bg-gray-800 p-4 shadow-lg md:absolute md:right-4 md:top-18 md:rounded-md md:max-w-xs z-40">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">Settings</h3>
                    <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-gray-700 rounded-full"><ChevronUp size={20}/></button>
                </div>
                <label htmlFor="ocrLang" className="block text-sm font-medium text-gray-300 mb-1">OCR Language:</label>
                <select
                    id="ocrLang"
                    value={langOcr}
                    onChange={(e) => setLangOcr(e.target.value as 'en' | 'ch')}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500"
                >
                    <option value="en">English</option>
                    <option value="ch">Chinese</option>
                    {/* Add other languages supported by backend OCR */}
                </select>
                <p className="text-xs text-gray-400 mt-2">Select language before uploading a new image for optimal OCR.</p>
            </div>
        )}


        {/* Main Content Area */}
        <main className="flex-grow container mx-auto p-4 flex flex-col items-center">
          {!uploadedImageUrl && <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading || isScanning} />}

          {error && (
            <div className="my-4 p-3 bg-red-700 bg-opacity-50 text-white rounded-md flex items-center">
              <AlertCircle size={20} className="mr-2" />
              <span>Error: {error}</span>
              <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-600 rounded-full">X</button>
            </div>
          )}

          {uploadedImageUrl && !error && (
            <div className="w-full flex flex-col items-center space-y-4">
                 <div className="w-full flex justify-center items-center my-4" style={{ width: canvasSize.width, height: canvasSize.height }}>
                    <ImageCanvas
                        key={canvasRenderKey} // Force re-render on key change
                        imageUrl={uploadedImageUrl}
                        blocks={ocrBlocks}
                        onTextSelect={handleTextSelect}
                        onAreaSelect={handleAreaSelect}
                        canvasWidth={canvasSize.width}
                        canvasHeight={canvasSize.height}
                        // Pass fabricCanvasRef to ImageCanvas if direct manipulation is needed from parent
                        // fabricRef={fabricCanvasRef}
                    />
                </div>

              {ocrBlocks.length > 0 && !showEditor && (
                <div className="my-4 p-3 bg-gray-700 rounded-md shadow-lg">
                  <button
                    onClick={handleBatchTranslateAll}
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-md transition-colors duration-150 disabled:opacity-50"
                  >
                    <Languages size={18} className="mr-2" /> Translate All Blocks
                  </button>
                </div>
              )}
            </div>
          )}

          {showEditor && selectedBlock && (
            <TextEditor
              block={selectedBlock}
              onSave={handleEditorSave}
              onClose={handleEditorClose}
              onDelete={handleEditorDelete} // Pass delete handler
            />
          )}
        </main>

        {isScanning && <OCRScannerFX isScanning={isScanning} />}

        {uploadedImageUrl && !isScanning && ocrBlocks.length > 0 && <ExportPro onExport={handleExport} />}

        {/* Footer (Simplified) */}
        <footer className="p-4 bg-gray-800 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} NEXUS-IMAGE TRANSLATOR. All rights reserved.
        </footer>
      </div>
    </>
  );
}
