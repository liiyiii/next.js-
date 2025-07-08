'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Constants for localStorage keys
const LOCAL_STORAGE_KEY = 'nexusImageTranslatorState';

export interface OcrTextBlock {
  id: string;
  bbox: [number, number, number, number];
  text: string;
  translatedText?: string;
  confidence?: number; // Added for OCR failure highlighting
  // style?: { color?: string; fontSize?: number; ... }
}

interface AppState {
  uploadedImageUrl: string | null;
  // originalImageFile: File | null; // File objects cannot be easily serialized to JSON for localStorage
  originalImageName?: string; // Store file name for reference
  ocrBlocks: OcrTextBlock[];
  selectedBlockId: string | null;
  isScanning: boolean;
  isLoading: boolean;
  error: string | null;
  estimatedFontSize: number | null;
}

interface AppContextType extends AppState {
  setUploadedImageUrl: (url: string | null, file?: File | null) => void;
  setOcrBlocks: (blocks: OcrTextBlock[]) => void;
  updateOcrBlock: (blockId: string, newText: string, newTranslatedText?: string) => void;
  addOcrBlock: (newBlock: OcrTextBlock) => void;
  deleteOcrBlock: (blockId: string) => void;
  setSelectedBlockId: (blockId: string | null) => void;
  setIsScanning: (scanning: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setEstimatedFontSize: (size: number | null) => void;
  resetStateForNewImage: () => void;
  clearPersistedState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Function to load state from localStorage
const loadStateFromLocalStorage = (): Partial<AppState> => {
  if (typeof window === 'undefined') return {};
  try {
    const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (serializedState === null) {
      return {};
    }
    const storedState = JSON.parse(serializedState);
    // We don't persist File objects (originalImageFile)
    // We also don't persist transient states like isScanning, isLoading, error, selectedBlockId
    return {
      uploadedImageUrl: storedState.uploadedImageUrl || null,
      originalImageName: storedState.originalImageName || undefined,
      ocrBlocks: storedState.ocrBlocks || [],
      estimatedFontSize: storedState.estimatedFontSize || null,
    };
  } catch (error) {
    console.error("Could not load state from localStorage", error);
    return {};
  }
};


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [initialStateLoaded, setInitialStateLoaded] = useState(false);

  // Initialize state, attempting to load from localStorage first
  const [uploadedImageUrl, setUploadedImageUrlState] = useState<string | null>(null);
  const [originalImageName, setOriginalImageNameState] = useState<string | undefined>(undefined);
  const [ocrBlocks, setOcrBlocksState] = useState<OcrTextBlock[]>([]);
  const [selectedBlockId, setSelectedBlockIdState] = useState<string | null>(null);
  const [isScanning, setIsScanningState] = useState<boolean>(false);
  const [isLoading, setIsLoadingState] = useState<boolean>(false);
  const [error, setErrorState] = useState<string | null>(null);
  const [estimatedFontSize, setEstimatedFontSizeState] = useState<number | null>(null);

  // Load state from localStorage on component mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const persistedState = loadStateFromLocalStorage();
      if (persistedState.uploadedImageUrl) setUploadedImageUrlState(persistedState.uploadedImageUrl);
      if (persistedState.originalImageName) setOriginalImageNameState(persistedState.originalImageName);
      if (persistedState.ocrBlocks) setOcrBlocksState(persistedState.ocrBlocks);
      if (persistedState.estimatedFontSize) setEstimatedFontSizeState(persistedState.estimatedFontSize);
      setInitialStateLoaded(true);
    }
  }, []);

  // Save state to localStorage whenever relevant parts change
  useEffect(() => {
    if (typeof window !== 'undefined' && initialStateLoaded) { // Only save after initial load
      try {
        const stateToPersist = {
          uploadedImageUrl,
          originalImageName,
          ocrBlocks,
          estimatedFontSize,
        };
        const serializedState = JSON.stringify(stateToPersist);
        localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
      } catch (error) {
        console.error("Could not save state to localStorage", error);
      }
    }
  }, [uploadedImageUrl, originalImageName, ocrBlocks, estimatedFontSize, initialStateLoaded]);


  const setUploadedImageUrl = (url: string | null, file?: File | null) => {
    setUploadedImageUrlState(url);
    setOriginalImageNameState(file ? file.name : undefined);
    // If a new image is uploaded, other related states should be cleared.
    // This is typically handled by `resetStateForNewImage` before calling this.
  };

  const setOcrBlocks = (blocks: OcrTextBlock[]) => {
    setOcrBlocksState(blocks);
  };

  const updateOcrBlock = (blockId: string, newText: string, newTranslatedText?: string) => {
    setOcrBlocksState(prevBlocks =>
      prevBlocks.map(b =>
        b.id === blockId ? { ...b, text: newText, translatedText: newTranslatedText !== undefined ? newTranslatedText : b.translatedText } : b
      )
    );
  };

  const addOcrBlock = (newBlock: OcrTextBlock) => {
    setOcrBlocksState(prevBlocks => [...prevBlocks, newBlock]);
  };

  const deleteOcrBlock = (blockId: string) => {
    setOcrBlocksState(prevBlocks => prevBlocks.filter(b => b.id !== blockId));
    if (selectedBlockId === blockId) {
        setSelectedBlockIdState(null);
    }
  };

  const setSelectedBlockId = (blockId: string | null) => {
    setSelectedBlockIdState(blockId);
  };

  const setIsScanning = (scanning: boolean) => {
    setIsScanningState(scanning);
  };

  const setIsLoading = (loading: boolean) => {
    setIsLoadingState(loading);
  };

  const setError = (errorMsg: string | null) => {
    setErrorState(errorMsg);
  };

  const setEstimatedFontSize = (size: number | null) => {
    setEstimatedFontSizeState(size);
  };

  const resetStateForNewImage = () => {
    // Do not reset uploadedImageUrl or originalImageName here, as they are set by the new upload process.
    setOcrBlocksState([]);
    setSelectedBlockIdState(null);
    setIsScanningState(false); // Usually set to true right after for the new scan
    // setIsLoadingState(false); // Usually set to true right after for the new scan
    setErrorState(null);
    setEstimatedFontSizeState(null);
    // No need to clear localStorage here, new image data will overwrite.
  };

  const clearPersistedState = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    // Reset all state variables to their initial empty/default state
    setUploadedImageUrlState(null);
    setOriginalImageNameState(undefined);
    setOcrBlocksState([]);
    setSelectedBlockIdState(null);
    setIsScanningState(false);
    setIsLoadingState(false);
    setErrorState(null);
    setEstimatedFontSizeState(null);
    console.log("Persisted state cleared.");
  };


  return (
    <AppContext.Provider
      value={{
        uploadedImageUrl,
        // originalImageFile, // Not directly exposed from context due to serialization issues
        originalImageName,
        ocrBlocks,
        selectedBlockId,
        isScanning,
        isLoading,
        error,
        estimatedFontSize,
        setUploadedImageUrl,
        setOcrBlocks,
        updateOcrBlock,
        addOcrBlock,
        deleteOcrBlock,
        setSelectedBlockId,
        setIsScanning,
        setIsLoading,
        setError,
        setEstimatedFontSize,
        resetStateForNewImage,
        clearPersistedState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
