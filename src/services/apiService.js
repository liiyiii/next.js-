// src/services/apiService.js
export const API_BASE_URL = 'http://localhost:5000'; // Ensure this is correct for local testing

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

export async function ocrFullPage(imageFile, onUploadProgress) {
  const endpointUrl = `${API_BASE_URL}/api/ocr_full_page`;
  const formData = new FormData();
  formData.append('image_file', imageFile, imageFile.name || 'page_image.png');
  return createXhrPromise(endpointUrl, formData, onUploadProgress);
}

export async function ocrRegion(imageFile, region, onUploadProgress) {
  const endpointUrl = `${API_BASE_URL}/api/ocr_region`;
  const formData = new FormData();
  formData.append('image_file', imageFile, imageFile.name || 'page_image.png');
  formData.append('region', JSON.stringify(region));
  return createXhrPromise(endpointUrl, formData, onUploadProgress);
}
