'use client';

import React, { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';

interface TextBlock {
  id: string;
  text: string;
  translatedText?: string; // Added for translation
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  // Future: add style properties like fontSize, fill, etc.
}

interface ImageCanvasProps {
  imageUrl?: string | null;
  blocks?: TextBlock[];
  onTextSelect?: (block: TextBlock, fabricObject: fabric.Object) => void;
  onAreaSelect?: (bbox: [number, number, number, number]) => void; // For 框选补漏
  canvasWidth?: number;
  canvasHeight?: number;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({
  imageUrl,
  blocks = [],
  onTextSelect,
  onAreaSelect,
  canvasWidth = 800, // Default width
  canvasHeight = 600, // Default height
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const imageScaleFactor = useRef<number>(1); // To store the scale of the image relative to its original size

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: '#374151', // gray-700, a bit darker
      selectionColor: 'rgba(59, 130, 246, 0.3)', // selectionVisual.color
      selectionBorderColor: '#8b5cf6', // selectionVisual.border
      selectionLineWidth: 1, // Adjusted from 2px
    });
    fabricCanvasRef.current = canvas;

    // Basic panning (Alt + Drag or Middle Mouse Button Drag)
    canvas.on('mouse:down', function(opt) {
      const evt = opt.e;
      if (evt.altKey === true || opt.button === 1) { // opt.button === 1 is usually middle mouse
        this.isDragging = true;
        this.selection = false;
        this.lastPosX = evt.clientX;
        this.lastPosY = evt.clientY;
      }
    });
    canvas.on('mouse:move', function(opt) {
      if (this.isDragging) {
        const e = opt.e;
        const vpt = this.viewportTransform;
        if (vpt) {
            vpt[4] += e.clientX - this.lastPosX;
            vpt[5] += e.clientY - this.lastPosY;
            this.requestRenderAll();
            this.lastPosX = e.clientX;
            this.lastPosY = e.clientY;
        }
      }
    });
    canvas.on('mouse:up', function(opt) {
      if (this.isDragging) {
        this.setViewportTransform(this.viewportTransform);
        this.isDragging = false;
        this.selection = true;
      }
    });

    // Zooming with mouse wheel
    canvas.on('mouse:wheel', function(opt) {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.1) zoom = 0.1; // Min zoom
      // canvas.setZoom(zoom); // Simple zoom, might not zoom to cursor
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Handle text block selection
    canvas.on('mouse:up', (options) => {
        if (options.target && options.target.data && options.target.data.id && options.target.data.type === 'textBlockRect') {
            const selectedFabricObject = options.target;
            const blockId = selectedFabricObject.data.id;
            const relatedBlock = blocks.find(b => b.id === blockId);
            if (relatedBlock && onTextSelect) {
                // Pass the original block data and the fabric object (the rect)
                onTextSelect(relatedBlock, selectedFabricObject);
            }
        }
    });


    // Cleanup
    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [canvasWidth, canvasHeight, blocks, onTextSelect]); // Added dependencies

  // Load image and draw blocks
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Clear previous objects but keep background image logic separate
    canvas.remove(...canvas.getObjects().filter(obj => obj.type !== 'image'));


    if (!imageUrl) {
        canvas.setBackgroundImage(undefined, canvas.renderAll.bind(canvas));
        canvas.setBackgroundColor('#374151', canvas.renderAll.bind(canvas));
        return;
    }

    fabric.Image.fromURL(imageUrl, (img) => {
      if (!fabricCanvasRef.current) return;

      const imgWidth = img.width || canvasWidth;
      const imgHeight = img.height || canvasHeight;

      const currentCanvas = fabricCanvasRef.current;
      currentCanvas.setWidth(imgWidth); // Resize canvas to image size
      currentCanvas.setHeight(imgHeight);
      imageScaleFactor.current = 1; // Image is at its original size on canvas

      img.set({ left: 0, top: 0, selectable: false, evented: false, originX: 'left', originY: 'top' });

      currentCanvas.setBackgroundImage(img, currentCanvas.renderAll.bind(currentCanvas));

      blocks.forEach(block => {
        const [x1, y1, x2, y2] = block.bbox;
        // Create a transparent rectangle that is selectable
        const fabricRect = new fabric.Rect({
          left: x1 * imageScaleFactor.current,
          top: y1 * imageScaleFactor.current,
          width: (x2 - x1) * imageScaleFactor.current,
          height: (y2 - y1) * imageScaleFactor.current,
          fill: 'rgba(59, 130, 246, 0.2)', // Semi-transparent fill for visibility
          stroke: '#8b5cf6',
          strokeWidth: 1,
          selectable: true,
          hoverCursor: 'pointer',
          data: { id: block.id, type: 'textBlockRect' },
        });
        currentCanvas.add(fabricRect);

        // Add text element (non-selectable, visually represents the text)
        const textContent = block.translatedText || block.text;
        const fabricText = new fabric.Text(textContent, {
            left: (x1 * imageScaleFactor.current) + 2, // Small padding
            top: (y1 * imageScaleFactor.current) + 2, // Small padding
            fontSize: 12, // Placeholder, should be dynamic based on block.style or global settings
            fill: '#FFFFFF', // White text for better visibility on dark overlays
            selectable: false,
            evented: false, // Text itself is not interactive, rect is
            data: { id: block.id, type: 'textDisplay' }
        });
        // Ensure text fits within the bbox, rough estimate
        if (fabricText.width && fabricText.width > (x2-x1) * imageScaleFactor.current - 4) {
            fabricText.scaleToWidth((x2-x1) * imageScaleFactor.current - 4);
        }

        currentCanvas.add(fabricText);
      });
      currentCanvas.renderAll();
    }, { crossOrigin: 'anonymous' });

  }, [imageUrl, blocks, canvasWidth, canvasHeight]);


  // Area selection for "框选补漏"
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !onAreaSelect) return;

    let isDrawingRectMode = true; // Assume we want to enable this by default if onAreaSelect is provided
    let isMouseDown = false;
    let startX: number, startY: number;
    let drawnRect: fabric.Rect | null = null;

    const handleMouseDown = (o: fabric.IEvent) => {
      if (o.target || o.e.altKey || o.button === 1 || !isDrawingRectMode) { // o.button === 1 for middle mouse
        isMouseDown = false; // Ensure not to draw if clicking object or panning
        return;
      }
      isMouseDown = true;
      const pointer = canvas.getPointer(o.e);
      startX = pointer.x;
      startY = pointer.y;

      drawnRect = new fabric.Rect({
        left: startX,
        top: startY,
        width: 0,
        height: 0,
        fill: 'rgba(16, 185, 129, 0.3)', // legacyStyle green, slightly more transparent
        stroke: '#10b981',
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(drawnRect);
    };

    const handleMouseMove = (o: fabric.IEvent) => {
      if (!isMouseDown || !drawnRect || !isDrawingRectMode) return;
      const pointer = canvas.getPointer(o.e);
      drawnRect.set({
        width: Math.abs(pointer.x - startX),
        height: Math.abs(pointer.y - startY),
        left: Math.min(pointer.x, startX),
        top: Math.min(pointer.y, startY),
      });
      canvas.renderAll();
    };

    const handleMouseUp = (o: fabric.IEvent) => {
      if (!isMouseDown || !drawnRect || !isDrawingRectMode) {
        isMouseDown = false; // Reset if mouse was up outside of drawing mode
        return;
      }
      isMouseDown = false;

      const finalWidth = drawnRect.width || 0;
      const finalHeight = drawnRect.height || 0;

      if (finalWidth > 5 && finalHeight > 5) {
        const finalX1 = drawnRect.left || 0;
        const finalY1 = drawnRect.top || 0;

        // Adjust for canvas zoom and pan to get original image coordinates
        const vpt = canvas.viewportTransform;
        let finalBbox: [number, number, number, number];
        if (vpt) {
            const zoom = canvas.getZoom();
            const adjX1 = (finalX1 - vpt[4]) / zoom;
            const adjY1 = (finalY1 - vpt[5]) / zoom;
            const adjX2 = (finalX1 + finalWidth - vpt[4]) / zoom;
            const adjY2 = (finalY1 + finalHeight - vpt[5]) / zoom;
            finalBbox = [
                adjX1 / imageScaleFactor.current,
                adjY1 / imageScaleFactor.current,
                adjX2 / imageScaleFactor.current,
                adjY2 / imageScaleFactor.current
            ];
        } else {
             finalBbox = [
                finalX1 / imageScaleFactor.current,
                finalY1 / imageScaleFactor.current,
                (finalX1 + finalWidth) / imageScaleFactor.current,
                (finalY1 + finalHeight) / imageScaleFactor.current
            ];
        }
        onAreaSelect(finalBbox);
      }
      canvas.remove(drawnRect);
      drawnRect = null;
      canvas.renderAll();
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
        if (canvas) {
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:up', handleMouseUp);
        }
    }

  }, [onAreaSelect, imageScaleFactor.current]);

  return (
    <div className="w-full h-full border border-gray-600 rounded-md overflow-auto bg-gray-800 flex justify-center items-center">
      {/* The canvas itself will be resized by Fabric.js based on image */}
      <canvas ref={canvasRef} />
    </div>
  );
};

export default ImageCanvas;
