// API service for interacting with the Flask backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/api';

export interface OcrBlockData {
  id: string;
  bbox: [number, number, number, number];
  text: string;
  translatedText?: string;
}

export interface OcrLayoutResponse {
  message: string;
  image_url: string; // URL or path to the processed image on the server
  font_size: number;
  blocks: OcrBlockData[];
  scores?: number[]; // Optional
}

export interface TranslateResponse {
  translated_texts: string[];
}

/**
 * Uploads an image file for OCR and layout analysis.
 * @param imageFile The image file to upload.
 * @param lang The language for OCR (e.g., 'en', 'ch').
 * @returns Promise<OcrLayoutResponse>
 */
export const uploadImageForOcr = async (imageFile: File, lang: string = 'en'): Promise<OcrLayoutResponse> => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('lang', lang);

  const response = await fetch(`${API_BASE_URL}/ocr-and-layout`, {
    method: 'POST',
    body: formData,
    // Headers are not strictly necessary for FormData with fetch, browser sets them.
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'API request failed with no JSON response' }));
    throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

/**
 * Sends texts to the backend for translation.
 * @param texts Array of strings to translate.
 * @param targetLang Target language code (e.g., 'en', 'es', 'zh').
 * @returns Promise<TranslateResponse>
 */
export const translateTexts = async (texts: string[], targetLang: string = 'en'): Promise<TranslateResponse> => {
  const response = await fetch(`${API_BASE_URL}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ texts, target_lang: targetLang }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Translation request failed' }));
    throw new Error(errorData.error || `Translation API Error: ${response.status}`);
  }
  return response.json();
};

/**
 * Requests file export from the backend.
 * @param format The desired export format ('pdf', 'jpg', 'json').
 * @param imageUrl The URL of the original image (used as base for JPG/PDF).
 * @param blocks Array of text blocks with their current text, translations, and positions.
 * @returns Promise<Blob> for file types, or Promise<any> for JSON.
 */
export const exportFile = async (
  format: 'pdf' | 'jpg' | 'json',
  imageUrl: string | null, // Can be null if not needed for JSON
  blocks: OcrBlockData[]
): Promise<Blob | any> => {
  const payload = {
    format,
    image_url: imageUrl,
    blocks,
    // Add any other necessary data for styling, DPI, etc. for PDF/JPG
  };

  const response = await fetch(`${API_BASE_URL}/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Export request failed' }));
    throw new Error(errorData.error || `Export API Error: ${response.status}`);
  }

  if (format === 'json') {
    return response.json();
  } else {
    // For PDF and JPG, expect a file blob
    return response.blob();
  }
};

/**
 * Helper to trigger file download in the browser.
 * @param blob The file blob to download.
 * @param filename The desired filename for the download.
 */
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
