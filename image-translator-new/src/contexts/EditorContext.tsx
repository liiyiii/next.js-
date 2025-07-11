'use client';

import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { Area } from '@/types';

import { Area } from '@/types';
import { useEffect } from 'react'; // Added useEffect

interface EditorContextType {
  areas: Area[];
  setAreas: (newAreasOrCallback: SetStateAction<Area[]>, storeInHistory?: boolean) => void; // Modified for history
  selectedAreaId: string | null;
  setSelectedAreaId: Dispatch<SetStateAction<string | null>>;
  backgroundImageUrl: string | null;
  setBackgroundImageUrl: Dispatch<SetStateAction<string | null>>;
  originalImageFile: File | null;
  setOriginalImageFile: Dispatch<SetStateAction<File | null>>;
  estimatedFontSize: number | null;
  setEstimatedFontSize: Dispatch<SetStateAction<number | null>>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  triggerJPGExport: () => string | null; // Function to get JPG data URL
  setFabricCanvasInstance: (canvas: fabric.Canvas | null) => void; // To register canvas instance
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

// Store for fabric canvas instance - outside provider to be a simple ref accessible by context functions
let fabricInstance: fabric.Canvas | null = null;

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [areasInternal, setAreasInternal] = useState<Area[]>([]); // Renamed internal state
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [estimatedFontSize, setEstimatedFontSize] = useState<number | null>(16);

  // Note: fabricInstance is managed outside React state to avoid re-renders on set.
  // It's passed to context consumers via a function if needed, or context functions can use it.

  // Undo/Redo state
  const [history, setHistory] = useState<Area[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const MAX_HISTORY_LENGTH = 30; // Increased history length

  // Wrapped setAreas to manage history
  const setAreas = (newAreasOrCallback: SetStateAction<Area[]>, storeInHistory: boolean = true) => {
    setAreasInternal(currentAreas => {
      const newAreas = typeof newAreasOrCallback === 'function'
        ? newAreasOrCallback(currentAreas)
        : newAreasOrCallback;

      if (storeInHistory) {
        // Basic stringify compare; for complex objects, a deep compare or library might be better.
        // Avoid storing if it's identical to the current state in history at historyIndex.
        const currentHistorySnapshot = history[historyIndex];
        if (JSON.stringify(currentHistorySnapshot) !== JSON.stringify(newAreas)) {
            const newHistorySlice = history.slice(0, historyIndex + 1); // Truncate redo stack
            const updatedHistory = [...newHistorySlice, newAreas];

            setHistory(
              updatedHistory.length > MAX_HISTORY_LENGTH
                ? updatedHistory.slice(updatedHistory.length - MAX_HISTORY_LENGTH)
                : updatedHistory
            );
            setHistoryIndex(
              updatedHistory.length > MAX_HISTORY_LENGTH
                ? MAX_HISTORY_LENGTH - 1
                : updatedHistory.length - 1
            );
        }
      }
      return newAreas;
    });
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setAreasInternal(history[newIndex]); // Set areas without adding new history entry
      setHistoryIndex(newIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setAreasInternal(history[newIndex]); // Set areas without adding new history entry
      setHistoryIndex(newIndex);
    }
  };

  // Effect to initialize or reset history when the areas are set from a file load or cleared
  useEffect(() => {
    // This condition means: if areas are populated from empty, or cleared from populated.
    // This correctly captures the initial state after file processing or when areas are reset.
    if ((areasInternal.length > 0 && (history.length === 1 && history[0].length === 0)) ||
        (areasInternal.length === 0 && !(history.length === 1 && history[0].length === 0))) {
      setHistory([areasInternal]); // Start new history with current areas
      setHistoryIndex(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areasInternal]); // Triggered when areasInternal reference changes (e.g. after setOriginalImageFile and processFile)

  return (
    <EditorContext.Provider value={{
      areas: areasInternal, // Expose internal areas
      setAreas, // Use the wrapped setAreas
      selectedAreaId, setSelectedAreaId,
      backgroundImageUrl, setBackgroundImageUrl,
      originalImageFile, setOriginalImageFile,
      estimatedFontSize, setEstimatedFontSize,
      undo,
      redo,
      canUndo: historyIndex > 0,
      canRedo: historyIndex < history.length - 1,
      triggerJPGExport: () => {
        if (fabricInstance) {
          return fabricInstance.toDataURL({ format: 'jpeg', quality: 0.9 });
        }
        return null;
      },
      setFabricCanvasInstance: (canvas: fabric.Canvas | null) => {
        fabricInstance = canvas;
      }
    }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditorContext = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }
  return context;
};
