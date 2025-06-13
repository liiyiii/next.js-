from flask import Flask, request, send_file, render_template, jsonify
import os, io, tempfile, shutil, time, uuid
from pathlib import Path
from werkzeug.utils import secure_filename
from flask_cors import CORS # Import CORS

# For Digital PDF Conversion
from pdf2docx import Converter as Pdf2DocxConverter

# For Image PDF (OCR) Conversion
import requests
import json
import pypandoc # Make sure pypandoc is imported
import subprocess # For LibreOffice
from pdf2image import convert_from_path # For PDF to image previews

app = Flask(__name__)
CORS(app) # Enable CORS for all routes and origins

# --- Global Variables and Setup ---
STATIC_CONVERSIONS_DIR = Path('/tmp/converted_files').resolve()

# --- Helper Functions ---
def init_landing_ai_header():
    try:
        api_key = os.environ.get("LANDINGAI_API_KEY")
        if not api_key:
            print("Warning: LANDINGAI_API_KEY environment variable not set. OCR will likely fail.")
            return None
        return { "Authorization": "Basic " + api_key }
    except Exception as e:
        print(f"Error initializing Landing AI header: {e}")
        return None

def get_agentic_document_analysis(input_pdf_path: Path, output_json_path: Path):
    headers = init_landing_ai_header()
    if headers is None:
        raise ValueError("Landing AI API not configured. LANDINGAI_API_KEY environment variable may be missing. Cannot perform OCR.")

    url = "https://api.va.landing.ai/v1/tools/agentic-document-analysis"
    try:
        with open(input_pdf_path, "rb") as f:
            files = {"pdf": f}
            response = requests.post(url, files=files, headers=headers)
        response.raise_for_status() # Raises an HTTPError for bad responses (4XX or 5XX)
        with open(output_json_path, "w") as outfile:
            json.dump(response.json(), outfile, indent=2)
        print(f"Agentic document analysis saved to {output_json_path}")
    except requests.exceptions.RequestException as e:
        # More specific error message for network/API issues
        error_message = f"Error calling Landing AI API: {e}"
        if hasattr(e, 'response') and e.response is not None:
            error_message += f" - Response: {e.response.text}"
        print(error_message)
        raise requests.exceptions.RequestException(error_message) # Re-raise with more info
    except Exception as e: # Catch other potential errors
        print(f"An unexpected error occurred in get_agentic_document_analysis: {e}")
        raise # Re-raise the original exception

def agentic_md_extraction(json_file: Path, md_file: Path):
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            content = json.load(f)
        
        if "data" not in content or "chunks" not in content["data"]:
            print(f"Warning: 'data' or 'chunks' not found in JSON from {json_file}. Writing empty MD file.")
            with open(md_file, 'w', encoding='utf-8') as f_md:
                f_md.write("") # Create an empty markdown file
            return

        chunks = content["data"]["chunks"]
        # Filter out non-text chunks and ensure 'text' key exists
        markdown_text_only = [chunk["text"] for chunk in chunks if chunk.get("chunk_type") != "figure" and "text" in chunk]
        
        with open(md_file, 'w', encoding='utf-8') as f_md:
            f_md.write("\n\n".join(markdown_text_only))
        print(f"Markdown extracted to {md_file}")
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from {json_file}: {e}")
        raise # Re-raise to be caught by the route's error handler
    except Exception as e:
        print(f"An error occurred in agentic_md_extraction: {e}")
        raise # Re-raise

def cleanup_old_files(directory: Path, max_age_seconds: int):
    current_time = time.time()
    print(f"Running cleanup in {directory} for items older than {max_age_seconds} seconds.")
    if not directory.exists():
        print(f"Cleanup directory {directory} does not exist. Skipping cleanup.")
        return
    for item in directory.iterdir():
        if item.is_dir(): # Each conversion is a directory
            try:
                item_creation_time = item.stat().st_mtime # Use modification time
                if (current_time - item_creation_time) > max_age_seconds:
                    print(f"Cleaning up old conversion directory: {item}")
                    shutil.rmtree(item)
            except Exception as e:
                print(f"Error during cleanup of directory {item}: {e}")

