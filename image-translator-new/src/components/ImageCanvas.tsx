'use client';

import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useEditorContext } from '@/contexts/EditorContext';
import { Area } from '@/types'; // Make sure Area type is imported if used for props, though not directly here

interface ImageCanvasProps {
  onNewAreaSelect: (bbox: [number, number, number, number]) => void;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({ onNewAreaSelect }) => {
  const {
    areas, setAreas,
    selectedAreaId, setSelectedAreaId,
    backgroundImageUrl,
    setFabricCanvasInstance // Get the registration function
  } = useEditorContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null); // Keep local ref for direct use
  const [displaySize, setDisplaySize] = useState({ width: 800, height: 600 });

  // Initialize Fabric Canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: displaySize.width,
        height: displaySize.height,
        backgroundColor: '#18181b', // zinc-900, darker for better contrast with UI elements
        selectionColor: 'rgba(99, 102, 241, 0.3)', // indigo-500 with alpha (from design)
        selectionBorderColor: '#8b5cf6', // brand.purple
        selectionLineWidth: 2, // Thicker selection border
        selectionDashArray: [6, 3],
        stopContextMenu: true, // Prevent default browser context menu on canvas
      });
      fabricCanvasRef.current = canvas;
      setFabricCanvasInstance(canvas); // Register instance with context

      // Zoom and Pan functionality
      canvas.on('mouse:wheel', function (opt) {
        const delta = opt.e.deltaY;
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.1) zoom = 0.1; // Min zoom
        // canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
        // Correct zooming to cursor position:
        const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY);
        canvas.zoomToPoint(point, zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
      });

      let isPanning = false;
      let isDrawingSelection = false;
      let selectionRect: fabric.Rect | null = null;
      let startX: number, startY: number;
      let lastPosX: number, lastPosY: number;

      canvas.on('mouse:down', function (opt) {
        const evt = opt.e;
        const target = opt.target;

        if (evt.altKey === true || (target === null || target === undefined && !isDrawingSelection)) {
          isPanning = true;
          canvas.selection = false;
          lastPosX = evt.clientX;
          lastPosY = evt.clientY;
        } else if (target === null || target === undefined) { // Clicked on empty space, start drawing new selection
          isDrawingSelection = true;
          const pointer = canvas.getPointer(evt);
          startX = pointer.x;
          startY = pointer.y;
          selectionRect = new fabric.Rect({
            left: startX,
            top: startY,
            width: 0,
            height: 0,
            fill: 'rgba(139, 92, 246, 0.2)', // brand.purple with low alpha
            stroke: '#8b5cf6', // brand.purple
            strokeWidth: 1,
            strokeDashArray: [4, 2],
            selectable: false,
            evented: false,
          });
          canvas.add(selectionRect);
          canvas.requestRenderAll();
        } else {
          // Clicked on an existing object, normal selection behavior
          canvas.selection = true;
        }
      });

      canvas.on('mouse:move', function (opt) {
        if (isPanning && canvas.viewportTransform) {
          const e = opt.e;
          const vpt = canvas.viewportTransform;
          vpt[4] += e.clientX - lastPosX;
          vpt[5] += e.clientY - lastPosY;
          canvas.requestRenderAll();
          lastPosX = e.clientX;
          lastPosY = e.clientY;
        }
      });
      canvas.on('mouse:up', function () {
        if (isPanning) {
            if(canvas.viewportTransform) canvas.setViewportTransform(canvas.viewportTransform);
            isPanning = false;
            canvas.selection = true;
        } else if (isDrawingSelection && selectionRect) {
          const pointer = canvas.getPointer(opt.e);
          let width = pointer.x - startX;
          let height = pointer.y - startY;

          selectionRect.set({
            width: Math.abs(width),
            height: Math.abs(height),
            left: width > 0 ? startX : pointer.x,
            top: height > 0 ? startY : pointer.y,
          });
          canvas.requestRenderAll();
        }
      });

      canvas.on('mouse:up', function(opt) {
        if (isPanning) {
          if (canvas.viewportTransform) canvas.setViewportTransform(canvas.viewportTransform);
          isPanning = false;
          canvas.selection = true;
        } else if (isDrawingSelection && selectionRect) {
          isDrawingSelection = false;
          const finalWidth = selectionRect.width || 0;
          const finalHeight = selectionRect.height || 0;

          if (finalWidth > 5 && finalHeight > 5) { // Minimum size for a new area
            const newBBox: [number, number, number, number] = [
              selectionRect.left!,
              selectionRect.top!,
              selectionRect.left! + finalWidth,
              selectionRect.top! + finalHeight,
            ];
            // console.log("New area selected (bbox):", newBBox);
            onNewAreaSelect(newBBox); // Call the callback
          }
          canvas.remove(selectionRect);
          selectionRect = null;
          canvas.requestRenderAll();
        }
      });

      // Handle object selection from canvas to update context
      const handleSelection = (e: fabric.IEvent) => {
        if (e.selected && e.selected.length === 1 && e.selected[0].data?.id) {
          setSelectedAreaId(e.selected[0].data.id);
        } else {
          setSelectedAreaId(null); // Deselect or if multi-select (not handled yet)
        }
      };
      canvas.on('selection:created', handleSelection);
      canvas.on('selection:updated', handleSelection);
      canvas.on('selection:cleared', () => setSelectedAreaId(null));

      // Event listener for object modifications (text, position, size)
      canvas.on('object:modified', (e) => {
        const modifiedObject = e.target;
        if (modifiedObject && modifiedObject.data?.id && modifiedObject.data?.type === 'ocrTextBox') {
          const areaId = modifiedObject.data.id;
          // Update the corresponding Area in the context
          const areaId = modifiedObject.data.id;
          const fabricTextbox = modifiedObject as fabric.Textbox;

          setAreas(prevAreas =>
            prevAreas.map(area => {
              if (area.id === areaId) {
                const newWidth = fabricTextbox.getScaledWidth();
                const newHeight = fabricTextbox.getScaledHeight();
                // Update font size based on vertical scaling if it's uniform scaling or only height changed
                // This is a heuristic. More complex logic might be needed for non-uniform scaling.
                let newFontSize = area.style.fontSize;
                if (fabricTextbox.scaleY && fabricTextbox.scaleY !== 1 && (!fabricTextbox.scaleX || fabricTextbox.scaleX === fabricTextbox.scaleY)) {
                   // If only height is scaled, or uniformly scaled, adjust font size
                  // This assumes the original height of the textbox was primarily determined by its font size and lines.
                  // This part is tricky and might need refinement based on desired behavior.
                  // For now, let's assume direct font size change is via editor, scaling changes bbox.
                  // We could also try to back-calculate font size if textbox was resized.
                }

                return {
                  ...area,
                  translatedString: fabricTextbox.text || '',
                  bbox: [
                    fabricTextbox.left!,
                    fabricTextbox.top!,
                    fabricTextbox.left! + newWidth,
                    fabricTextbox.top! + newHeight
                  ],
                  style: {
                    ...area.style,
                    fontSize: newFontSize, // Potentially updated font size
                    // Other style properties like text alignment might be readable from fabricTextbox if changed directly
                    textAlign: fabricTextbox.textAlign as Area['style']['textAlign'] || area.style.textAlign,
                  }
                };
              }
              return area;
            })
          );
        }
      });

      // Capture text changes from direct editing on canvas
      canvas.on('text:changed', (e) => {
        const changedObject = e.target as fabric.Textbox;
        if (changedObject && changedObject.data?.id && changedObject.data?.type === 'ocrTextBox') {
          const areaId = changedObject.data.id;
          setAreas(prevAreas => prevAreas.map(area =>
            area.id === areaId
              ? { ...area, translatedString: changedObject.text || '' }
              : area
          ));
        }
      });


      return () => {
        setFabricCanvasInstance(null); // Unregister on dispose
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    }
  }, [displaySize, setSelectedAreaId, setAreas, setFabricCanvasInstance]);

  // Load Background Image from context
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (canvas && backgroundImageUrl) {
      fabric.Image.fromURL(backgroundImageUrl, (img) => {
        canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas)); // Clear previous

        const MAX_CANVAS_WIDTH = 1200;
        const MAX_CANVAS_HEIGHT = 800;
        const MIN_CANVAS_WIDTH = 300; // Ensure a minimum size
        const MIN_CANVAS_HEIGHT = 200;

        let newWidth = img.width || MAX_CANVAS_WIDTH;
        let newHeight = img.height || MAX_CANVAS_HEIGHT;

        // Aspect ratio scaling
        const imgAspectRatio = newWidth / newHeight;
        const maxCanvasAspectRatio = MAX_CANVAS_WIDTH / MAX_CANVAS_HEIGHT;

        if (imgAspectRatio > maxCanvasAspectRatio) { // Image is wider than canvas aspect ratio
            if (newWidth > MAX_CANVAS_WIDTH) {
                newWidth = MAX_CANVAS_WIDTH;
                newHeight = newWidth / imgAspectRatio;
            }
        } else { // Image is taller or same aspect ratio
            if (newHeight > MAX_CANVAS_HEIGHT) {
                newHeight = MAX_CANVAS_HEIGHT;
                newWidth = newHeight * imgAspectRatio;
            }
        }

        newWidth = Math.max(newWidth, MIN_CANVAS_WIDTH);
        newHeight = Math.max(newHeight, MIN_CANVAS_HEIGHT);

        if (displaySize.width !== newWidth || displaySize.height !== newHeight) {
            setDisplaySize({ width: Math.round(newWidth), height: Math.round(newHeight) });
        }

        // Ensure image is scaled correctly for the background of the *current* canvas dimensions
        // The canvas dimensions are set by displaySize, which might take a render cycle to update.
        // So, scale the image to the new calculated dimensions directly.
        img.scaleToWidth(Math.round(newWidth));
        if(img.getScaledHeight() > Math.round(newHeight)) {
            img.scaleToHeight(Math.round(newHeight));
        }

        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
          selectable: false, evented: false, originX: 'left', originY: 'top',
        });
        canvas.renderAll();
      }, { crossOrigin: 'anonymous' });
    } else if (canvas) {
      canvas.clear();
      canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
      if (displaySize.width !== 800 || displaySize.height !== 600) {
          setDisplaySize({ width: 800, height: 600 });
      }
      canvas.renderAll();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundImageUrl]); // displaySize removed from deps to avoid potential loops

  // Render/Update OCR Areas (Bounding Boxes) from context
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      // Simple clear and redraw for areas. More sophisticated diffing could be done.
      canvas.getObjects().filter(obj => obj.data?.type === 'ocrAreaBox' || obj.data?.type === 'ocrTextBox').forEach(obj => canvas.remove(obj));

      areas.forEach((area: Area) => {
        const textbox = new fabric.Textbox(area.translatedString || area.sourceString || "Text", {
          left: area.bbox[0],
          top: area.bbox[1],
          width: area.bbox[2] - area.bbox[0],
          height: area.bbox[3] - area.bbox[1], // Textbox might auto-adjust height based on content and width
          fontSize: area.style.fontSize,
          fill: area.style.color, // Text color
          backgroundColor: area.style.backgroundColor,
          fontFamily: area.style.fontFamily,
          fontWeight: area.style.fontWeight,
          fontStyle: area.style.fontStyle,
          textAlign: area.style.textAlign,
          textDecoration: area.style.textDecoration,
          // Fabric specific properties for better control if needed:
          // splitByGrapheme: true, // Better for complex scripts / emojis
          // selectable: true,
          // hasControls: true,
          // lockScalingFlip: true,
          // cornerColor: '#8b5cf6', // brand.purple
          // cornerStrokeColor: '#6d28d9', // darker purple
          // borderColor: selectedAreaId === area.id ? '#a78bfa' : '#8b5cf6',
          // borderScaleFactor: 2,
          // borderDashArray: selectedAreaId === area.id ? undefined : [6,3],

          // Custom data to link back to our Area object
          data: { id: area.id, type: 'ocrTextBox' },
        });

        // Apply a border if selected (visual cue)
        if (selectedAreaId === area.id) {
            textbox.set({
                borderColor: '#a78bfa', // Brighter purple for selected
                borderScaleFactor: 2,
                borderDashArray: undefined,
            });
        } else {
            textbox.set({
                borderColor: '#8b5cf6', // Standard purple
                borderScaleFactor: 1.5,
                borderDashArray: [6,3],
            });
        }

        canvas.add(textbox);
      });
      canvas.renderAll();
    }
  }, [areas, selectedAreaId, backgroundImageUrl]); // Re-render if areas, selection, or background changes

  // Programmatically select object on canvas if selectedAreaId changes from context
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (selectedAreaId) {
        if (activeObject?.data?.id !== selectedAreaId) {
          const objectToSelect = canvas.getObjects().find(obj => obj.data?.id === selectedAreaId && obj.data?.type === 'ocrTextBox');
          if (objectToSelect) {
            canvas.setActiveObject(objectToSelect);
            // objectToSelect.enterEditing(); // Optionally enter editing mode directly
            // objectToSelect.selectAll();
          }
        }
      } else {
        if (activeObject) {
          canvas.discardActiveObject();
        }
      }
      canvas.renderAll();
    }
  }, [selectedAreaId]);

  return (
    <div
      style={{
        width: displaySize.width,
        height: displaySize.height,
        border: '1px solid #374151' // gray-700
      }}
      className="mx-auto shadow-2xl" // Center it and add shadow
    >
      <canvas ref={canvasRef} />
    </div>
  );
};

export default ImageCanvas;
