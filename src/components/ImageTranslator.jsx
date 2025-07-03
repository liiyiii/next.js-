// src/components/ImageTranslator.jsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import { ocrFullPage, ocrRegion } from '@/services/apiService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAlert } from '@/contexts/AlertContext';
// No OCRBlock import from types needed for JS
import TextEditToolbar from './TextEditToolbar'; // Assuming TextEditToolbar will also be .jsx

/**
 * @typedef {object} FontInfo
 * @property {string} [family] - e.g., "Arial", "宋体"
 * @property {number} [size] - Font size in pixels
 * @property {string} [weight] - e.g., "bold", "normal"
 * @property {string} [style] - e.g., "italic", "normal"
 */

/**
 * @typedef {object} ColorInfo
 * @property {string} [fgColor] - Foreground/text color as hex string, e.g., "#000000"
 * @property {string} [bgColor] - Background color of the text block as hex string, e.g., "#FFFFFF"
 */

/**
 * @typedef {object} OCRBlockData
 * @property {string} id - Unique ID for each block
 * @property {string} text - Original recognized text
 * @property {string} translatedText - Translated text
 * @property {[number, number, number, number]} blockBox - [x, y, width, height] relative to the original image
 * @property {FontInfo} [fontInfo]
 * @property {ColorInfo} [colorInfo]
 * @property {string} [type] - Type of content, if provided by OCR
 * @property {boolean} [isEditing] - If the block is currently being edited
 * @property {string} [currentEditText] - Temp storage for text being edited
 * @property {number} [fontSize] - User-defined font size (overrides fontInfo.size)
 * @property {string} [fontColor] - User-defined font color (overrides colorInfo.fgColor)
 * @property {{ x: number; y: number }} position - Absolute coordinates on the canvas at zoomLevel 1
 */

// interface ImageTranslatorProps {} // Removed