def generate_docx_previews(docx_path: Path, output_dir: Path, conversion_id: str, max_pages: int = 3) -> list[str]:
    preview_image_urls = []
    pdf_temp_dir = None
    try:
        print(f"Starting DOCX to PDF conversion for: {docx_path}")
        # 1. Convert DOCX to PDF using LibreOffice
        # Create a temporary directory for LibreOffice to output the PDF
        pdf_temp_dir_path_str = tempfile.mkdtemp(prefix="lo_pdf_")
        pdf_temp_dir = Path(pdf_temp_dir_path_str)
        
        # LibreOffice command
        # Using --headless --invisible for good measure
        # --convert-to pdf:writer_pdf_Export is more specific
        # --outdir specifies where the PDF goes
        cmd = [
            'soffice', '--headless', '--invisible', '--nologo', '--norestore',
            '--convert-to', 'pdf:writer_pdf_Export',
            '--outdir', str(pdf_temp_dir),
            str(docx_path)
        ]
        process = subprocess.run(cmd, capture_output=True, text=True, timeout=60) # 60-second timeout

        if process.returncode != 0:
            print(f"LibreOffice DOCX to PDF conversion failed. Error: {process.stderr}")
            # Try to find the PDF anyway, sometimes soffice returns non-zero on success with warnings
            # Fall through to PDF check

        # Find the generated PDF file (LibreOffice names it the same as the DOCX but with .pdf)
        # It should be in pdf_temp_dir
        converted_pdf_path = pdf_temp_dir / f"{docx_path.stem}.pdf"

        if not converted_pdf_path.exists():
            print(f"Converted PDF not found at {converted_pdf_path} after LibreOffice call. stderr: {process.stderr}, stdout: {process.stdout}")
            # If soffice truly failed and no PDF was created, return empty list
            if process.returncode != 0 : return []


        print(f"DOCX to PDF conversion successful: {converted_pdf_path}")

        # 2. Convert PDF pages to images using pdf2image
        # Output images directly into the request_specific_dir (output_dir)
        images = convert_from_path(
            str(converted_pdf_path),
            dpi=150,  # Lower DPI for smaller preview images
            first_page=1,
            last_page=max_pages, # Limit number of preview pages
            fmt='png', # Output format
            output_folder=str(output_dir), # Save images directly to the conversion's static folder
            output_file=f"{docx_path.stem}_preview" # Prefix for generated image names like prefix_1.png, prefix_2.png
        )

        for i, image_path_obj in enumerate(images): # images is a list of Path objects to the saved images
            # image_path_obj is the absolute path to the image. We need its filename.
            image_filename = image_path_obj.name
            preview_image_urls.append(f"/files/{conversion_id}/{image_filename}")
            print(f"Generated preview image: {image_filename} with URL {preview_image_urls[-1]}")
            if i + 1 >= max_pages: # Ensure we don't generate more than max_pages
                break
        
        print(f"Generated {len(preview_image_urls)} preview images for {docx_path.name}")

    except FileNotFoundError as e: # Specifically for soffice not found
        print(f"Error generating DOCX previews: soffice (LibreOffice) not found. {e}")
        # This indicates an environment issue.
        # Consider returning a special error or specific URLs that indicate a preview failure.
        # For now, returning empty list.
        return []
    except subprocess.TimeoutExpired:
        print(f"Error generating DOCX previews: LibreOffice conversion timed out for {docx_path}")
        return []
    except Exception as e:
        print(f"Error generating DOCX previews for {docx_path}: {e}")
        import traceback
        traceback.print_exc()
        # Return empty list on error, so frontend shows "no preview"
        return []
    finally:
        # Clean up the temporary directory used for PDF conversion
        if pdf_temp_dir and pdf_temp_dir.exists():
            try:
                shutil.rmtree(pdf_temp_dir)
                print(f"Cleaned up temporary PDF directory: {pdf_temp_dir}")
            except Exception as e_clean:
                print(f"Error cleaning up temp PDF directory {pdf_temp_dir}: {e_clean}")
    
    return preview_image_urls

# --- Routes ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/files/<conversion_id>/<filename>')
def serve_converted_file(conversion_id, filename):
    # Secure the inputs
    safe_conversion_id = secure_filename(conversion_id)
    safe_filename = secure_filename(filename)

    # Basic check to ensure no path manipulation characters slipped through
    if conversion_id != safe_conversion_id or filename != safe_filename:
         return jsonify({"error": "Invalid path components"}), 400

    file_path = STATIC_CONVERSIONS_DIR / safe_conversion_id / safe_filename
    
    # Resolve the path to prevent directory traversal (e.g., ../../etc/passwd)
    resolved_file_path = file_path.resolve()

    # Security check: Ensure the resolved path is still within STATIC_CONVERSIONS_DIR
    if not str(resolved_file_path).startswith(str(STATIC_CONVERSIONS_DIR)):
        return jsonify({"error": "Forbidden"}), 403 # Or 404, depending on desired behavior

    if resolved_file_path.is_file():
        return send_file(str(resolved_file_path))
    else:
        return jsonify({"error": "File not found"}), 404

