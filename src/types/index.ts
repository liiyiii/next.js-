// src/types/index.ts

export interface OCRBlock {
  id: string; // Unique ID for each block
  text: string; // Original recognized text
  translatedText: string; // Translated text
  blockBox: [number, number, number, number]; // [x, y, width, height] relative to the original image - defines the area
  fontInfo?: {
    family?: string; // e.g., "Arial", "宋体"
    size?: number;   // Font size in pixels for canvas rendering
    weight?: string; // e.g., "bold", "normal"
    style?: string;  // e.g., "italic", "normal"
  };
  colorInfo?: {
    fgColor?: string; // Foreground/text color as hex string, e.g., "#000000"
    bgColor?: string; // Background color of the text block as hex string, e.g., "#FFFFFF"
  };
  type?: string; // Type of content, if provided by OCR

  // Client-side state for editing, if needed directly on canvas (though toolbar is primary)
  isEditing?: boolean;
  currentEditText?: string;

  // User-overridden style properties (managed by TextEditToolbar and applied before drawing)
  fontSize?: number;   // User-defined font size (overrides fontInfo.size)
  fontColor?: string;  // User-defined font color (overrides colorInfo.fgColor)

  // Positional properties that can be overridden by the user (e.g. after dragging)
  // These are absolute coordinates on the canvas at zoomLevel 1, representing top-left of the blockBox
  position: {
    x: number;
    y: number
  };
}
