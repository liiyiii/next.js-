# Image Translation WebApp - Submission Guide (JavaScript Version)

This document provides an overview of the developed Next.js frontend application (using plain JavaScript), the Python API simulator, instructions for running them, and guidance on integrating a real backend to achieve the full functionality of the image translation web application.

## 1. Overview

The project consists of two main parts:

1.  **Next.js Frontend Application (JavaScript)**: A client-side application built with Next.js and React (using plain JavaScript - `.jsx` and `.js` files). It provides the user interface for uploading images, viewing translated text overlays, editing text properties (content, font size, color, family, position), and exporting the results to JSON, JPG, or PDF.
2.  **Python Flask API Simulator (`api_simulator.py`)**: A simple Flask server that mimics the behavior of the backend API. It provides endpoints that the frontend calls, returning structured JSON data that simulates the output of OCR, layout analysis, style estimation, and translation. **Note: This simulator does not perform actual AI processing (OCR/Translation); it serves pre-defined or dynamically generated mock data.**

The primary goal of this submission is to deliver a feature-complete frontend (in JavaScript) that is ready to be connected to a fully functional backend API.

## 2. Frontend Application (JavaScript)

The core new feature is the `ImageTranslator` component and its associated services. All new React components are written in JavaScript using JSX.

### 2.1. Key Features Implemented (Frontend)

*   **Image Upload**: Users can upload JPG, PNG, or other common image formats.
*   **Canvas Display**: The uploaded image is rendered on an HTML5 canvas.
*   **Full Image "Translation" (Simulated)**:
    *   Button to trigger processing of the full image.
    *   Frontend calls the (simulated) `/api/ocr_full_page` endpoint.
    *   Displays returned text blocks (with mock translated text) overlaid on the image.
    *   Text blocks are styled according to `fontInfo` (family, size, weight, style) and `colorInfo` (foreground text color, background color fill for text replacement effect) from the API response.
*   **Regional "Translation" (Simulated)**:
    *   Users can draw a bounding box on the canvas.
    *   Upon releasing the mouse, the frontend calls the (simulated) `/api/ocr_region` endpoint with the image and region coordinates.
    *   Displays new text blocks for the selected region.
*   **Text Block Editing**:
    *   Clicking a text block selects it and opens an editing toolbar.
    *   **Toolbar Features**:
        *   Edit text content.
        *   Change font size.
        *   Change font color.
        *   Change font family (from a predefined list).
        *   Delete the text block.
*   **Text Block Manipulation**: Selected text blocks can be dragged to new positions on the canvas.
*   **Canvas Controls**:
    *   Zoom in/out using the mouse wheel.
    *   Panning occurs automatically to keep the pointer fixed during zoom.
*   **Export Functionality (Client-Side)**:
    *   **Export to JSON**: Downloads a `.json` file containing the array of all OCR block data (including user edits to text, position, and styles). The structure of these blocks is documented via JSDoc in `ImageTranslator.jsx` and `apiService.js`.
    *   **Export to JPG**: Downloads a `.jpg` image of the current canvas view (original image with all translated/edited text blocks rendered).
    *   **Export to PDF**: Uses `jsPDF` to generate and download a `.pdf` document containing the original image and all translated/edited text blocks.
*   **Localization**: UI elements are internationalized (English and Chinese) using the existing i18n setup.
*   **Styling**: Components are styled using Tailwind CSS and DaisyUI, consistent with the existing project.

### 2.2. Project Structure (Key New/Modified Files)

*   `src/app/page.jsx`: Main page, integrates the `ImageTranslator` component. (Converted from `.tsx`)
*   `src/app/layout.jsx`: Main layout component. (Converted from `.tsx`)
*   `src/components/ImageTranslator.jsx`: The core component for the image translation feature. (Converted from `.tsx`)
*   `src/components/TextEditToolbar.jsx`: Toolbar for editing text block properties. (Converted from `.tsx`)
*   `src/services/apiService.js`: Contains functions to call backend APIs. **Currently configured to call the Python API Simulator.** JSDoc added for data structures.
*   `jsconfig.json`: Added to configure paths (e.g., `@/*`) and JSX for the JavaScript project.
*   `tsconfig.json`: Modified to be passive and not interfere with JavaScript development (e.g., `checkJs: false`).
*   `next.config.js`: Converted from `next.config.ts`.
*   `api_simulator.py`: The Python Flask API simulator (see section 3).
*   `src/types/index.ts`: **Deleted**. Data structures are now documented via JSDoc in relevant `.js`/`.jsx` files.

### 2.3. Running the Frontend

1.  **Prerequisites**: Node.js and npm installed.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
    (This will install `jspdf` as well, which was added).
3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    The application will typically be available at `http://localhost:3000`.

## 3. Python Flask API Simulator (`api_simulator.py`)

This simulator provides the HTTP API endpoints that the frontend application expects.

### 3.1. Purpose and Limitations

*   **Purpose**:
    *   To allow frontend development and testing without a fully operational AI backend.
    *   To provide HTTP endpoints (`/api/ocr_full_page`, `/api/ocr_region`) that the frontend can call.
    *   To return JSON data that is **structurally identical** to what a real backend should provide. The structure and content of this mock data (especially `fontInfo` and `colorInfo`) are inspired by the logic in your provided Python utility scripts.
*   **Limitations**:
    *   **No Real OCR**: It does not perform actual OCR on uploaded images using PaddleOCR.
    *   **No Real Translation**: It does not perform real text translation (e.g., via Ollama). Translated text is mock.
    *   **No Real Layout/Style Analysis on Arbitrary Images**: The returned JSON for styles is based on pre-defined scenarios or simple dynamic generation for regions, not on deep analysis of arbitrary new images.
    *   **File Content Not Used for Deep Processing**: The content of the uploaded image file is primarily used to select a pre-defined scenario by filename (if matched); it's not deeply analyzed by the simulator.