@app.route('/convert_digital', methods=['POST'])
def convert_digital_pdf():
    cleanup_old_files(STATIC_CONVERSIONS_DIR, 3600) # Cleanup old files (1 hour)

    if 'pdf_file' not in request.files:
        return jsonify({"error": "No PDF file provided"}), 400
    
    file = request.files['pdf_file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and file.filename.endswith('.pdf'):
        try:
            original_pdf_filename = secure_filename(file.filename)
            
            conversion_id = str(uuid.uuid4())
            request_specific_dir = STATIC_CONVERSIONS_DIR / conversion_id
            request_specific_dir.mkdir(parents=True, exist_ok=True)

            pdf_path = request_specific_dir / original_pdf_filename
            file.save(str(pdf_path)) # Flask's FileStorage save method takes a string or Path
            print(f"Digital PDF saved to: {pdf_path}")

            docx_filename = Path(original_pdf_filename).stem + '_digital.docx'
            docx_path = request_specific_dir / docx_filename

            # Perform conversion
            cv = Pdf2DocxConverter(str(pdf_path))
            cv.convert(str(docx_path))
            cv.close()
            print(f"Digital PDF converted to DOCX: {docx_path}")

            # Generate previews
            preview_image_urls = generate_docx_previews(docx_path, request_specific_dir, conversion_id) # Using default max_pages=3
            
            download_url = f"/files/{conversion_id}/{docx_filename}"
            
            return jsonify({
                "downloadUrl": download_url,
                "previewImageUrls": preview_image_urls,
                "originalFilename": original_pdf_filename
            }), 200
        except Exception as e:
            print(f"Error during digital PDF conversion: {e}")
            import traceback
            traceback.print_exc()
            # Note: request_specific_dir is not removed here; cleanup_old_files will handle it.
            return jsonify({"error": f"Digital conversion failed: {str(e)}"}), 500
    else:
        return jsonify({"error": "Invalid file type for digital conversion. Please upload a PDF."}), 400

@app.route('/convert_image_ocr', methods=['POST'])
def convert_image_ocr_pdf():
    cleanup_old_files(STATIC_CONVERSIONS_DIR, 3600) # Cleanup old files (1 hour)

    if 'pdf_file' not in request.files:
        return jsonify({"error": "No PDF file provided for OCR conversion"}), 400
    
    file = request.files['pdf_file']
    if file.filename == '':
        return jsonify({"error": "No selected file for OCR conversion"}), 400

    if file and file.filename.endswith('.pdf'):
        try:
            original_pdf_filename = secure_filename(file.filename)
            
            conversion_id = str(uuid.uuid4())
            request_specific_dir = STATIC_CONVERSIONS_DIR / conversion_id
            request_specific_dir.mkdir(parents=True, exist_ok=True)

            saved_pdf_path = request_specific_dir / original_pdf_filename
            file.save(str(saved_pdf_path))
            print(f"Image PDF saved to: {saved_pdf_path}")

            # Define intermediate and final file paths
            analysis_json_path = request_specific_dir / "analysis_output.json"
            extracted_md_path = request_specific_dir / "extracted.md"
            docx_filename = Path(original_pdf_filename).stem + '_ocr.docx'
            converted_docx_path = request_specific_dir / docx_filename
            
            # get_agentic_document_analysis will call init_landing_ai_header internally
            # and raise ValueError if there's a config issue.
            print("Starting Landing AI Document Analysis for OCR...")
            get_agentic_document_analysis(saved_pdf_path, analysis_json_path)
            
            print("Starting Markdown Extraction for OCR...")
            agentic_md_extraction(analysis_json_path, extracted_md_path)

            print("Starting Pandoc Conversion (MD to DOCX) for OCR...")
            # Ensure Pandoc is available (checked at startup, but good to be aware)
            pypandoc.convert_file(str(extracted_md_path), 'docx', outputfile=str(converted_docx_path))
            print(f"Image PDF (OCR) converted to DOCX: {converted_docx_path}")

            # Generate previews
            preview_image_urls = generate_docx_previews(converted_docx_path, request_specific_dir, conversion_id) # Using default max_pages=3
            download_url = f"/files/{conversion_id}/{docx_filename}"

            return jsonify({
                "downloadUrl": download_url,
                "previewImageUrls": preview_image_urls,
                "originalFilename": original_pdf_filename
            }), 200

        except ValueError as e: # Catches API key/config issues from get_agentic_document_analysis, or other ValueErrors
            print(f"Configuration or data error for OCR: {e}")
            import traceback
            traceback.print_exc()
            if "Landing AI API not configured" in str(e):
                 return jsonify({"error": "Landing AI API not configured. LANDINGAI_API_KEY environment variable may be missing."}), 500
            return jsonify({"error": f"Data or configuration error: {str(e)}"}), 500
        except requests.exceptions.RequestException as e: # For Landing AI API errors
            print(f"Landing AI API request error: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Landing AI API Error: {str(e)}"}), 500
        except pypandoc.PandocMissing as e:
            print(f"Pandoc is not installed or not found in PATH for OCR conversion: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": "Pandoc is not installed on the server (required for OCR conversion)."}), 500
        except FileNotFoundError as e: # Should be less common now with robust path handling
            print(f"File not found error during OCR processing: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": "A required file was not found during OCR processing."}), 500
        except Exception as e:
            print(f"An unexpected error occurred during OCR conversion: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"An unexpected server error occurred during OCR: {str(e)}"}), 500
    else:
        return jsonify({"error": "Invalid file type for OCR. Please upload a PDF."}), 400
