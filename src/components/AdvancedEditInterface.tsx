// src/components/AdvancedEditInterface.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ocrFullPage, ocrRegion } from '@/services/apiService';
import { useAlert } from '@/contexts/AlertContext';
import { Trash2, Type, Palette, Move, Download, Edit3, CheckSquare, Square, ZoomIn, ZoomOut, PaletteIcon, BaselineIcon, PilcrowIcon } from 'lucide-react';
import TiptapEditor from './TiptapEditor';
import EditorToolbar from './EditorToolbar';
import { Editor } from '@tiptap/react';


interface AdvancedEditInterfaceProps {
  file: File;
  pageNumber: number;
  onExit: () => void;
}

interface TextBlock {
  id: string;
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  isEditing: boolean;
}

const AdvancedEditInterface: React.FC<AdvancedEditInterfaceProps> = ({ file, pageNumber, onExit }) => {
  const { t } = useLanguage();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(true);
  const [errorLoadingPage, setErrorLoadingPage] = useState<string | null>(null);
  const [pdfJsLibInstance, setPdfJsLibInstance] = useState<any>(null);
  const { showAlert } = useAlert();

  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [isOcrLoading, setIsOcrLoading] = useState<boolean>(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isDrawingBox, setIsDrawingBox] = useState<boolean>(false);
  const [selectionBox, setSelectionBox] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [tempBox, setTempBox] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const drawStartPos = useRef<{x: number, y: number} | null>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawModeEnabled, setIsDrawModeEnabled] = useState<boolean>(false);
  const editorRef = useRef<Editor | null>(null);
  const [editingBlockContent, setEditingBlockContent] = useState<string>('');
  const [activeDragHandle, setActiveDragHandle] = useState<string | null>(null);
  const dragStartBlockPos = useRef<{x: number, y: number, width: number, height: number, mouseX: number, mouseY: number} | null>(null);

  const [toolbarPosition, setToolbarPosition] = useState<{ top: number, left: number } | null>(null);
  const [showContextualToolbar, setShowContextualToolbar] = useState<boolean>(false);
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);


  useEffect(() => {
    if ((window as any).pdfjsLib) {
      setPdfJsLibInstance((window as any).pdfjsLib);
    } else {
      console.warn("PDF.js library not immediately available in AdvancedEditInterface.");
      const timer = setTimeout(() => {
        if (!(window as any).pdfjsLib) {
          setErrorLoadingPage("PDF library failed to load. Please ensure PDF.js worker is configured.");
        } else {
          setPdfJsLibInstance((window as any).pdfjsLib);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!file || !pdfJsLibInstance) {
      if (file && !pdfJsLibInstance && !errorLoadingPage) setIsLoadingPage(true);
      else setIsLoadingPage(false);
      return;
    }

    setIsLoadingPage(true);
    setErrorLoadingPage(null);
    const reader = new FileReader();

    reader.onload = async (e) => {
      if (e.target?.result) {
        const typedArray = new Uint8Array(e.target.result as ArrayBuffer);
        let pdfDoc: any = null;
        try {
          pdfDoc = await pdfJsLibInstance.getDocument({ data: typedArray }).promise;
          if (pageNumber > 0 && pageNumber <= pdfDoc.numPages) {
            const page = await pdfDoc.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
              await page.render({ canvasContext: context, viewport: viewport }).promise;
              setImageUrl(canvas.toDataURL('image/png'));
              setImageDimensions({ width: canvas.width, height: canvas.height });
            } else {
              throw new Error("Failed to get canvas context");
            }
          } else {
            throw new Error(`Page number ${pageNumber} is out of range (1-${pdfDoc.numPages})`);
          }
        } catch (err: any) {
          console.error("Error rendering PDF page to image:", err);
          setErrorLoadingPage(err.message || "Failed to render PDF page.");
        } finally {
          if (pdfDoc) {
            pdfDoc.destroy();
          }
          setIsLoadingPage(false);
        }
      }
    };
    reader.onerror = (e) => {
      console.error("FileReader error:", e);
      setErrorLoadingPage("Failed to read file.");
      setIsLoadingPage(false);
    };
    reader.readAsArrayBuffer(file);
  }, [file, pageNumber, pdfJsLibInstance, errorLoadingPage]);


  const dataURLtoFile = (dataurl: string, filename: string): File | null => {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  useEffect(() => {
    if (imageUrl && !textBlocks.length && !isOcrLoading && !isLoadingPage) {
      const imageFile = dataURLtoFile(imageUrl, `page_${pageNumber}_image.png`);
      if (imageFile) {
        handleFullPageOcr(imageFile);
      } else {
        const errorMsg = "Failed to prepare image for OCR.";
        setOcrError(errorMsg);
        showAlert(errorMsg, "error");
      }
    }
  }, [imageUrl, pageNumber, isLoadingPage]);

  const handleFullPageOcr = async (imageFile: File) => {
    setIsOcrLoading(true);
    setOcrError(null);
    try {
      const response = await ocrFullPage(imageFile);
      if (response && response.text_blocks) {
        const newTextBlocks: TextBlock[] = response.text_blocks.map((block: any, index: number) => ({
          id: `tb-${Date.now()}-${index}`,
          text: block.text,
          x: block.x,
          y: block.y,
          width: block.width,
          height: block.height,
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#000000',
          isEditing: false,
        }));
        setTextBlocks(newTextBlocks);
      } else {
        throw new Error("Invalid OCR response format.");
      }
    } catch (error: any) {
      console.error("Full page OCR error:", error);
      const errorMessage = error.message || "Failed to perform OCR on the page.";
      setOcrError(errorMessage);
      showAlert(errorMessage, "error");
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleDownloadImage = () => {
    if (!imageUrl || !imageDimensions) {
        showAlert(t('cannotDownloadNoImage') || "Cannot download: Image not loaded.", "error");
        return;
    }

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = imageDimensions.width;
    exportCanvas.height = imageDimensions.height;
    const ctx = exportCanvas.getContext('2d');

    if (!ctx) {
        showAlert(t('cannotCreateCanvasError') || "Cannot download: Failed to create canvas context.", "error");
        return;
    }

    const img = new Image();
    img.onload = () => {
        ctx.drawImage(img, 0, 0, imageDimensions.width, imageDimensions.height);

        textBlocks.forEach(block => {
            ctx.font = `${block.fontSize}px ${block.fontFamily}`;
            ctx.fillStyle = block.color;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            let plainText = block.text;
            if (editorRef.current && selectedBlockId === block.id && block.isEditing) {
                plainText = editorRef.current.getText({ blockSeparator: '\n' });
            } else {
                 const tempDiv = document.createElement('div');
                 tempDiv.innerHTML = block.text;
                 plainText = tempDiv.textContent || tempDiv.innerText || "";
            }

            const lines = plainText.split('\n');
            let currentYOffset = 0;
            const lineHeight = block.fontSize * 1.2;

            lines.forEach(line => {
                if (block.width) {
                    let words = line.split(' ');
                    let currentCanvasLine = '';
                    let lineStartX = block.x;
                    let lineStartY = block.y + currentYOffset;

                    for (let n = 0; n < words.length; n++) {
                        let testLine = currentCanvasLine + words[n] + ' ';
                        let metrics = ctx.measureText(testLine);
                        if (metrics.width > block.width && n > 0) {
                            ctx.fillText(currentCanvasLine.trim(), lineStartX, lineStartY);
                            currentCanvasLine = words[n] + ' ';
                            lineStartY += lineHeight;
                        } else {
                            currentCanvasLine = testLine;
                        }
                    }
                    ctx.fillText(currentCanvasLine.trim(), lineStartX, lineStartY);
                    currentYOffset = (lineStartY - block.y) + lineHeight;
                } else {
                     ctx.fillText(line, block.x, block.y + currentYOffset);
                     currentYOffset += lineHeight;
                }
            });
        });

        const dataUrl = exportCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `edited_page_${pageNumber}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showAlert(t('imageDownloadSuccess') || "Image download started!", "success");
    };
    img.onerror = () => {
        showAlert(t('imageLoadFailedForDownload') || "Failed to load image for download.", "error");
    };
    img.src = imageUrl;
};

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawModeEnabled || !imageContainerRef.current) return;
    event.preventDefault();

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    drawStartPos.current = { x, y };
    setIsDrawingBox(true);
    setTempBox({ x, y, width: 0, height: 0 });
    setSelectionBox(null);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingBox || !drawStartPos.current || !imageContainerRef.current) return;
    event.preventDefault();

    const rect = imageContainerRef.current.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    const startX = drawStartPos.current.x;
    const startY = drawStartPos.current.y;

    const newX = Math.min(startX, currentX);
    const newY = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    setTempBox({ x: newX, y: newY, width, height });
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingBox || !tempBox ) return;
    event.preventDefault();

    setIsDrawingBox(false);
    if (tempBox.width > 5 && tempBox.height > 5) {
        setSelectionBox(tempBox);
    } else {
        setSelectionBox(null);
    }
    setTempBox(null);
    drawStartPos.current = null;
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDrawingBox) {
        setIsDrawingBox(false);
        setTempBox(null);
        drawStartPos.current = null;
    }
  };

  const handleSelectBlock = (blockId: string, event?: React.MouseEvent) => {
    if (isDrawModeEnabled) return;

    if (selectedBlockId === blockId && event) {
        return;
    }

    setSelectedBlockId(blockId);
    const block = textBlocks.find(b => b.id === blockId);
    if (block) {
        setEditingBlockContent(block.text);

        if (imageContainerRef.current && event) {
            const containerRect = imageContainerRef.current.getBoundingClientRect();
            const blockElement = event.currentTarget as HTMLDivElement;
            const blockRect = blockElement.getBoundingClientRect();

            let top = blockRect.top - containerRect.top - 60;
            if (top < 0) top = blockRect.bottom - containerRect.top + 10;

            let left = blockRect.left - containerRect.left;
            if (left + 300 > containerRect.width) {
                left = containerRect.width - 300;
            }
            if (left < 0) left = 0;

            setToolbarPosition({ top, left });
            setShowContextualToolbar(true);
        } else if (block) {
             setToolbarPosition({ top: block.y - 60, left: block.x });
             setShowContextualToolbar(true);
        }
    } else {
        setShowContextualToolbar(false);
    }
    setIsDrawModeEnabled(false);
    setSelectionBox(null);
  };

  const handleDoubleClickToEdit = (blockId: string) => {
    if (isDrawModeEnabled) return;
    setTextBlocks(prev => prev.map(b => b.id === blockId ? { ...b, isEditing: true } : { ...b, isEditing: false }));
    setSelectedBlockId(blockId);
    const block = textBlocks.find(b => b.id === blockId);
    if (block) {
      setEditingBlockContent(block.text);
      setShowContextualToolbar(false);
    }
  };

  const handleSaveBlockEdit = (blockId: string) => {
    setTextBlocks(prev => prev.map(b => b.id === blockId ? { ...b, text: editingBlockContent, isEditing: false } : b));
    const block = textBlocks.find(b => b.id === blockId);
    if (block) {
        setToolbarPosition({ top: block.y - 60, left: block.x });
        setShowContextualToolbar(true);
    }
  };

  const handleCancelBlockEdit = (blockId: string) => {
     setTextBlocks(prev => prev.map(b => b.id === blockId ? { ...b, isEditing: false } : b));
    const block = textBlocks.find(b => b.id === blockId);
    if (block) {
        setToolbarPosition({ top: block.y - 60, left: block.x });
        setShowContextualToolbar(true);
    }
  };

  const updateTextBlockStyle = (blockId: string, styles: Partial<TextBlock>) => {
    setTextBlocks(prev => prev.map(b => b.id === blockId ? { ...b, ...styles } : b));
  };

  const handleDeleteBlock = (blockId: string) => {
    setTextBlocks(prev => prev.filter(b => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
      setShowContextualToolbar(false);
    }
  };

    const handleBlockMouseDown = (e: React.MouseEvent<HTMLDivElement>, blockId: string, handleName?: string) => {
        if (isDrawModeEnabled) return;
        e.stopPropagation();

        const block = textBlocks.find(b => b.id === blockId);
        if (!block || block.isEditing) return;

        setSelectedBlockId(blockId);
        handleSelectBlock(blockId, e);

        const mouseX = e.clientX;
        const mouseY = e.clientY;

        if (handleName) {
            setActiveDragHandle(handleName);
            dragStartBlockPos.current = { x: block.x, y: block.y, width: block.width || 0, height: block.height || 0, mouseX, mouseY };
        } else {
            setActiveDragHandle('move');
            dragStartBlockPos.current = { x: block.x, y: block.y, width: block.width || 0, height: block.height || 0, mouseX, mouseY };
        }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!activeDragHandle || !dragStartBlockPos.current || !selectedBlockId) return;

        const dx = e.clientX - dragStartBlockPos.current.mouseX;
        const dy = e.clientY - dragStartBlockPos.current.mouseY;
        const { x, y, width, height } = dragStartBlockPos.current;

        let newX = x, newY = y, newWidth = width, newHeight = height;

        if (activeDragHandle === 'move') {
            newX = x + dx;
            newY = y + dy;
        } else {
            if (activeDragHandle.includes('r')) newWidth = width + dx;
            if (activeDragHandle.includes('l')) {
                newWidth = width - dx;
                newX = x + dx;
            }
            if (activeDragHandle.includes('b')) newHeight = height + dy;
            if (activeDragHandle.includes('t')) {
                newHeight = height - dy;
                newY = y + dy;
            }
            if (newWidth < 20) { newWidth = 20; if (activeDragHandle.includes('l')) newX = x + width - 20; }
            if (newHeight < 20) { newHeight = 20; if (activeDragHandle.includes('t')) newY = y + height - 20; }
        }

        setTextBlocks(prev => prev.map(b => b.id === selectedBlockId ? { ...b, x: newX, y: newY, width: newWidth, height: newHeight } : b));
        if (toolbarPosition) {
             setToolbarPosition({ top: newY - 60, left: newX });
        }
    };

    const handleGlobalMouseUp = () => {
        setActiveDragHandle(null);
        dragStartBlockPos.current = null;
    };

    useEffect(() => {
        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [activeDragHandle]);


  const handleOcrSelectedRegion = async () => {
    if (!selectionBox || !imageUrl) {
      showAlert(t('noRegionSelectedError') || "No region selected for OCR.", "warning");
      return;
    }

    const imageFile = dataURLtoFile(imageUrl, `page_${pageNumber}_image.png`);
    if (!imageFile) {
      const errorMsg = "Failed to prepare image for OCR.";
      setOcrError(errorMsg);
      showAlert(errorMsg, "error");
      return;
    }

    setIsOcrLoading(true);
    setOcrError(null);

    try {
      const response = await ocrRegion(imageFile, selectionBox);

      if (response && response.text) {
        const newBlock: TextBlock = {
          id: `tb-region-${Date.now()}`,
          text: `<p>${response.text.replace(/\n/g, '</p><p>')}</p>`,
          x: selectionBox.x,
          y: selectionBox.y,
          width: selectionBox.width,
          height: selectionBox.height,
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#0000FF',
          isEditing: false,
        };
        setTextBlocks(prevBlocks => [...prevBlocks, newBlock]);
        showAlert(t('ocrRegionSuccess') || "Region OCR successful!", "success");
      } else {
        throw new Error(t('invalidOcrRegionResponse') || "Invalid OCR response for region.");
      }
    } catch (error: any) {
      console.error("Region OCR error:", error);
      const errorMessage = error.message || (t('ocrRegionFailedError') || "Failed to perform OCR on the selected region.");
      setOcrError(errorMessage);
      showAlert(errorMessage, "error");
    } finally {
      setIsOcrLoading(false);
      setSelectionBox(null);
      setIsDrawModeEnabled(false);
    }
  };


  if (isLoadingPage) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700 min-h-[500px]">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2 animate-spin text-purple-400 mb-4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <p className="text-gray-300 text-xl">{t('loadingPageForEditing') || 'Loading page for editing...'}</p>
      </div>
    );
  }

  if (errorLoadingPage) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700 min-h-[500px]">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle text-red-500 mb-4"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        <p className="text-red-400 text-xl mb-4">{t('errorLoadingPage') || 'Error loading page:'}</p>
        <p className="text-red-400 text-center">{errorLoadingPage}</p>
        <button
            onClick={onExit}
            className="mt-6 bg-gray-600 text-white px-6 py-2 rounded-lg text-md font-semibold hover:bg-gray-700 transition-colors"
        >
            {t('goBackButton') || 'Go Back'}
        </button>
      </div>
    );
  }

  if (!imageUrl) {
     return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700 min-h-[500px]">
        <p className="text-gray-500 text-xl">{t('noPageToDisplay') || 'No page image to display. Please ensure the PDF was processed correctly.'}</p>
         <button
            onClick={onExit}
            className="mt-6 bg-gray-600 text-white px-6 py-2 rounded-lg text-md font-semibold hover:bg-gray-700 transition-colors"
        >
            {t('goBackButton') || 'Go Back'}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Toolbar */}
      <div className="w-full bg-gray-700 p-2 mb-4 rounded-md shadow flex justify-start space-x-2">
        <button
          className={`px-3 py-1 text-white rounded text-sm ${isDrawModeEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          onClick={() => setIsDrawModeEnabled(!isDrawModeEnabled)}
          disabled={isOcrLoading}
        >
          {isDrawModeEnabled ? (t('cancelDrawModeBtn') || '取消框选') : (t('drawSelectionBoxBtn') || '框选识别')}
        </button>
        {selectionBox && (
          <button
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm ml-2"
            onClick={handleOcrSelectedRegion}
            disabled={isOcrLoading || !selectionBox}
          >
            {t('ocrSelectedRegionBtn') || '识别选中区域'}
          </button>
        )}
        <button
            className="px-3 py-1 bg-teal-500 text-white rounded hover:bg-teal-600 text-sm ml-auto"
            onClick={handleDownloadImage}
            disabled={isOcrLoading || isLoadingPage || !imageUrl}
            title={t('downloadEditedImageBtn') || "Download Edited Image"}
        >
            <Download size={18} />
        </button>
      </div>

      {/* Image Display Area */}
      <div
        ref={imageContainerRef}
        className={`relative w-full max-w-4xl border-2 border-gray-600 overflow-auto ${isDrawModeEnabled ? 'cursor-crosshair' : 'cursor-default'}`}
        style={{ aspectRatio: imageDimensions ? `${imageDimensions.width}/${imageDimensions.height}` : 'auto' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <img src={imageUrl} alt={`Page ${pageNumber} from ${file.name}`} className="block max-w-full max-h-[80vh]" draggable="false" />

        {textBlocks.map(block => {
          if (block.isEditing && selectedBlockId === block.id) {
            return (
              <div
                key={block.id}
                style={{
                  position: 'absolute',
                  left: `${block.x}px`,
                  top: `${block.y}px`,
                  width: block.width ? `${block.width}px` : 'auto',
                  minWidth: '100px',
                  height: block.height ? `${block.height}px` : 'auto',
                  minHeight: '50px',
                  zIndex: 10,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <EditorToolbar editor={editorRef.current} />
                <TiptapEditor
                  content={editingBlockContent}
                  onChange={setEditingBlockContent}
                  editorInstanceRef={editorRef}
                />
                <div className="mt-1 flex gap-1">
                    <button onClick={() => handleSaveBlockEdit(block.id)} className="p-1 bg-green-500 text-white rounded text-xs hover:bg-green-600">Save</button>
                    <button onClick={() => handleCancelBlockEdit(block.id)} className="p-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500">Cancel</button>
                </div>
              </div>
            );
          }
          return (
            <div
              key={block.id}
              style={{
                position: 'absolute',
                left: `${block.x}px`,
                top: `${block.y}px`,
                width: block.width ? `${block.width}px` : 'auto',
                height: block.height ? `${block.height}px` : 'auto',
                border: selectedBlockId === block.id ? '2px solid #3b82f6' : '1px dashed #6b7280',
                color: block.color,
                fontSize: `${block.fontSize}px`,
                fontFamily: block.fontFamily,
                cursor: activeDragHandle ? 'grabbing' : 'grab',
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
                backgroundColor: selectedBlockId === block.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 0, 0.1)',
                userSelect: 'none',
              }}
              onClick={(e) => handleSelectBlock(block.id, e)}
              onDoubleClick={() => handleDoubleClickToEdit(block.id)}
              onMouseDown={(e) => handleBlockMouseDown(e, block.id)}
            >
              <div dangerouslySetInnerHTML={{ __html: block.text }} />
              {selectedBlockId === block.id && !block.isEditing && (
                <>
                  <div onMouseDown={(e) => handleBlockMouseDown(e, block.id, 'br')} className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-se-resize"></div>
                  <div onMouseDown={(e) => handleBlockMouseDown(e, block.id, 'bl')} className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-sw-resize"></div>
                  <div onMouseDown={(e) => handleBlockMouseDown(e, block.id, 'tr')} className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-ne-resize"></div>
                  <div onMouseDown={(e) => handleBlockMouseDown(e, block.id, 'tl')} className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nw-resize"></div>
                </>
              )}
            </div>
          );
        })}

        {showContextualToolbar && selectedBlockId && toolbarPosition && !textBlocks.find(b=>b.id===selectedBlockId)?.isEditing && (
          <div
            style={{
              position: 'absolute',
              top: `${toolbarPosition.top}px`,
              left: `${toolbarPosition.left}px`,
              zIndex: 20,
            }}
            className="bg-gray-700 shadow-xl rounded-md"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
                <EditorToolbar editor={editorRef.current} />
                 <button
                    onClick={() => handleDeleteBlock(selectedBlockId!)}
                className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 ml-auto block mt-1 mb-1 mr-1"
                title="Delete Block"
            >
                <Trash2 size={16} />
            </button>
          </div>
        )}

        {isOcrLoading && (
            <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex flex-col items-center justify-center z-20">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-scan-text animate-pulse text-purple-400 mb-3"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/><path d="M12 17v-5"/></svg>
                <p className="text-gray-300 text-lg">{t('performingOcr') || 'Performing OCR...'}</p>
            </div>
        )}
        {ocrError && !isOcrLoading && (
             <div className="absolute inset-0 bg-gray-800 bg-opacity-85 flex flex-col items-center justify-center z-20 p-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle text-red-400 mb-3"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                <p className="text-red-400 text-lg text-center mb-2">{t('ocrFailedError') || 'OCR Failed'}</p>
                <p className="text-red-400 text-sm text-center">{ocrError}</p>
            </div>
        )}

        {(tempBox || selectionBox) && (
          <div
            style={{
              position: 'absolute',
              left: `${(tempBox || selectionBox)!.x}px`,
              top: `${(tempBox || selectionBox)!.y}px`,
              width: `${(tempBox || selectionBox)!.width}px`,
              height: `${(tempBox || selectionBox)!.height}px`,
              border: '2px solid #00ff00',
              backgroundColor: 'rgba(0, 255, 0, 0.1)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

       <button
        onClick={onExit}
        className="mt-8 bg-red-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
        disabled={isOcrLoading}
      >
        {t('finishEditingBtn') || '完成编辑并退出'}
      </button>
    </div>
  );
};

export default AdvancedEditInterface;
