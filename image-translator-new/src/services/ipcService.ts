// Define types (can be moved to a central types/ file later)
export interface OCRBlock {
  id: string;
  bbox: [number, number, number, number]; // x1, y1, x2, y2
  text: string;
  translatedText?: string;
  // Add other potential fields like confidence, original_text, etc.
}

export interface IPCResponse {
  imagePath: string; // Path to the background image (could be a data URL for mock)
  ocrData: OCRBlock[];
  estimatedFontSize?: number;
  error?: string; // Optional error message
}

// Simulates calling the backend batch file and getting results
export const mockIPCService = async (
  uploadedFile: File,
  // targetLang: string // Future parameter
): Promise<IPCResponse> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const imageUrl = reader.result as string; // This will be a data URL

      // Simulate some processing delay
      setTimeout(() => {
        // Simulate a potential error
        // if (Math.random() < 0.1) { // 10% chance of error
        //   resolve({ imagePath: '', ocrData: [], error: "Mock backend processing failed!" });
        //   return;
        // }

        // Mock OCR data - this should be more dynamic or based on image characteristics if possible
        const mockOcrData: OCRBlock[] = [
          { id: `mock-${Date.now()}-1`, bbox: [50, 50, 250, 100], text: "Hello World from Image", translatedText: "你好世界 (图片)" },
          { id: `mock-${Date.now()}-2`, bbox: [60, 120, 300, 170], text: "This is a test sentence.", translatedText: "这是一个测试句子。" },
          { id: `mock-${Date.now()}-3`, bbox: [70, 190, 220, 240], text: "Another line of text.", translatedText: "另一行文字。" },
          { id: `mock-${Date.now()}-4`, bbox: [300, 60, 550, 110], text: "More Content Here for Translation", translatedText: "这里有更多内容等待翻译" },
          { id: `mock-${Date.now()}-5`, bbox: [100, 280, 400, 330], text: "Final example block.", translatedText: "最后一个示例块。" },
        ];

        resolve({
          imagePath: imageUrl, // For mock, use the data URL of the uploaded image
          ocrData: mockOcrData,
          estimatedFontSize: 18, // Example font size from your design doc (or Vue script)
        });
      }, 1500); // Simulate 1.5 seconds delay
    };

    reader.onerror = () => {
      // Use reject for Promise errors
      reject(new Error("Failed to read file for mock IPC."));
    };

    // Handle cases where uploadedFile might not be what's expected (though type guards should help)
    if (!uploadedFile || typeof uploadedFile.type === 'undefined' || !uploadedFile.type.startsWith('image/')) {
        // Use reject for Promise errors
        reject(new Error("Invalid file type. Please upload an image."));
        return;
    }

    reader.readAsDataURL(uploadedFile);
  });
};

// Mock for partial scan (框选补漏)
export const mockPartialScanIPCService = async (
  // originalImageFile: File, // In a real scenario, you'd send the original file + bbox
  // selectedBbox: [number, number, number, number]
  // For mock, we might just simulate based on a generic idea or a new (small) image data URL
  croppedImageDataUrl?: string // Optional: if frontend can provide a crop
): Promise<OCRBlock | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // If no specific cropped image data, return a generic new block
      const text = croppedImageDataUrl ? "Text from Selected Area" : "Newly Added Text Block";
      const translated = croppedImageDataUrl ? "选中区域文本" : "新添加文本块";

      resolve({
        id: `manual-${Date.now()}`,
        // Bbox would ideally be relative to the original image if this info was passed.
        // For a new block created from scratch without specific crop, it's arbitrary.
        // For now, let's assume it's a generic size/position for a new block.
        bbox: [10, 10, 150, 50], // Placeholder bbox
        text: text,
        translatedText: translated
      });
    }, 700);
  });
};
