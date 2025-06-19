from flask import Flask, request, send_file, render_template, jsonify, make_response
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
STATIC_CONVERSIONS_DIR = Path('converted_files').resolve()
os.makedirs(STATIC_CONVERSIONS_DIR, exist_ok=True)

# 设置文件权限
for root, dirs, files in os.walk(STATIC_CONVERSIONS_DIR):
    for d in dirs:
        os.chmod(os.path.join(root, d), 0o755)
    for f in files:
        os.chmod(os.path.join(root, f), 0o644)

# --- Helper Functions ---
def init_landing_ai_header():
    try:
        config_file_path = Path("config.json")
        if not config_file_path.is_file():
            print("Warning: config.json not found. OCR will likely fail.")
            return None
        with open(config_file_path, "r") as config_file:
            config = json.load(config_file)
        api_key = config.get("api_key")
        if not api_key or api_key == "YOUR_LANDINGAI_API_KEY_PLACEHOLDER":
            print("Warning: Landing AI API key not found or is a placeholder in config.json.")
            return None
        return { "Authorization": "Basic " + api_key }
    except json.JSONDecodeError:
        print("Warning: config.json is not valid JSON. OCR will likely fail.")
        return None
    except Exception as e:
        print(f"Error loading config.json: {e}")
        return None

def get_soffice_executable() -> str:
    """
    Determines the soffice (LibreOffice) executable path.
    Tries to load from config.json, then defaults to 'soffice' (from PATH).
    """
    config_file_path = Path("config.json")
    default_soffice_cmd = 'soffice'
    
    if not config_file_path.is_file():
        print("Info: config.json not found. Using default 'soffice' from PATH.")
        return default_soffice_cmd

    try:
        with open(config_file_path, "r") as config_file:
            config = json.load(config_file)
        
        soffice_path_str = config.get("soffice_path")

        if soffice_path_str and soffice_path_str.strip():
            # Ensure os is available, usually imported at the top of the file
            soffice_path = Path(soffice_path_str.strip())
            if soffice_path.is_file() and os.access(str(soffice_path), os.X_OK):
                abs_path = str(soffice_path.resolve())
                print(f"Using soffice executable from config: {abs_path}")
                return abs_path
            else:
                print(f"Warning: 'soffice_path' in config.json ('{soffice_path_str}') is not a valid executable file. Using default 'soffice' from PATH.")
                return default_soffice_cmd
        else:
            print("Info: 'soffice_path' not found or empty in config.json. Using default 'soffice' from PATH.")
            return default_soffice_cmd
            
    except json.JSONDecodeError:
        print("Warning: config.json is not valid JSON. Using default 'soffice' from PATH.")
        return default_soffice_cmd
    except Exception as e:
        print(f"Error loading soffice_path from config.json: {e}. Using default 'soffice' from PATH.")
        return default_soffice_cmd

