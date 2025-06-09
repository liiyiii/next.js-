// src/services/apiService.js

const API_BASE_URL = 'http://localhost:5000';

/**
 * Helper function to handle XHR requests for file uploads.
 * @param {string} endpoint - The API endpoint to call.
 * @param {File} pdfFile - The PDF file to upload.
 * @param {(progress: number) => void} onUploadProgress - Callback for upload progress.
 * @returns {Promise<any>} - Promise resolving with JSON response or rejecting with an error object.
 */
function performPdfConversionRequest(endpoint, pdfFile, onUploadProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, true);

    // Set responseType to 'blob' for file download, but we'll parse JSON from text first if possible
    // For file download, the backend should send Content-Disposition header.
    // If the response is always JSON (even for errors), then 'json' might be okay,
    // but 'text' is safer for manual parsing before deciding.
    // Let's assume the success response for conversion is a file blob, and errors are JSON.
    // However, the task asks to parse xhr.responseText as JSON and resolve.
    // This implies the backend sends JSON for success too, which might contain a download URL or file info.
    // If the backend sends the file directly, then responseType should be 'blob'.
    // Given the example, it seems to expect JSON response text, so we'll stick to that for now.

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
        // Attempt to parse as JSON first, as per instruction for success.
        // If direct file download is the actual success case, this needs adjustment.
        const responseText = xhr.responseText;
        if (xhr.status >= 200 && xhr.status < 300) {
          // Assuming the success response is JSON as per "parse xhr.responseText as JSON and resolve"
          // If the actual success response is a file blob, then `xhr.response` (with xhr.responseType = 'blob') should be used.
          try {
            const responseJson = JSON.parse(responseText);
            resolve(responseJson);
          } catch (e) {
            // This case might happen if the server sends a file directly on 2xx status
            // but instructions say "parse ... as JSON and resolve".
            // For now, we'll consider this a parsing failure if not JSON.
            console.warn('API Service: Response was 2xx but not valid JSON. ResponseText:', responseText);
            reject({ 
              status: xhr.status, 
              message: 'Response was successful but not valid JSON: ' + responseText, 
              errorObject: e 
            });
          }
        } else {
          // Handle non-2xx status codes (errors)
          let errorMessage = xhr.statusText || 'Unknown error';
          try {
            const errorJson = JSON.parse(responseText);
            errorMessage = errorJson.error || errorJson.message || errorMessage;
          } catch (e) {
            // ResponseText was not JSON, use it as is or default.
            if(responseText) errorMessage = responseText;
          }
          reject({ status: xhr.status, message: errorMessage, response: responseText });
        }
      } catch (e) {
        // This catch is for if JSON.parse itself throws an error on non-JSON responseText
        // (though typically, the try-catch inside the 2xx block would handle JSON parsing for success).
        // This primarily catches issues if `xhr.responseText` itself is problematic before parsing.
        reject({ status: xhr.status, message: 'Failed to process response: ' + xhr.responseText, errorObject: e });
      }
    };

    xhr.onerror = () => {
      // Network errors (e.g., CORS, server down)
      reject({ status: xhr.status, message: 'Network error or CORS issue.' });
    };

    xhr.onabort = () => {
      reject({ status: 0, message: 'Request aborted.' });
    };

    const formData = new FormData();
    formData.append('pdf_file', pdfFile); 
    xhr.send(formData);
  });
}

/**
 * Converts a digital PDF to an editable format.
 * @param {File} pdfFile - The PDF file to upload.
 * @param {(progress: number) => void} onUploadProgress - Callback for upload progress.
 * @returns {Promise<any>} - Promise resolving with the conversion result.
 */
export async function convertDigitalPdf(pdfFile, onUploadProgress) {
  const endpointUrl = `${API_BASE_URL}/convert_digital`;
  return performPdfConversionRequest(endpointUrl, pdfFile, onUploadProgress);
}

/**
 * Converts an image-based or scanned PDF to an editable format using OCR.
 * @param {File} pdfFile - The PDF file to upload.
 * @param {(progress: number) => void} onUploadProgress - Callback for upload progress.
 * @returns {Promise<any>} - Promise resolving with the conversion result.
 */
export async function convertImageOcrPdf(pdfFile, onUploadProgress) {
  const endpointUrl = `${API_BASE_URL}/convert_image_ocr`;
  return performPdfConversionRequest(endpointUrl, pdfFile, onUploadProgress);
}
