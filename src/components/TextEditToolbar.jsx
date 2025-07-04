// src/components/TextEditToolbar.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
// No OCRBlock import needed from types for JS; structure is implicit or via JSDoc.

/**
 * JSDoc for OCRBlockData structure (as defined in ImageTranslator.jsx)
 * This component expects selectedBlockData to conform to this structure.
 * @typedef {object} FontInfo
 * @property {string} [family]
 * @property {number} [size]
 * @property {string} [weight]
 * @property {string} [style]
 */

/**
 * @typedef {object} ColorInfo
 * @property {string} [fgColor]
 * @property {string} [bgColor]
 */

/**
 * @typedef {object} OCRBlockData
 * @property {string} id
 * @property {string} text
 * @property {string} translatedText
 * @property {[number, number, number, number]} blockBox
 * @property {FontInfo} [fontInfo]
 * @property {ColorInfo} [colorInfo]
 * @property {string} [type]
 * @property {number} [fontSize] - User-defined font size
 * @property {string} [fontColor] - User-defined font color
 * @property {{ x: number; y: number }} position
 */

/**
 * @param {{
 *   selectedBlockData: OCRBlockData | null;
 *   onUpdateBlock: (updatedBlock: OCRBlockData) => void;
 *   onDeleteBlock: (blockId: string) => void;
 *   onClose: () => void;
 * }} props
 */
const TextEditToolbar = ({
  selectedBlockData,
  onUpdateBlock,
  onDeleteBlock,
  onClose,
}) => {
  const { t } = useLanguage();
  const [editText, setEditText] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [fontColor, setFontColor] = useState('#000000');
  const [fontFamily, setFontFamily] = useState('Arial');

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
    { name: 'SimSun (宋体)', value: 'SimSun, NSimSun, STSong, MS Song, serif' },
    { name: 'SimHei (黑体)', value: 'SimHei, STHeiti, MS Hei, sans-serif' },
    { name: 'Microsoft YaHei (微软雅黑)', value: "'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', sans-serif" },
  ];

  useEffect(() => {
    if (selectedBlockData) {
      setEditText(selectedBlockData.translatedText || selectedBlockData.text || '');
      setFontSize(selectedBlockData.fontSize || selectedBlockData.fontInfo?.size || 16);
      setFontColor(selectedBlockData.fontColor || selectedBlockData.colorInfo?.fgColor || '#000000');
      setFontFamily(selectedBlockData.fontInfo?.family || 'Arial');
    }
  }, [selectedBlockData]);

  if (!selectedBlockData) {
    return null;
  }

  const handleApplyChanges = () => {
    if (selectedBlockData) {
      onUpdateBlock({
        ...selectedBlockData,
        translatedText: editText,
        fontSize: fontSize,
        fontColor: fontColor,
        fontInfo: {
          ...selectedBlockData.fontInfo,
          family: fontFamily,
          size: fontSize,
        },
      });
    }
  };

  const handleDelete = () => {
    if (selectedBlockData) {
      onDeleteBlock(selectedBlockData.id);
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 sm:left-1/2 sm:transform sm:-translate-x-1/2 w-full max-w-lg p-4 bg-gray-700 shadow-2xl rounded-t-lg sm:rounded-lg z-50 text-white transition-all duration-300 ease-in-out ${selectedBlockData ? 'translate-y-0 opacity-100' : 'translate-y-full sm:translate-y-16 opacity-0 pointer-events-none'}`}
    >
      {/* The `pointer-events-none` when hidden is important so it doesn't intercept clicks */}
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xl font-semibold text-purple-300">{t('editToolbarTitle')}</h4>
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto"
          aria-label={t('closeBtn')} // Add aria-label for accessibility
        >✕</button>
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
            <span className="label-text text-gray-300">{t('fontFamilyLabel')}</span>
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
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setFontSize(16); // Revert to a default if input is cleared
                } else {
                  const newSize = parseInt(val, 10);
                  if (!isNaN(newSize) && newSize > 0) { // Ensure positive font size
                    setFontSize(newSize);
                  } else if (isNaN(newSize)) {
                    setFontSize(16); // Revert to default if parsing fails
                  }
                  // If newSize is 0 or negative, it doesn't update, effectively keeping previous valid state or becoming 16 on error
                }
              }}
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
              className="input input-bordered input-primary w-full h-12 bg-gray-800 p-1"
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
