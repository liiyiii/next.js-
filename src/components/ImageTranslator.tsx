// src/components/ImageTranslator.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import { ocrFullPage, ocrRegion } from '@/services/apiService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAlert } from '@/contexts/AlertContext';
import { OCRBlock } from '@/types'; // Import from shared types
import TextEditToolbar from './TextEditToolbar'; // Import the toolbar

interface ImageTranslatorProps {
  // Props to be defined later, e.g., initial image, callbacks
}

const ImageTranslator: React.FC<ImageTranslatorProps> = () => {
  const { t } = useLanguage();
  const { showAlert } = useAlert();

  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [displayedImageUrl, setDisplayedImageUrl] = useState<string | null>(null);
  const [ocrBlocks, setOcrBlocks] = useState<OCRBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [currentDrawingRect, setCurrentDrawingRect] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false); // For drawing selection rectangles
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // State for dragging text blocks
  const [isDraggingBlock, setIsDraggingBlock] = useState<boolean>(false);
  const [dragStartCoords, setDragStartCoords] = useState<{ x: number; y: number } | null>(null);
  // const [draggedBlockOriginalPosition, setDraggedBlockOriginalPosition] = useState<{ x: number; y: number } | null>(null);


  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null); // For loading the image and getting its dimensions

  const MAX_ZOOM = 5;
  const MIN_ZOOM = 0.2;
  const ZOOM_SENSITIVITY = 0.001;

  // --- Canvas Drawing Functions ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply pan and zoom transformations
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    // Draw image
    if (imageRef.current && imageRef.current.complete) {
      ctx.drawImage(imageRef.current, 0, 0);
    }

    // Draw OCR blocks
    ocrBlocks.forEach(block => {
      const [bbX, bbY, bbW, bbH] = block.blockBox; // Original bounding box from OCR
      // position is mandatory and holds the current top-left of the block in world coords
      const blockX = block.position.x;
      const blockY = block.position.y;

      ctx.save(); // Save context for clipping and specific block styling

      // 1. Draw background for the text block (for replacement effect)
      if (block.colorInfo?.bgColor) {
        ctx.fillStyle = block.colorInfo.bgColor;
        ctx.fillRect(blockX, blockY, bbW, bbH);
      }

      // 2. Draw border (selection or default)
      let borderColor = 'rgba(150, 150, 150, 0.5)'; // A more subtle default border
      if (block.id === selectedBlockId) {
        borderColor = 'red'; // Prominent selection border
        ctx.lineWidth = 2.5 / zoomLevel;
      } else if (block.colorInfo?.bgColor) {
        // If there's a bgColor, a border might be optional unless for emphasis
        // For now, only draw border if selected or no bgColor to define the block
         borderColor = 'rgba(0,0,0,0)'; // Transparent if bg is there and not selected
      } else {
         ctx.lineWidth = 1.5 / zoomLevel;
      }

      if (borderColor !== 'rgba(0,0,0,0)') { // Only draw if border is not transparent
        ctx.strokeStyle = borderColor;
        ctx.strokeRect(blockX, blockY, bbW, bbH);
      }


      // 3. Text Rendering
      const textToRender = block.translatedText || block.text;
      if (textToRender) {
        // User-edited styles from TextEditToolbar take precedence
        const fontSize = block.fontSize || block.fontInfo?.size || 16;
        const fontColor = block.fontColor || block.colorInfo?.fgColor || 'black';
        const fontFamily = block.fontInfo?.family || 'Arial';
        const fontWeight = block.fontInfo?.weight || 'normal';
        const fontStyle = block.fontInfo?.style || 'normal';

        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = fontColor;

        // Clipping path for the text to ensure it doesn't overflow blockBox
        ctx.beginPath();
        ctx.rect(blockX, blockY, bbW, bbH);
        ctx.clip();

        const padding = 5; // World space padding
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Basic multi-line handling if text contains '\n'
        const lines = textToRender.split('\n');
        const lineHeight = fontSize * 1.2; // Approximate line height

        for (let i = 0; i < lines.length; i++) {
          // Basic check to prevent drawing too many lines outside the box height
          if ((i * lineHeight) < (bbH - padding)) {
            ctx.fillText(lines[i], blockX + padding, blockY + padding + (i * lineHeight), bbW - (2 * padding));
          } else {
            break;
          }
        }
      }
      ctx.restore(); // Restore context after clipping (and other block-specific styles)
    });

    // Draw current drawing rectangle (for new region selection)
    if (isDrawing && currentDrawingRect) {
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 1 / zoomLevel;
        const rectX = Math.min(currentDrawingRect.startX, currentDrawingRect.endX);
        const rectY = Math.min(currentDrawingRect.startY, currentDrawingRect.endY);
        const rectW = Math.abs(currentDrawingRect.startX - currentDrawingRect.endX);
        const rectH = Math.abs(currentDrawingRect.startY - currentDrawingRect.endY);
        ctx.strokeRect(rectX, rectY, rectW, rectH);
    }

    ctx.restore();
  }, [ocrBlocks, selectedBlockId, displayedImageUrl, zoomLevel, panOffset, isDrawing, currentDrawingRect, imageRef]);

  useEffect(() => {
    const img = new Image();
    imageRef.current = img;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (canvas && imageRef.current) {
        // Set canvas size to image size initially, or a default viewport size
        // For now, let's use image dimensions. Consider a max viewport later.
        canvas.width = imageRef.current.naturalWidth;
        canvas.height = imageRef.current.naturalHeight;
        setZoomLevel(1); // Reset zoom
        setPanOffset({ x: 0, y: 0 }); // Reset pan
      }
      draw(); // Draw after image is loaded
    };
    img.onerror = () => {
      showAlert(t('imageLoadError'), 'error');
    }
    if (displayedImageUrl) {
      img.src = displayedImageUrl;
    }
  }, [displayedImageUrl, showAlert, t, draw]);

  useEffect(() => {
    draw();
  }, [draw, ocrBlocks, selectedBlockId, zoomLevel, panOffset]);


  // --- Event Handlers ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setOriginalImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDisplayedImageUrl(reader.result as string);
        setOcrBlocks([]); // Clear previous OCR blocks
        setSelectedBlockId(null);
      };
      reader.readAsDataURL(file);
    } else {
      showAlert(t('invalidImageFile'), 'error');
      setOriginalImage(null);
      setDisplayedImageUrl(null);
    }
  };

  const handleFullTranslate = async () => {
    if (!originalImage) {
      showAlert(t('noImageSelected'), 'warning');
      return;
    }
    setIsLoading(true);
    try {
      // Assuming API returns { blockList: [rawBlockData] }
      const response = await ocrFullPage(originalImage, (progress) => {
        // console.log('Upload progress:', progress);
      });
      // Ensure response.blockList is an array before mapping
      const blocksData = response.blockList && Array.isArray(response.blockList) ? response.blockList : [];

      const processedBlocks: OCRBlock[] = blocksData.map((block: any, index: number) => ({
        id: `block-${Date.now()}-${index}`, // Simple unique ID
        text: block.text || '',
        translatedText: block.translatedText || block.text || '', // Use original if no translation
        blockBox: block.blockBox || [0,0,0,0],
        fontInfo: block.fontInfo,
        colorInfo: block.colorInfo,
        type: block.type,
        fontSize: block.fontInfo?.size || 16, // Example: extract font size
        fontColor: block.colorInfo?.hex || 'black', // Example: extract color
        position: { x: block.blockBox[0], y: block.blockBox[1] }
      }));
      setOcrBlocks(processedBlocks);
    } catch (error: any) {
      console.error('Full page OCR error:', error);
      showAlert(error.message || t('ocrGenericError'), 'error');
      setOcrBlocks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCanvasCoordinates = (event: React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    // Adjust for canvas display size vs. actual size, pan, and zoom
    // The resulting coordinates are in the "world space" of the canvas content (at zoomLevel 1)
    const x = (event.clientX - rect.left) / zoomLevel - panOffset.x / zoomLevel;
    const y = (event.clientY - rect.top) / zoomLevel - panOffset.y / zoomLevel;
    // const x = (event.clientX - rect.left) * (canvas.width / rect.width) / zoomLevel - (panOffset.x / zoomLevel) ;
    // const y = (event.clientY - rect.top) * (canvas.height / rect.height) / zoomLevel - (panOffset.y / zoomLevel);
    return { x, y };
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(event);
    if (!coords) return;

    // Check if clicking on an existing block
    const clickedBlock = ocrBlocks.find(block => {
      const [bx, by, bw, bh] = block.blockBox;
      // Use block.position if available (already in world space), otherwise use blockBox
      const blockX = block.position?.x ?? bx;
      const blockY = block.position?.y ?? by;
      return coords.x >= blockX && coords.x <= blockX + bw && coords.y >= blockY && coords.y <= blockY + bh;
    });

    if (clickedBlock) {
      setSelectedBlockId(clickedBlock.id);
      setIsDraggingBlock(true);
      setDragStartCoords(coords); // Store starting mouse coords in world space
      // The block's current position (block.position or block.blockBox) is its own reference for dragging
      setIsDrawing(false); // Don't start drawing a new rectangle
      setCurrentDrawingRect(null);
    } else {
      // Clicked outside any block
      setSelectedBlockId(null);
      setIsDraggingBlock(false);
      setIsDrawing(true); // Start drawing a new selection rectangle
      setCurrentDrawingRect({ startX: coords.x, startY: coords.y, endX: coords.x, endY: coords.y });
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(event);
    if (!coords) return;

    if (isDraggingBlock && selectedBlockId && dragStartCoords) {
      const selectedBlock = ocrBlocks.find(b => b.id === selectedBlockId);
      if (!selectedBlock) return;

      // Calculate delta from drag start
      const deltaX = coords.x - dragStartCoords.x;
      const deltaY = coords.y - dragStartCoords.y;

      // Original position (either from block.position or block.blockBox if position is not set yet)
      const originalX = selectedBlock.position?.x ?? selectedBlock.blockBox[0];
      const originalY = selectedBlock.position?.y ?? selectedBlock.blockBox[1];

      const newX = originalX + deltaX;
      const newY = originalY + deltaY;

      setOcrBlocks(prevBlocks =>
        prevBlocks.map(b =>
          b.id === selectedBlockId ? { ...b, position: { x: newX, y: newY } } : b
        )
      );
      // Optimization: To avoid recalculating delta from initial dragStartCoords every move,
      // you could update dragStartCoords to current coords and update position incrementally.
      // However, for simplicity, using original position + total delta is fine for now.
      // To make it incremental:
      // setDragStartCoords(coords); // Update drag start to current for next delta calculation
      // And then newX = b.position.x + (coords.x - dragStartCoords.x_previous_move)

    } else if (isDrawing && currentDrawingRect) {
      setCurrentDrawingRect(prev => prev ? { ...prev, endX: coords.x, endY: coords.y } : null);
    }
    // No need to call draw() here, it's called by useEffect on ocrBlocks or currentDrawingRect change
  };

  const handleCanvasMouseUp = async () => {
    // End dragging state
    if (isDraggingBlock) {
      setIsDraggingBlock(false);
      setDragStartCoords(null);
    }

    // Handle new region selection if a rectangle was being drawn
    if (isDrawing && currentDrawingRect) {
      // Finalize the rectangle & trigger regional OCR if valid
      const { startX, startY, endX, endY } = currentDrawingRect;
      const width = Math.abs(startX - endX);
      const height = Math.abs(startY - endY);

      if (width > 5 && height > 5) { // Minimum size for a region
        const region = {
          x: Math.min(startX, endX),
          y: Math.min(startY, endY),
          width,
          height,
        };

        if (!originalImage) {
          showAlert(t('noImageSelected'), 'warning');
          setIsDrawing(false);
          setCurrentDrawingRect(null);
          return;
        }
        setIsLoading(true);
        try {
          const response = await ocrRegion(originalImage, region, (progress) => { /* console.log(progress) */ });
          const newBlocksData = response.blockList && Array.isArray(response.blockList) ? response.blockList : [];

          const processedNewBlocks: OCRBlock[] = newBlocksData.map((block: any, index: number) => ({
            id: `block-region-${Date.now()}-${index}`,
            text: block.text || '',
            translatedText: block.translatedText || block.text || '',
            blockBox: block.blockBox || [0,0,0,0], // These will be relative to the region, need adjustment
            fontInfo: block.fontInfo,
            colorInfo: block.colorInfo,
            type: block.type,
            fontSize: block.fontInfo?.size || 16,
            fontColor: block.colorInfo?.hex || 'black',
            // Adjust blockBox to be relative to the full canvas, not just the region
            position: {
              x: region.x + (block.blockBox?.[0] || 0),
              y: region.y + (block.blockBox?.[1] || 0)
            }
          }));

          // Logic to merge/replace blocks
          // For now, simple append. Could be more sophisticated (e.g., remove overlapping old blocks)
          setOcrBlocks(prevBlocks => [...prevBlocks, ...processedNewBlocks]);

        } catch (error: any) {
          console.error('Regional OCR error:', error);
          showAlert(error.message || t('ocrGenericError'), 'error');
        } finally {
          setIsLoading(false);
        }
      }
    }
    setIsDrawing(false);
    setCurrentDrawingRect(null);
  };

  const handleZoom = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left; // Mouse X relative to canvas element
    const mouseY = event.clientY - rect.top;  // Mouse Y relative to canvas element

    // Convert mouse position to canvas coordinates (before zoom)
    const mouseBeforeZoomX = (mouseX - panOffset.x) / zoomLevel;
    const mouseBeforeZoomY = (mouseY - panOffset.y) / zoomLevel;

    const delta = event.deltaY * ZOOM_SENSITIVITY * -1; // Invert scroll for intuitive zoom
    let newZoomLevel = zoomLevel + delta;
    newZoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoomLevel));

    // Calculate new pan offset to keep mouse position fixed relative to image content
    const newPanX = mouseX - mouseBeforeZoomX * newZoomLevel;
    const newPanY = mouseY - mouseBeforeZoomY * newZoomLevel;

    setZoomLevel(newZoomLevel);
    setPanOffset({ x: newPanX, y: newPanY });
};


  // --- Placeholder for Text Editing ---
  const handleUpdateBlock = (updatedBlock: OCRBlock) => {
    setOcrBlocks(prev => prev.map(b => b.id === updatedBlock.id ? updatedBlock : b));
    setSelectedBlockId(null); // Deselect after update
  };

  const handleDeleteBlock = (blockId: string) => {
    setOcrBlocks(prev => prev.filter(b => b.id !== blockId));
    setSelectedBlockId(null);
  };

  // --- Export Functions ---
  const handleExportJson = () => {
    if (!ocrBlocks.length) {
      showAlert(t('noDataToExport'), 'warning'); // Needs new translation key
      return;
    }
    const filename = originalImage?.name ? `${originalImage.name.split('.')[0]}_translated.json` : 'translated_data.json';
    const jsonString = JSON.stringify(ocrBlocks, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
    showAlert(t('exportJsonSuccess'), 'success');
  };

  const handleExportJpg = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) {
      showAlert(t('cannotDownloadNoImage'), 'error');
      return;
    }

    // Create a temporary canvas to draw without zoom/pan and with full resolution
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageRef.current.naturalWidth;
    tempCanvas.height = imageRef.current.naturalHeight;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
      showAlert(t('cannotCreateCanvasError'), 'error');
      return;
    }

    // Draw image
    tempCtx.drawImage(imageRef.current, 0, 0);

    // Draw OCR blocks (similar to draw() but without zoom/pan and selection highlights)
    ocrBlocks.forEach(block => {
      const [bbX, bbY, bbW, bbH] = block.blockBox;
      const blockX = block.position.x;
      const blockY = block.position.y;

      if (block.colorInfo?.bgColor) {
        tempCtx.fillStyle = block.colorInfo.bgColor;
        tempCtx.fillRect(blockX, blockY, bbW, bbH);
      }

      const textToRender = block.translatedText || block.text;
      if (textToRender) {
        const fontSize = block.fontSize || block.fontInfo?.size || 16;
        const fontColor = block.fontColor || block.colorInfo?.fgColor || 'black';
        const fontFamily = block.fontInfo?.family || 'Arial';
        const fontWeight = block.fontInfo?.weight || 'normal';
        const fontStyle = block.fontInfo?.style || 'normal';

        tempCtx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        tempCtx.fillStyle = fontColor;
        tempCtx.textAlign = 'left';
        tempCtx.textBaseline = 'top';
        const padding = 5;
        tempCtx.fillText(textToRender, blockX + padding, blockY + padding, bbW - (2 * padding));
      }
    });

    const filename = originalImage?.name ? `${originalImage.name.split('.')[0]}_translated.jpg` : 'translated_image.jpg';
    const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.9); // Quality 0.9

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert(t('exportJpgSuccess'), 'success');
  };

  const handleExportPdf = async () => {
    if (!imageRef.current || !displayedImageUrl) {
      showAlert(t('cannotDownloadNoImage'), 'error');
      return;
    }

    const img = imageRef.current;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    // Determine PDF orientation and dimensions
    // jsPDF uses points (pt) by default. 1 pt = 1/72 inch.
    // Standard DPI for images is often 72 or 96. Let's assume image pixels map roughly to points for simplicity,
    // or scale if necessary. For now, direct mapping.
    const orientation = imgWidth > imgHeight ? 'l' : 'p'; // landscape or portrait
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'px', // Using pixels directly for coordinates
      format: [imgWidth, imgHeight] // Custom format based on image dimensions
    });

    // Add image to PDF
    let imageFormat = 'JPEG'; // Default to JPEG
    if (originalImage?.type === 'image/png') {
      imageFormat = 'PNG';
    }
    // Other image types might need specific handling or conversion if not directly supported by jsPDF addImage
    // For simplicity, we'll stick to JPEG/PNG based on original upload. displayedImageUrl is a dataURL.
    pdf.addImage(displayedImageUrl, imageFormat, 0, 0, imgWidth, imgHeight);

    // Add text blocks
    ocrBlocks.forEach(block => {
      const [bbX, bbY, bbW, bbH] = block.blockBox; // These are in original image pixel coords
      const blockX = block.position.x;
      const blockY = block.position.y;

      // Background color for text block
      if (block.colorInfo?.bgColor) {
        pdf.setFillColor(block.colorInfo.bgColor);
        pdf.rect(blockX, blockY, bbW, bbH, 'F'); // 'F' for fill
      }

      const textToRender = block.translatedText || block.text;
      if (textToRender) {
        const fontSize = block.fontSize || block.fontInfo?.size || 12; // Default PDF font size
        const fontColor = block.fontColor || block.colorInfo?.fgColor || '#000000';
        const fontFamily = block.fontInfo?.family || 'helvetica'; // Default PDF font

        // jsPDF font styles: normal, bold, italic, bolditalic
        let fontStyle = 'normal';
        if (block.fontInfo?.weight === 'bold' && block.fontInfo?.style === 'italic') {
          fontStyle = 'bolditalic';
        } else if (block.fontInfo?.weight === 'bold') {
          fontStyle = 'bold';
        } else if (block.fontInfo?.style === 'italic') {
          fontStyle = 'italic';
        }
        pdf.setFont(fontFamily, fontStyle);
        pdf.setFontSize(fontSize);
        pdf.setTextColor(fontColor);

        // Handle text wrapping manually if needed, jsPDF's auto-wrap is via splitTextToSize
        const textLines = pdf.splitTextToSize(textToRender, bbW - 2 * 5 /* padding */);
        pdf.text(textLines, blockX + 5 /* padding */, blockY + fontSize * 0.8 /* approximate baseline adjustment */ + 5 /* padding */);
      }
    });

    const filename = originalImage?.name ? `${originalImage.name.split('.')[0]}_translated.pdf` : 'translated_document.pdf';
    pdf.save(filename);
    showAlert(t('exportPdfSuccess'), 'success'); // Needs new translation key
  };


  return (
    <div className="p-4 md:p-6 bg-gray-800 text-white rounded-lg shadow-2xl">
      {/* Title is now in page.tsx, so we can remove it from here or make it smaller */}
      {/* <h2 className="text-2xl font-semibold mb-6 text-purple-400 text-center">{t('imageTranslatorTitle')}</h2> */}

      {/* Controls Area */}
      <div className="mb-6 flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-center">
        <label className="form-control w-full sm:w-auto max-w-xs">
          <div className="label">
            <span className="label-text text-gray-300">{originalImage ? originalImage.name : t('selectImagePrompt')}</span>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="file-input file-input-bordered file-input-primary w-full"
          />
        </label>

        <button
          onClick={handleFullTranslate}
          disabled={!originalImage || isLoading || isDrawing} // Disable if drawing selection
          className="btn btn-primary btn-wide sm:btn-md"
        >
          {isLoading && !isDrawing ? (
            <>
              <span className="loading loading-spinner"></span>
              {t('processingImage')}
            </>
          ) : t('translateFullImageBtn')}
        </button>
        {/* Regional translate button is implicitly handled by mouseUp on canvas if a rect is drawn */}
      </div>

      {/* Canvas Area - Make it responsive */}
      <div
        className="w-full aspect-[4/3] max-h-[70vh] overflow-hidden border-2 border-gray-600 rounded-md relative bg-gray-700 shadow-inner"
        onWheel={handleZoom}
        // Add touch handlers for panning on mobile if desired later
      >
        <canvas
          ref={canvasRef}
          className={`cursor-crosshair ${isDraggingBlock ? 'cursor-grabbing' : 'cursor-crosshair'}`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp} // If mouse leaves canvas while drawing
          // style={{ width: '100%', height: '100%', objectFit: 'contain' }} // This might interfere with direct canvas sizing
        />
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="ml-2">{t('processingImage')}</p>
        </div>
      )}

      {/* TODO: TextEditToolbar Component will go here */}
      {selectedBlockId && ocrBlocks.find(b => b.id === selectedBlockId) && (
        <div className="mt-4 p-4 bg-gray-700 rounded">
          <h3 className="text-lg text-purple-300">Edit Text Block</h3>
          {/* Basic editing for now */}
          <textarea
            value={ocrBlocks.find(b => b.id === selectedBlockId)?.translatedText || ''}
            onChange={(e) => {
                const newText = e.target.value;
                setOcrBlocks(blocks => blocks.map(b => b.id === selectedBlockId ? {...b, translatedText: newText} : b))
            }}
            className="textarea textarea-bordered w-full my-2 bg-gray-800"
            rows={3}
          />
          <button onClick={() => setSelectedBlockId(null)} className="btn btn-sm btn-outline mr-2">{t('doneEditingBtn')}</button>
          <button onClick={() => handleDeleteBlock(selectedBlockId)} className="btn btn-sm btn-error">{t('deleteBlockBtn')}</button>
        </div>
      )}

      {/* Debug Info */}
      {/* ... */}

      {/* Export Section */}
      {originalImage && ocrBlocks.length > 0 && !isLoading && (
        <div className="mt-6 pt-6 border-t border-gray-700 flex flex-col sm:flex-row justify-center items-center gap-3">
          <span className="text-lg text-gray-300 mb-2 sm:mb-0">{t('exportOptionsLabel')}:</span>
          <div className="dropdown dropdown-top sm:dropdown-right">
            <button tabIndex={0} className="btn btn-accent btn-md m-1">
              {t('exportBtnLabel')}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-down ml-1" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
            <ul tabIndex={0} className="dropdown-content z-[10] menu p-2 shadow bg-base-200 rounded-box w-52">
              <li><button onClick={handleExportJson}>{t('exportJsonBtn')}</button></li>
              <li><button onClick={handleExportJpg}>{t('exportJpgBtn')}</button></li>
              <li><button onClick={handleExportPdf}>{t('exportPdfBtn')}</button></li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageTranslator;
