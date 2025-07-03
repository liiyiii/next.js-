// src/services/apiService.js

/**
 * @typedef {object} FontInfo - Describes font properties.
 * @property {string} [family] - e.g., "Arial", "宋体"
 * @property {number} [size] - Font size in pixels.
 * @property {string} [weight] - e.g., "bold", "normal".
 * @property {string} [style] - e.g., "italic", "normal".
 */

/**
 * @typedef {object} ColorInfo - Describes color properties.
 * @property {string} [fgColor] - Foreground/text color as hex string, e.g., "#000000".
 * @property {string} [bgColor] - Background color of the text block as hex string, e.g., "#FFFFFF".
 */

/**
 * @typedef {object} OCRBlockData - Represents a block of recognized and translated text with styling.
 * @property {string} id - Unique ID for each block.
 * @property {string} text - Original recognized text.
 * @property {string} translatedText - Translated text.
 * @property {[number, number, number, number]} blockBox - Bounding box `[x, y, width, height]` relative to the original image.
 * @property {FontInfo} [fontInfo] - Information about the font.
 * @property {ColorInfo} [colorInfo] - Information about colors.
 * @property {string} [type] - Type of content, if provided by OCR.
 * @property {{ x: number; y: number }} position - Current top-left `[x, y]` coordinates on the canvas (at zoomLevel 1), can be dragged.
 * @property {number} [fontSize] - User-overridden font size.
 * @property {string} [fontColor] - User-overridden font color (hex string).
 */

/**
 * @typedef {object} OCRResponse
 * @property {OCRBlockData[]} blockList - A list of OCR blocks.
 */

export const API_BASE_URL = 'http://localhost:5000'; // Ensure this is correct for local testing

// Helper to convert RGB tuple to hex string
const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
  const hex = x.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}).join('');


function createXhrPromise(endpoint, formData, onUploadProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded * 100) / event.total);
        if (onUploadProgress) {
          onUploadProgress(percentage);
        }
      }
    };

    xhr.onload = () => {
      try {
        const responseText = xhr.responseText;
        console.log(`API Service Response for ${endpoint}: Status ${xhr.status}, ResponseText:`, responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const responseJson = JSON.parse(responseText);
            resolve(responseJson);
          } catch (e) {
            console.error(`API Service Success (but not JSON) for ${endpoint}: Status`, xhr.status, 'ResponseText:', responseText, 'Error:', e);
            reject({
              status: xhr.status,
              message: `Response was successful but not valid JSON: ${responseText}`,
              errorObject: e,
              responseText: responseText
            });
          }
        } else {
          let errorMessage = xhr.statusText || `Unknown error during XHR load (status ${xhr.status})`;
          if (responseText && responseText.trim() !== '') {
            try {
                const errorJson = JSON.parse(responseText);
                errorMessage = errorJson.error || errorJson.message || errorMessage;
            } catch (e) {
                errorMessage = responseText; // Use responseText if not JSON
            }
          }
          console.error(`API Service Error (onload) for ${endpoint}: Status`, xhr.status, 'Message:', errorMessage, 'ResponseText:', responseText);
          reject({ status: xhr.status, message: errorMessage, response: responseText });
        }
      } catch (e) {
        console.error(`API Service Error (onload exception) for ${endpoint}: Status`, xhr.status, 'Error:', e, 'ResponseText:', xhr.responseText);
        reject({ status: xhr.status, message: `Failed to process response: ${xhr.responseText || e.message}`, errorObject: e, responseText: xhr.responseText });
      }
    };

    xhr.onerror = (err) => {
      console.error('API Service Network Error: Endpoint', endpoint, 'Status', xhr.status, 'StatusText', xhr.statusText, 'ErrorObject:', err);
      reject({ status: xhr.status || 0, message: `Network error or server not responding at ${endpoint}. Check backend console.`, endpoint: endpoint, errorEvent: err });
    };

    xhr.onabort = () => {
      console.error('API Service Request Aborted: Endpoint', endpoint);
      reject({ status: 0, message: 'Request aborted.', endpoint: endpoint });
    };

    console.log(`API Service: Sending request to ${endpoint} with FormData.`);
    xhr.send(formData);
  });
}

