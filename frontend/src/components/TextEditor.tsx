'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Bold, Italic, Palette, Type, Trash2, Languages } from 'lucide-react';

interface TextBlock {
  id: string;
  text: string;
  translatedText?: string;
  bbox: [number, number, number, number];
  // Future style properties
  // style?: {
  //   fontSize?: number;
  //   fill?: string;
  //   fontFamily?: string;
  //   bold?: boolean;
  //   italic?: boolean;
  // };
}

interface TextEditorProps {
  block: TextBlock | null;
  onSave: (blockId: string, newText: string, newTranslatedText?: string) => void;
  onClose: () => void;
  onDelete?: (blockId: string) => void; // Optional delete handler
  // onStyleChange?: (blockId: string, styleChanges: Partial<TextBlock['style']>) => void; // For future style editing
}

const TextEditor: React.FC<TextEditorProps> = ({
  block,
  onSave,
  onClose,
  onDelete,
}) => {
  const [editedText, setEditedText] = useState('');
  const [editedTranslatedText, setEditedTranslatedText] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (block) {
      setEditedText(block.text);
      setEditedTranslatedText(block.translatedText || '');
    }
  }, [block]);

  // Handle click outside to close (optional, can be added later)
  // useEffect(() => {
  //   function handleClickOutside(event: MouseEvent) {
  //     if (editorRef.current && !editorRef.current.contains(event.target as Node)) {
  //       onClose();
  //     }
  //   }
  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, [onClose]);


  if (!block) return null;

  const handleSave = () => {
    onSave(block.id, editedText, editedTranslatedText);
    onClose(); // Optionally close after save
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(block.id);
    }
    onClose();
  }

  // Placeholder for style controls (as per "专业文本编辑器" in prompt)
  const styleControls = (
    <>
      {/* <button className="p-2 hover:bg-gray-600 rounded"><Bold size={18} /></button>
      <button className="p-2 hover:bg-gray-600 rounded"><Italic size={18} /></button>
      <button className="p-2 hover:bg-gray-600 rounded"><Type size={18} /></button>
      <button className="p-2 hover:bg-gray-600 rounded"><Palette size={18} /></button> */}
    </>
  );

  // Quick Presets (as per "quickPresets" in prompt)
  // const quickPresets = (
  //   <div className="mt-2">
  //       <span className="text-xs text-gray-400 mr-2">Presets:</span>
  //       {['标题', '正文', '注释'].map(preset => (
  //           <button key={preset} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded mr-1">
  //               {preset}
  //           </button>
  //       ))}
  //   </div>
  // );

  return (
    // Floating Toolbar / Panel (as per "floatingToolbar" in prompt)
    // Positioned fixed or absolute relative to the canvas container in the main page.
    // For now, a simple fixed position for demonstration.
    <div
      ref={editorRef}
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-white p-6 rounded-lg shadow-2xl z-50 w-96 border border-gray-700"
      // Add 3D flip animation class if implemented with Tween.js/CSS
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-purple-400">Edit Text Block</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={24} />
        </button>
      </div>

      {/* Original Text Area */}
      <div className="mb-4">
        <label htmlFor="originalText" className="block text-sm font-medium text-gray-300 mb-1">
          Original Text (OCR)
        </label>
        <textarea
          id="originalText"
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          rows={3}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 custom-scrollbar"
          placeholder="Original text from image"
        />
      </div>

      {/* Translated Text Area */}
      <div className="mb-6">
        <label htmlFor="translatedText" className="flex items-center text-sm font-medium text-gray-300 mb-1">
          <Languages size={16} className="mr-2 text-cyan-400" />
          Translated Text
        </label>
        <textarea
          id="translatedText"
          value={editedTranslatedText}
          onChange={(e) => setEditedTranslatedText(e.target.value)}
          rows={3}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 custom-scrollbar"
          placeholder="Enter or edit translation"
        />
      </div>

      {/* Placeholder for Style Controls & Quick Presets */}
      {/* <div className="flex items-center space-x-2 mb-4 border-t border-gray-700 pt-4">
        {styleControls}
      </div>
      {quickPresets} */}


      <div className="flex justify-end items-center space-x-3 pt-4 border-t border-gray-700 mt-4">
        {onDelete && (
             <button
                onClick={handleDelete}
                className="flex items-center px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-150"
                title="Delete Block"
            >
                <Trash2 size={16} className="mr-2" /> Delete
            </button>
        )}
        <button
          onClick={handleSave}
          className="flex items-center px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md transition-colors duration-150"
        >
          <Save size={18} className="mr-2" /> Apply Changes
        </button>
      </div>
    </div>
  );
};

export default TextEditor;