def get_agentic_document_analysis(input_pdf_path: Path, output_json_path: Path):
    headers = init_landing_ai_header()
    if headers is None:
        raise ValueError("Landing AI API not configured or config.json issue. Cannot perform OCR.")

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
    soffice_executable = get_soffice_executable() # Get soffice path
    try:
        print(f"Starting DOCX to PDF conversion for: {docx_path} using {soffice_executable}")
        # 1. Convert DOCX to PDF using LibreOffice
        # Create a temporary directory for LibreOffice to output the PDF
        pdf_temp_dir_path_str = tempfile.mkdtemp(prefix="lo_pdf_")
        pdf_temp_dir = Path(pdf_temp_dir_path_str)
        
        # LibreOffice command
        # Using --headless --invisible for good measure
        # --convert-to pdf:writer_pdf_Export is more specific
        # --outdir specifies where the PDF goes
        cmd = [
            soffice_executable, '--headless', '--invisible', '--nologo', '--norestore',
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
            image_filename = os.path.basename(image_path_obj.filename)
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
    try:
        # 添加日志记录
        print(f"请求文件: conversion_id={conversion_id}, filename={filename}")
        
        # Secure the inputs
        safe_conversion_id = secure_filename(conversion_id)
        safe_filename = secure_filename(filename)

        # Basic check to ensure no path manipulation characters slipped through
        if conversion_id != safe_conversion_id or filename != safe_filename:
            print(f"路径安全检查失败: {conversion_id} != {safe_conversion_id} or {filename} != {safe_filename}")
            return jsonify({"error": "Invalid path components"}), 400

        # 使用绝对路径
        file_path = os.path.abspath(os.path.join(STATIC_CONVERSIONS_DIR, safe_conversion_id, safe_filename))
        print(f"完整文件路径: {file_path}")
        
        # 检查文件是否存在
        if not os.path.exists(file_path):
            print(f"文件不存在: {file_path}")
            return jsonify({"error": "File not found"}), 404

        if not os.path.isfile(file_path):
            print(f"路径不是文件: {file_path}")
            return jsonify({"error": "Not a file"}), 400

        print(f"文件存在，准备发送: {file_path}")
        
        # 设置正确的MIME类型
        mime_type = None
        if filename.endswith('.docx'):
            mime_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        elif filename.endswith('.pdf'):
            mime_type = 'application/pdf'
        elif filename.endswith('.png'):
            mime_type = 'image/png'
            
        response = send_file(
            file_path,
            mimetype=mime_type,
            as_attachment=True,
            download_name=filename
        )
        
        # 添加必要的响应头
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        
        return response
    except Exception as e:
        print(f"文件服务错误: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/files/<conversion_id>/<filename>', methods=['OPTIONS'])
def handle_options(conversion_id, filename):
    response = make_response()
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

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
            file.save(str(pdf_path))
            print(f"Digital PDF saved to: {pdf_path}")

            docx_filename = Path(original_pdf_filename).stem + '_digital.docx'
            docx_path = request_specific_dir / docx_filename

            # Perform conversion
            cv = Pdf2DocxConverter(str(pdf_path))
            cv.convert(str(docx_path))
            cv.close()
            print(f"Digital PDF converted to DOCX: {docx_path}")

            # 确保文件存在
            if not docx_path.exists():
                raise Exception(f"转换后的文件不存在: {docx_path}")

            # Generate previews
            preview_image_urls = generate_docx_previews(docx_path, request_specific_dir, conversion_id)
            
            # 构建下载URL
            download_url = f"/files/{conversion_id}/{docx_filename}"
            print(f"下载URL: {download_url}")
            print(f"文件路径: {docx_path}")
            
            return jsonify({
                "downloadUrl": download_url,
                "previewImageUrls": preview_image_urls,
                "originalFilename": original_pdf_filename,
                "message": "Conversion successful"
            })
        except Exception as e:
            print(f"转换过程中出错: {str(e)}")
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "Invalid file type. Please upload a PDF file."}), 400

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
            })

        except ValueError as e: # Catches API key/config issues from get_agentic_document_analysis, or other ValueErrors
            print(f"Configuration or data error for OCR: {e}")
            import traceback
            traceback.print_exc()
            if "Landing AI API not configured" in str(e):
                 return jsonify({"error": "Landing AI API not configured or config.json issue"}), 500
            return jsonify({"error": f"Data or configuration error: {str(e)}"}), 500
        except requests.exceptions.RequestException as e: # For Landing AI API errors
            print(f"Landing AI API request error: {e}")
            import traceback
            traceback.print_exc()
            error_message = "无法连接到Landing AI服务。请检查网络连接或稍后重试。"
            return jsonify({"error": error_message}), 500
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

if __name__ == '__main__':
    # Create a dummy config.json if it doesn't exist
    config_file_path = Path('config.json')
    if not config_file_path.exists():
        default_config = {
            "api_key": "YOUR_LANDINGAI_API_KEY_PLACEHOLDER",
            "soffice_path": "YOUR_SOFFICE_EXECUTABLE_PATH_OR_LEAVE_EMPTY_TO_USE_PATH"
        }
        with open(config_file_path, 'w') as cf:
            json.dump(default_config, cf, indent=4) # Added indent for readability
        print("Created dummy config.json. Please update 'api_key' and optionally 'soffice_path'.")

    # Perform initial checks (API key and Pandoc)
    print("Performing initial checks...")
    init_landing_ai_header() # Will print warnings if not configured
        
    try:
        pandoc_version = pypandoc.get_pandoc_version()
        print(f"Pandoc version: {pandoc_version} found.")
    except OSError:
        print("WARNING: Pandoc not found. OCR PDF conversion will fail. Please install Pandoc and ensure it is in your system's PATH.")

    print(f"Serving converted files from: {STATIC_CONVERSIONS_DIR}")
    print("Starting combined PDF conversion server...")
    app.run(host='0.0.0.0', port=5000, debug=True)
