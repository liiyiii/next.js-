'use client';

import React, { useEffect, useRef } from 'react'; // Added useEffect, useRef
import { useEditorContext } from '@/contexts/EditorContext';
import { Area, AreaStyle } from '@/types'; // Import AreaStyle
import {
  Bold, Italic, Underline, Palette, Type, CornerUpLeft, RotateCcw, RotateCw,
  AlignLeft, AlignCenter, AlignRight, Pilcrow // Added more icons
} from 'lucide-react';

const TextEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null); // Ref for the editor itself for positioning
  const {
    areas, setAreas,
    selectedAreaId, setSelectedAreaId,
    undo, redo, canUndo, canRedo // Get undo/redo from context
  } = useEditorContext();

  const selectedArea = areas.find(area => area.id === selectedAreaId);

  if (!selectedAreaId || !selectedArea) {
    return null; // Don't render if no area is selected
  }

  // Placeholder for actual position calculation based on selected Fabric object
  // This would ideally be positioned near the selected object.
  // For now, keeping it fixed at top-left of the canvas container.
  // True dynamic positioning would require knowing canvas position and selected object's screen coords.
  const [editorPosition, setEditorPosition] = React.useState({ top: 10, left: 10 });

  // Basic dynamic positioning - attempt to place near selected object (needs canvas ref)
  // This is a simplified version. A robust solution would involve more complex calculations.
  // useEffect(() => {
  //   if (selectedAreaId && fabricCanvasRef?.current && editorRef.current) {
  //     const activeObject = fabricCanvasRef.current.getActiveObject();
  //     if (activeObject && activeObject.data?.id === selectedAreaId) {
  //       const canvasElement = fabricCanvasRef.current.getElement();
  //       const canvasRect = canvasElement.getBoundingClientRect();
  //       const objCoords = activeObject.getCoords(); // Get bounding box coords of selected object

  //       // Position above the object, centered, within canvas bounds
  //       let top = canvasRect.top + objCoords[0].y - editorRef.current.offsetHeight - 10; // 10px offset
  //       let left = canvasRect.left + objCoords[0].x + (activeObject.getScaledWidth() / 2) - (editorRef.current.offsetWidth / 2);

  //       // Boundary checks (very basic)
  //       top = Math.max(canvasRect.top, top);
  //       left = Math.max(canvasRect.left, Math.min(left, canvasRect.right - editorRef.current.offsetWidth));

  //       setEditorPosition({ top: top - canvasRect.top, left: left - canvasRect.left }); // Relative to canvas parent
  //     }
  //   }
  // }, [selectedAreaId, areas]); // Re-calculate on selection or when areas change (e.g. object moved)


  const editorStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${editorPosition.top}px`,
    left: `${editorPosition.left}px`,
    zIndex: 1000,
  };

  const updateStyle = (property: keyof AreaStyle, value: any) => {
    setAreas((prevAreas: Area[]) =>  // Typed prevAreas
      prevAreas.map((area: Area) =>  // Typed area
        area.id === selectedAreaId
          ? { ...area, style: { ...area.style, [property]: value } }
          : area
      )
    );
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value, 10);
    if (!isNaN(newSize) && newSize > 0) {
      updateStyle('fontSize', newSize);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateStyle('color', e.target.value);
  };

  const handleBgColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateStyle('backgroundColor', e.target.value);
  };

  const toggleBold = () => {
    updateStyle('fontWeight', selectedArea.style.fontWeight === 'bold' ? 'normal' : 'bold');
  };

  // In-place editing is handled by Fabric.js directly on the Textbox.
  // This toolbar is for styling. Text content changes on Fabric object should trigger 'object:modified'
  // which then updates the 'translatedString' in the Area object in context.

  return (
    <div
      style={editorStyle}
      className="bg-gray-800 p-3 rounded-lg shadow-2xl border border-gray-700 flex items-center space-x-2"
      onClick={(e) => e.stopPropagation()} // Prevent clicks from deselecting canvas object
    >
      {/* Font Size */}
      <div className="flex items-center">
        <Type size={18} className="text-gray-400 mr-1" />
        <input
          type="number"
          value={selectedArea.style.fontSize}
          onChange={handleFontSizeChange}
          className="w-16 bg-gray-700 text-white p-1 rounded text-sm focus:ring-brand-blue focus:border-brand-blue"
          min="1"
        />
      </div>

      {/* Text Color */}
      <div className="flex items-center" title="Text Color">
         <Palette size={18} className="text-gray-400 mr-1" />
        <input
          type="color"
          value={selectedArea.style.color}
          onChange={handleColorChange}
          className="w-8 h-8 bg-transparent border-none rounded cursor-pointer"
        />
      </div>

      {/* Background Color */}
      <div className="flex items-center" title="Background Color">
        <div className="w-4 h-4 rounded border border-gray-500 mr-1" style={{backgroundColor: selectedArea.style.backgroundColor || 'transparent'}}></div>
        <input
          type="color"
          value={selectedArea.style.backgroundColor}
          onChange={handleBgColorChange}
          className="w-8 h-8 bg-transparent border-none rounded cursor-pointer"
        />
      </div>

      {/* Bold Toggle */}
      <button
        onClick={toggleBold}
        title="Bold"
        className={`p-2 rounded hover:bg-gray-700 ${selectedArea.style.fontWeight === 'bold' ? 'bg-brand-blue text-white' : 'text-gray-400'}`}
      >
        <Bold size={18} />
      </button>

      {/* Italic Toggle */}
      <button
        onClick={() => updateStyle('fontStyle', selectedArea.style.fontStyle === 'italic' ? 'normal' : 'italic')}
        title="Italic"
        className={`p-2 rounded hover:bg-gray-700 ${selectedArea.style.fontStyle === 'italic' ? 'bg-brand-blue text-white' : 'text-gray-400'}`}
      >
        <Italic size={18} />
      </button>

      {/* Underline Toggle */}
      <button
        onClick={() => updateStyle('textDecoration', selectedArea.style.textDecoration === 'underline' ? 'none' : 'underline')}
        title="Underline"
        className={`p-2 rounded hover:bg-gray-700 ${selectedArea.style.textDecoration === 'underline' ? 'bg-brand-blue text-white' : 'text-gray-400'}`}
      >
        <Underline size={18} />
      </button>

      {/* Text Align */}
      <div className="flex items-center space-x-1 bg-gray-700 rounded-md p-0.5">
        {(['left', 'center', 'right'] as const).map(align => (
          <button
            key={align}
            onClick={() => updateStyle('textAlign', align)}
            title={`Align ${align.charAt(0).toUpperCase() + align.slice(1)}`}
            className={`p-1.5 rounded hover:bg-gray-600 ${selectedArea.style.textAlign === align ? 'bg-brand-blue text-white' : 'text-gray-400'}`}
          >
            {align === 'left' && <AlignLeft size={16} />}
            {align === 'center' && <AlignCenter size={16} />}
            {align === 'right' && <AlignRight size={16} />}
          </button>
        ))}
      </div>

      {/* Font Family */}
      <div className="flex items-center">
        <Pilcrow size={18} className="text-gray-400 mr-1" /> {/* Icon for font family */}
        <select
          value={selectedArea.style.fontFamily}
          onChange={(e) => updateStyle('fontFamily', e.target.value)}
          className="bg-gray-700 text-white p-1 rounded text-sm focus:ring-brand-blue focus:border-brand-blue appearance-none"
          style={{maxWidth: '100px'}}
        >
          <option value="var(--font-inter), sans-serif">Inter</option>
          <option value="Fira Code, monospace">Fira Code</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Times New Roman, serif">Times New Roman</option>
          <option value="Georgia, serif">Georgia</option>
        </select>
      </div>


      <button
        onClick={() => setSelectedAreaId(null)}
        title="Deselect"
        className="p-2 rounded hover:bg-gray-700 text-gray-400"
      >
        <CornerUpLeft size={18} />
      </button>

      {/* Undo/Redo Buttons */}
      <div className="ml-auto flex items-center space-x-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo"
          className="p-2 rounded hover:bg-gray-700 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo"
          className="p-2 rounded hover:bg-gray-700 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCw size={18} />
        </button>
      </div>
    </div>
  );
};

export default TextEditor;