const ImageTranslator = () => { // Removed React.FC<ImageTranslatorProps>
  const { t } = useLanguage();
  const { showAlert } = useAlert();

  const [originalImage, setOriginalImage] = useState(null);
  const [displayedImageUrl, setDisplayedImageUrl] = useState(null);
  /** @type {[OCRBlockData[], Function]} */
  const [ocrBlocks, setOcrBlocks] = useState([]);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [currentDrawingRect, setCurrentDrawingRect] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const [isDraggingBlock, setIsDraggingBlock] = useState(false);
  const [dragStartCoords, setDragStartCoords] = useState(null);

  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const MAX_ZOOM = 5;
  const MIN_ZOOM = 0.2;
  const ZOOM_SENSITIVITY = 0.001;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    if (imageRef.current && imageRef.current.complete) {
      ctx.drawImage(imageRef.current, 0, 0);
    }

    ocrBlocks.forEach(block => {
      const [bbX, bbY, bbW, bbH] = block.blockBox;
      const blockX = block.position.x;
      const blockY = block.position.y;

      ctx.save();

      if (block.colorInfo?.bgColor) {
        ctx.fillStyle = block.colorInfo.bgColor;
        ctx.fillRect(blockX, blockY, bbW, bbH);
      }

      let borderColor = 'rgba(150, 150, 150, 0.5)';
      if (block.id === selectedBlockId) {
        borderColor = 'red';
        ctx.lineWidth = 2.5 / zoomLevel;
      } else if (block.colorInfo?.bgColor) {
         borderColor = 'rgba(0,0,0,0)';
      } else {
         ctx.lineWidth = 1.5 / zoomLevel;
      }

      if (borderColor !== 'rgba(0,0,0,0)') {
        ctx.strokeStyle = borderColor;
        ctx.strokeRect(blockX, blockY, bbW, bbH);
      }

      const textToRender = block.translatedText || block.text;
      if (textToRender) {
        const fontSize = block.fontSize || block.fontInfo?.size || 16;
        const fontColor = block.fontColor || block.colorInfo?.fgColor || 'black';
        const fontFamily = block.fontInfo?.family || 'Arial';
        const fontWeight = block.fontInfo?.weight || 'normal';
        const fontStyle = block.fontInfo?.style || 'normal';

        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = fontColor;

        ctx.beginPath();
        ctx.rect(blockX, blockY, bbW, bbH);
        ctx.clip();

        const padding = 5;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const lines = textToRender.split('\n');
        const lineHeight = fontSize * 1.2;

        for (let i = 0; i < lines.length; i++) {
          if ((i * lineHeight) < (bbH - padding)) {
            ctx.fillText(lines[i], blockX + padding, blockY + padding + (i * lineHeight), bbW - (2 * padding));
          } else {
            break;
          }
        }
      }
      ctx.restore();
    });

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
  }, [ocrBlocks, selectedBlockId, /*displayedImageUrl,*/ zoomLevel, panOffset, isDrawing, currentDrawingRect, /*imageRef*/]); // Removed some dependencies not directly read in draw

  useEffect(() => {
    const img = new Image();
    imageRef.current = img;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (canvas && imageRef.current) {
        canvas.width = imageRef.current.naturalWidth;
        canvas.height = imageRef.current.naturalHeight;
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
      }
      draw();
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


  /** @param {React.ChangeEvent<HTMLInputElement>} event */
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setOriginalImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDisplayedImageUrl(reader.result); // Removed 'as string'
        setOcrBlocks([]);
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
      const response = await ocrFullPage(originalImage, (progress) => {
        // console.log('Upload progress:', progress);
      });
      const blocksData = response.blockList && Array.isArray(response.blockList) ? response.blockList : [];

      const processedBlocks = blocksData.map((block, index) => ({
        id: `block-${Date.now()}-${index}`,
        text: block.text || '',
        translatedText: block.translatedText || block.text || '',
        blockBox: block.blockBox || [0,0,0,0],
        fontInfo: block.fontInfo,
        colorInfo: block.colorInfo,
        type: block.type,
        fontSize: block.fontInfo?.size || 16, // Initialize user-overrideable field from API if available
        fontColor: block.colorInfo?.fgColor || 'black', // Initialize user-overrideable field
        position: { x: block.blockBox[0], y: block.blockBox[1] }
      }));
      setOcrBlocks(processedBlocks);
    } catch (error) {
      console.error('Full page OCR error:', error);
      showAlert(error.message || t('ocrGenericError'), 'error');
      setOcrBlocks([]);
    } finally {
      setIsLoading(false);
    }
  };

  /** @param {React.MouseEvent<HTMLCanvasElement>} event */
  const getCanvasCoordinates = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoomLevel - panOffset.x / zoomLevel;
    const y = (event.clientY - rect.top) / zoomLevel - panOffset.y / zoomLevel;
    return { x, y };
  };

  /** @param {React.MouseEvent<HTMLCanvasElement>} event */
  const handleCanvasMouseDown = (event) => {
    const coords = getCanvasCoordinates(event);
    if (!coords) return;

    const clickedBlock = ocrBlocks.find(block => {
      const [bx, by, bw, bh] = block.blockBox;
      const blockX = block.position?.x ?? bx;
      const blockY = block.position?.y ?? by;
      return coords.x >= blockX && coords.x <= blockX + bw && coords.y >= blockY && coords.y <= blockY + bh;
    });

    if (clickedBlock) {
      setSelectedBlockId(clickedBlock.id);
      setIsDraggingBlock(true);
      setDragStartCoords(coords);
      setIsDrawing(false);
      setCurrentDrawingRect(null);
    } else {
      setSelectedBlockId(null);
      setIsDraggingBlock(false);
      setIsDrawing(true);
      setCurrentDrawingRect({ startX: coords.x, startY: coords.y, endX: coords.x, endY: coords.y });
    }
  };

  /** @param {React.MouseEvent<HTMLCanvasElement>} event */
  const handleCanvasMouseMove = (event) => {
    const coords = getCanvasCoordinates(event);
    if (!coords) return;

    if (isDraggingBlock && selectedBlockId && dragStartCoords) {
      const selectedBlock = ocrBlocks.find(b => b.id === selectedBlockId);
      if (!selectedBlock) return;

      const deltaX = coords.x - dragStartCoords.x;
      const deltaY = coords.y - dragStartCoords.y;
      const originalX = selectedBlock.position?.x ?? selectedBlock.blockBox[0];
      const originalY = selectedBlock.position?.y ?? selectedBlock.blockBox[1];
      const newX = originalX + deltaX;
      const newY = originalY + deltaY;

      setOcrBlocks(prevBlocks =>
        prevBlocks.map(b =>
          b.id === selectedBlockId ? { ...b, position: { x: newX, y: newY } } : b
        )
      );
    } else if (isDrawing && currentDrawingRect) {
      setCurrentDrawingRect(prev => prev ? { ...prev, endX: coords.x, endY: coords.y } : null);
    }
  };

  const handleCanvasMouseUp = async () => {
    if (isDraggingBlock) {
      setIsDraggingBlock(false);
      setDragStartCoords(null);
    }

    if (isDrawing && currentDrawingRect) {
      const { startX, startY, endX, endY } = currentDrawingRect;
      const width = Math.abs(startX - endX);
      const height = Math.abs(startY - endY);

      if (width > 5 && height > 5) {
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
          const processedNewBlocks = newBlocksData.map((block, index) => ({
            id: `block-region-${Date.now()}-${index}`,
            text: block.text || '',
            translatedText: block.translatedText || block.text || '',
            blockBox: block.blockBox || [0,0,0,0],
            fontInfo: block.fontInfo,
            colorInfo: block.colorInfo,
            type: block.type,
            fontSize: block.fontInfo?.size || 16,
            fontColor: block.colorInfo?.fgColor || 'black', // Corrected: removed .hex fallback
            position: {
              x: region.x + (block.blockBox?.[0] || 0),
              y: region.y + (block.blockBox?.[1] || 0)
            }
          }));
          setOcrBlocks(prevBlocks => [...prevBlocks, ...processedNewBlocks]);
        } catch (error) {
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

  /** @param {React.WheelEvent<HTMLCanvasElement>} event */
  const handleZoom = (event) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const mouseBeforeZoomX = (mouseX - panOffset.x) / zoomLevel;
    const mouseBeforeZoomY = (mouseY - panOffset.y) / zoomLevel;

    const delta = event.deltaY * ZOOM_SENSITIVITY * -1;
    let newZoomLevel = zoomLevel + delta;
    newZoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoomLevel));

    const newPanX = mouseX - mouseBeforeZoomX * newZoomLevel;
    const newPanY = mouseY - mouseBeforeZoomY * newZoomLevel;

    setZoomLevel(newZoomLevel);
    setPanOffset({ x: newPanX, y: newPanY });
  };

  /** @param {OCRBlockData} updatedBlock */
  const handleUpdateBlock = (updatedBlock) => {
    setOcrBlocks(prev => prev.map(b => b.id === updatedBlock.id ? updatedBlock : b));
    setSelectedBlockId(null);
  };

  /** @param {string} blockId */
  const handleDeleteBlock = (blockId) => {
    setOcrBlocks(prev => prev.filter(b => b.id !== blockId));
    setSelectedBlockId(null);
  };

  const handleExportJson = () => {
    if (!ocrBlocks.length) {
      showAlert(t('noDataToExport'), 'warning');
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

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageRef.current.naturalWidth;
    tempCanvas.height = imageRef.current.naturalHeight;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
      showAlert(t('cannotCreateCanvasError'), 'error');
      return;
    }

    tempCtx.drawImage(imageRef.current, 0, 0);

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
    const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.9);

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
    const orientation = imgWidth > imgHeight ? 'l' : 'p';
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'px',
      format: [imgWidth, imgHeight]
    });

    let imageFormat = 'JPEG';
    if (originalImage?.type === 'image/png') {
      imageFormat = 'PNG';
    }
    pdf.addImage(displayedImageUrl, imageFormat, 0, 0, imgWidth, imgHeight);

    ocrBlocks.forEach(block => {
      const [bbX, bbY, bbW, bbH] = block.blockBox;
      const blockX = block.position.x;
      const blockY = block.position.y;

      if (block.colorInfo?.bgColor) {
        pdf.setFillColor(block.colorInfo.bgColor);
        pdf.rect(blockX, blockY, bbW, bbH, 'F');
      }

      const textToRender = block.translatedText || block.text;
      if (textToRender) {
        const fontSize = block.fontSize || block.fontInfo?.size || 12;
        const fontColor = block.fontColor || block.colorInfo?.fgColor || '#000000';
        const fontFamily = block.fontInfo?.family || 'helvetica';

        let fontStyle = 'normal';
        if (block.fontInfo?.weight === 'bold' && block.fontInfo?.style === 'italic') {
          fontStyle = 'bolditalic';
        } else if (block.fontInfo?.weight === 'bold') {
          fontStyle = 'bold';
        } else if (block.fontInfo?.style === 'italic') {
          fontStyle = 'italic';
        }
        pdf.setFont(fontFamily, fontStyle); // Note: jsPDF needs fonts to be registered if not standard
        pdf.setFontSize(fontSize);
        pdf.setTextColor(fontColor);

        const textLines = pdf.splitTextToSize(textToRender, bbW - 2 * 5);
        pdf.text(textLines, blockX + 5, blockY + fontSize * 0.8 + 5); // Approx baseline
      }
    });

    const filename = originalImage?.name ? `${originalImage.name.split('.')[0]}_translated.pdf` : 'translated_document.pdf';
    pdf.save(filename);
    showAlert(t('exportPdfSuccess'), 'success');
  };


  return (
    <div className="p-4 md:p-6 bg-gray-800 text-white rounded-lg shadow-2xl">
      {/* <h2 className="text-2xl font-semibold mb-6 text-purple-400 text-center">{t('imageTranslatorTitle')}</h2> */}

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
          disabled={!originalImage || isLoading || isDrawing}
          className="btn btn-primary btn-wide sm:btn-md"
        >
          {isLoading && !isDrawing ? (
            <>
              <span className="loading loading-spinner"></span>
              {t('processingImage')}
            </>
          ) : t('translateFullImageBtn')}
        </button>
      </div>

      <div
        className="w-full aspect-[4/3] max-h-[70vh] overflow-hidden border-2 border-gray-600 rounded-md relative bg-gray-700 shadow-inner"
        onWheel={handleZoom}
      >
        <canvas
          ref={canvasRef}
          className={`cursor-crosshair ${isDraggingBlock ? 'cursor-grabbing' : 'cursor-crosshair'}`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        />
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="ml-2">{t('processingImage')}</p>
        </div>
      )}

      <TextEditToolbar
        selectedBlockData={ocrBlocks.find(b => b.id === selectedBlockId) || null}
        onUpdateBlock={handleUpdateBlock}
        onDeleteBlock={handleDeleteBlock}
        onClose={() => setSelectedBlockId(null)}
      />

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
