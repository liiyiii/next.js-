// src/components/TextEditToolbar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { OCRBlock } from '@/types'; // Import from shared types

interface TextEditToolbarProps {
  selectedBlockData: OCRBlock | null;
  onUpdateBlock: (updatedBlock: OCRBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  onClose: () => void; // Callback to close or hide the toolbar
}

const TextEditToolbar: React.FC<TextEditToolbarProps> = ({
  selectedBlockData,
  onUpdateBlock,
  onDeleteBlock,
  onClose,
}) => {
  const { t } = useLanguage();
  const [editText, setEditText] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(16);
  const [fontColor, setFontColor] = useState<string>('#000000');
  const [fontFamily, setFontFamily] = useState<string>('Arial');

  const availableFontFamilies = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Times New Roman', value: "'Times New Roman', Times, serif" },
    { name: 'Courier New', value: "'Courier New', Courier, monospace" },
    { name: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Palatino', value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" },
    { name: 'Garamond', value: 'Garamond, serif' },
    { name: 'Comic Sans MS', value: "'Comic Sans MS', cursive, sans-serif" },
    { name: 'Impact', value: 'Impact, Charcoal, sans-serif' },
    { name: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
    // Common CJK fonts (ensure users have them or use web fonts)
    { name: 'SimSun (宋体)', value: 'SimSun, NSimSun, STSong, MS Song, serif' }, //宋体
    { name: 'SimHei (黑体)', value: 'SimHei, STHeiti, MS Hei, sans-serif' }, //黑体
    { name: 'Microsoft YaHei (微软雅黑)', value: "'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', sans-serif" },//雅黑
  ];

  useEffect(() => {
    if (selectedBlockData) {
      setEditText(selectedBlockData.translatedText || selectedBlockData.text || '');
      // Use user-override first, then fontInfo, then default
      setFontSize(selectedBlockData.fontSize || selectedBlockData.fontInfo?.size || 16);
      setFontColor(selectedBlockData.fontColor || selectedBlockData.colorInfo?.fgColor || '#000000');
      setFontFamily(selectedBlockData.fontInfo?.family || 'Arial');
    }
  }, [selectedBlockData]);

  if (!selectedBlockData) {
    return null; // Don't render if no block is selected
  }

  const handleApplyChanges = () => {
    if (selectedBlockData) {
      onUpdateBlock({
        ...selectedBlockData,
        translatedText: editText,
        fontSize: fontSize, // This will be the user-override
        fontColor: fontColor, // This will be the user-override
        fontInfo: { // Update fontInfo with the new family
          ...selectedBlockData.fontInfo,
          family: fontFamily,
          size: fontSize, // Also update size in fontInfo for consistency if needed by draw func
        },
        // colorInfo might also need updating if fontColor is considered part of it
        // For now, let's assume draw function checks block.fontColor first, then block.colorInfo.fgColor
      });
    }
  };

  const handleDelete = () => {
    if (selectedBlockData) {
      onDeleteBlock(selectedBlockData.id);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 sm:bottom-4 sm:left-1/2 sm:transform sm:-translate-x-1/2 w-full max-w-lg p-4 bg-gray-700 shadow-2xl rounded-t-lg sm:rounded-lg z-50 text-white">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xl font-semibold text-purple-300">{t('editToolbarTitle')}</h4>
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto">✕</button>
      </div>

      <div className="space-y-4">
        <div className="form-control">
          <label htmlFor="editText" className="label pb-1">
            <span className="label-text text-gray-300">{t('editTextLabel')}</span>
          </label>
          <textarea
            id="editText"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="textarea textarea-bordered textarea-primary w-full bg-gray-800 text-white text-base"
            rows={3}
          />
        </div>

        <div className="form-control">
          <label htmlFor="fontFamily" className="label pb-1">
            <span className="label-text text-gray-300">{t('fontFamilyLabel')}</span> {/* Needs new translation key */}
          </label>
          <select
            id="fontFamily"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="select select-bordered select-primary w-full bg-gray-800 text-white"
          >
            {availableFontFamilies.map(font => (
              <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                {font.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label htmlFor="fontSize" className="label pb-1">
              <span className="label-text text-gray-300">{t('fontSizeLabel')}</span>
            </label>
            <input
              type="number"
              id="fontSize"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              className="input input-bordered input-primary w-full bg-gray-800 text-white"
            />
          </div>
          <div className="form-control">
            <label htmlFor="fontColor" className="label pb-1">
              <span className="label-text text-gray-300">{t('fontColorLabel')}</span>
            </label>
            <input
              type="color"
              id="fontColor"
              value={fontColor}
              onChange={(e) => setFontColor(e.target.value)}
              className="input input-bordered input-primary w-full h-12 bg-gray-800 p-1" // p-1 for color input to show swatch better
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button onClick={handleDelete} className="btn btn-error btn-md">
          {t('deleteBtn')}
        </button>
        <button onClick={handleApplyChanges} className="btn btn-primary btn-md">
          {t('applyChangesBtn')}
        </button>
      </div>
    </div>
  );
};

export default TextEditToolbar;

// Make sure to define these translation keys in your language files:
// "editToolbarTitle": "Edit Text Block",
// "editTextLabel": "Text Content:",
// "fontSizeLabel": "Font Size:",
// "fontColorLabel": "Font Color:",
// "deleteBtn": "Delete",
// "applyChangesBtn": "Apply Changes"

// Also, ensure OCRBlock type is accessible here.
// If it's defined in ImageTranslator.tsx, you might need to move it to a shared types file,
// e.g., src/types/index.ts and import it in both components.
// For now, I'm assuming it can be imported or a similar structure is defined.
// export interface OCRBlock {
//   id: string;
//   text: string;
//   translatedText: string;
//   blockBox: [number, number, number, number];
//   fontInfo?: any;
//   colorInfo?: any;
//   type?: string;
//   isEditing?: boolean;
//   currentEditText?: string;
//   fontSize?: number;
//   fontColor?: string;
//   position?: { x: number; y: number };
// }
