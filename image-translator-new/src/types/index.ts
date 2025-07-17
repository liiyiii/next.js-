// Corresponds to the Area class from the Vue script and OCRBlock from ipcService
export interface AreaStyle {
  fontSize: number;
  lineHeight?: number;
  backgroundColor: string; // Will often be transparent for text on canvas
  color: string; // Text color
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  fontFamily: string;
  textDecoration: 'none' | 'underline' | 'line-through' | 'overline'; // Added 'overline'
  textAlign: 'left' | 'center' | 'right' | 'justify';
  // writingMode?: 'horizontal-tb' | 'vertical-rl' | 'vertical-lr';
}

export interface Area {
  id: string;
  bbox: [number, number, number, number]; // x1, y1, x2, y2 relative to original image
  sourceString: string;
  translatedString: string;
  style: AreaStyle;
  // fabricObjectRef?: fabric.Object; // Optional: direct reference to the Fabric object on canvas
}