export async function convertDigitalPdf(pdfFile, onUploadProgress) {
  const endpointUrl = `${API_BASE_URL}/convert_digital`;
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  return createXhrPromise(endpointUrl, formData, onUploadProgress);
}

export async function convertImageOcrPdf(pdfFile, onUploadProgress) {
  const endpointUrl = `${API_BASE_URL}/convert_image_ocr`;
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  return createXhrPromise(endpointUrl, formData, onUploadProgress);
}

// New function for full page OCR and translation of images
export async function ocrFullPage(imageFile, onUploadProgress) {
  // const endpointUrl = `${API_BASE_URL}/api/ocr_full_page`;
  // const formData = new FormData();
  // formData.append('image_file', imageFile, imageFile.name || 'image.png');
  // console.log(`API Service: Calling ocrFullPage for file: ${imageFile.name}`);
  // return createXhrPromise(endpointUrl, formData, onUploadProgress);

  // MOCK IMPLEMENTATION
  console.log(`API Service (MOCK): Called ocrFullPage for file: ${imageFile.name}`);
  return new Promise(resolve => {
    setTimeout(() => { // Simulate network delay
      resolve({
        blockList: [
          {
            id: 'mockblock1_fullname', // Changed ID for clarity
            text: "Hello World, this is an example of a longer text block.",
            translatedText: "你好世界，这是一个较长文本块的示例。",
            blockBox: [50, 50, 300, 60], // x, y, width, height
            fontInfo: { size: 24, family: "Arial", weight: "bold", style: "italic" },
            colorInfo: { fgColor: rgbToHex(0,0,0), bgColor: rgbToHex(220,220,220) }, // Black text on light gray bg
            position: { x: 50, y: 50 }
          },
          {
            id: 'mockblock2_fullname',
            text: "Another example line",
            translatedText: "另一个示例行",
            blockBox: [70, 130, 250, 35],
            fontInfo: { size: 20, family: "Times New Roman", weight: "normal", style: "normal" },
            colorInfo: { fgColor: rgbToHex(255,255,255), bgColor: rgbToHex(0,0,128) }, // White text on dark blue bg
            position: { x: 70, y: 130 }
          },
          {
            id: 'mockblock3_fullname',
            text: "More Text Here",
            translatedText: "这里有更多文本",
            blockBox: [60, 200, 180, 30],
            fontInfo: { size: 18, family: "Courier New", weight: "normal", style: "italic" },
            colorInfo: { fgColor: rgbToHex(50,50,50), bgColor: rgbToHex(200,250,200) }, // Dark gray text on light green bg
            position: { x: 60, y: 200 }
          }
        ]
      });
    }, 1500);
  });
}

// New function for regional OCR and translation of images
export async function ocrRegion(imageFile, region, onUploadProgress) {
  // const endpointUrl = `${API_BASE_URL}/api/ocr_region`;
  // const formData = new FormData();
  // formData.append('image_file', imageFile, imageFile.name || 'image.png');
  // formData.append('region', JSON.stringify(region));
  // console.log(`API Service: Calling ocrRegion for file: ${imageFile.name}, region: ${JSON.stringify(region)}`);
  // return createXhrPromise(endpointUrl, formData, onUploadProgress);

  // MOCK IMPLEMENTATION
  console.log(`API Service (MOCK): Called ocrRegion for file: ${imageFile.name}, region: ${JSON.stringify(region)}`);
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        blockList: [
          {
            id: `mockregion-${Date.now()}`,
            text: "Regional Text Snippet",
            translatedText: "区域文本片段",
            // For mock, assume blockBox is relative to the original image, fitting within the region
            blockBox: [region.x + 5, region.y + 5, Math.max(50, region.width - 10), Math.max(20, region.height - 10)],
            fontInfo: { size: 16, family: "Verdana", weight: "normal", style: "normal" },
            colorInfo: { fgColor: rgbToHex(0,100,0), bgColor: rgbToHex(255,255,200) }, // Dark green text on light yellow bg
            position: { x: region.x + 5, y: region.y + 5 }
          }
        ]
      });
    }, 1000);
  });
}