### 3.2. Running the API Simulator

1.  **Prerequisites**: Python 3.x installed.
2.  **Create a Virtual Environment (Recommended)**:
    ```bash
    python -m venv venv_simulator
    # On Linux/macOS:
    source venv_simulator/bin/activate
    # On Windows:
    # venv_simulator\Scripts\activate
    ```
3.  **Install Dependencies**:
    ```bash
    pip install Flask Flask-CORS
    ```
4.  **Run the Simulator**:
    Navigate to the directory containing `api_simulator.py` and run:
    ```bash
    python api_simulator.py
    ```
    The simulator will start on `http://localhost:5000`. Console output will indicate it's running and list available mock scenarios that can be triggered by filename.

### 3.3. How it Works

*   The simulator has two POST endpoints: `/api/ocr_full_page` and `/api/ocr_region`.
*   It contains `SAMPLE_SCENARIOS` with pre-defined JSON responses.
*   For `/ocr_full_page`, if the uploaded filename matches a key in `SAMPLE_SCENARIOS`, that data is returned. Otherwise, a "default" scenario is served.
*   For `/ocr_region`, it dynamically generates a mock text block based on the requested region coordinates.
*   The JSDoc comments in `apiService.js` and `ImageTranslator.jsx` describe the expected `OCRBlockData` structure that this simulator provides.

## 4. Path to a Fully Functional WebApp (Your Next Steps)

To transform this into a fully functional web application with real-time AI processing, you will need to develop and integrate a **real backend API service**.

### 4.1. Develop the Real Backend API

This is the most significant part. You need to:

1.  **Choose/Use a Python Web Framework**: Flask or FastAPI are suitable.
2.  **Implement `/api/ocr_full_page` Endpoint**:
    *   Accept an image file upload.
    *   Use your Python script logic (e.g., from `from-ocr-image-merge.py` and `to-ocr-pptx.py`) to:
        *   Perform OCR using PaddleOCR.
        *   Extract raw text and bounding boxes.
        *   **Integrate Ollama**: For each extracted text segment, call your local Ollama LLM to get the translation. This is a critical step you will implement.
        *   Perform text block merging.
        *   Estimate font properties (`fontInfo`: size, family, weight, style).
        *   Estimate color properties (`colorInfo`: `fgColor`, `bgColor`) using your `ColorEstimator` class.
    *   Structure the final data into a JSON response matching the `OCRBlockData` structure (see JSDoc in the frontend code). Each block in the `blockList` should have `text`, `translatedText`, `blockBox`, `fontInfo`, `colorInfo`, and initial `position`.
3.  **Implement `/api/ocr_region` Endpoint**:
    *   Accept an image file and `region` coordinates.
    *   Crop the image to the specified region.
    *   Perform OCR, Translation (Ollama), style estimation, and block merging **on the cropped region**.
    *   Return JSON structured identically to `/api/ocr_full_page`.
4.  **Handle Dependencies**: Ensure your backend environment has all necessary libraries (PaddleOCR, Ollama client (if any), Flask/FastAPI, Pillow, NumPy, scikit-learn, etc.).
5.  **Production Considerations**: Error handling, logging, security, and scalability.

### 4.2. Connect Frontend to Real Backend

1.  **Stop the Python API Simulator.**
2.  **Start your real backend API service** (ensure it's running on a known address, e.g., `http://localhost:5000` or your production URL).
3.  **Modify `src/services/apiService.js` in the frontend**:
    *   Comment out or remove the MOCK IMPLEMENTATION sections for `ocrFullPage` and `ocrRegion`.
    *   Uncomment or implement the actual `createXhrPromise` (or `fetch`) calls to your real backend API endpoints. Ensure `API_BASE_URL` is correctly set.
    ```javascript
    // Example for ocrFullPage in apiService.js
    export async function ocrFullPage(imageFile, onUploadProgress) {
      const endpointUrl = `${API_BASE_URL}/api/ocr_full_page`; // Your real endpoint
      const formData = new FormData();
      formData.append('image_file', imageFile, imageFile.name || 'image.png');
      console.log(`API Service: Calling REAL ocrFullPage for file: ${imageFile.name}`);
      return createXhrPromise(endpointUrl, formData, onUploadProgress); // Or use fetch
    }
    // Similar for ocrRegion...
    ```
4.  **Test Thoroughly**: With the frontend now connected to your real backend, perform extensive testing.

### 4.3. (Optional) Backend-Generated PDF

If the client-side PDF generation using `jsPDF` has limitations (especially with complex font rendering or layout fidelity):
*   Create a new backend endpoint (e.g., `/api/export_pdf`).
*   This endpoint would accept the `ocrBlocks` JSON data (including all user edits) from the frontend.
*   Use your Python PDF generation logic (e.g., with `fitz` from your `to-ocr-pptx.py` script, or `reportlab`) on the server to create a high-quality PDF.
*   Send the PDF file back to the frontend for download.
*   The frontend `handleExportPdf` function would then be changed to call this API endpoint.

## 5. Conclusion

This submission provides a feature-rich JavaScript-based frontend application and a corresponding Python API simulator. This setup allows for comprehensive testing of all UI interactions and functionalities. The path to integrating a real AI-powered backend is clearly defined, leveraging your existing Python script logic as a strong foundation for the backend's data processing and structure.

Good luck with the backend development!
---
