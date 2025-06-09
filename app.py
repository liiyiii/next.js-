from flask import Flask, request, send_file, render_template, jsonify
import os
import io
import tempfile
import shutil # For cleaning up directories
from pathlib import Path

# For Digital PDF Conversion (from app1.py)
from pdf2docx import Converter as Pdf2DocxConverter

# For Image PDF (OCR) Conversion (from previous app.py)
import requests
import json
import pypandoc

app = Flask(__name__)

# --- Configuration for Digital PDF Conversion ---
# Using temporary directories per request, so no shared UPLOAD_FOLDER needed here.

# --- Configuration for Image PDF (OCR) Conversion ---
OUTPUT_FOLDER_BASE_IMAGE_OCR = 'output_image_ocr_temp' # Base for temporary request-specific output folders
Path(OUTPUT_FOLDER_BASE_IMAGE_OCR).mkdir(parents=True, exist_ok=True)

# --- Helper Functions for Image PDF (OCR) Conversion ---
def init_landing_ai_header():
    try:
        with open("config.json", "r") as config_file:
            config = json.load(config_file)
        api_key = config.get("api_key")
        if not api_key:
            raise ValueError("API key not found in config.json for Landing AI.")
        return { "Authorization": "Basic " + api_key }
    except FileNotFoundError:
        raise FileNotFoundError("config.json not found. Please create it with your Landing AI API key.")
    except json.JSONDecodeError:
        raise ValueError("config.json is not valid JSON.")

def get_agentic_document_analysis(input_pdf_path: Path, output_json_path: Path):
    url = "https://api.va.landing.ai/v1/tools/agentic-document-analysis"
    try:
        headers = init_landing_ai_header()
        with open(input_pdf_path, "rb") as f:
            files = {"pdf": f}
            response = requests.post(url, files=files, headers=headers)
        response.raise_for_status()
        with open(output_json_path, "w") as outfile:
            json.dump(response.json(), outfile, indent=2)
        print(f"Agentic document analysis saved to {output_json_path}")
    except requests.exceptions.RequestException as e:
        print(f"Error calling Landing AI API: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Landing AI API Response: {e.response.text}")
        raise
    except Exception as e:
        print(f"An error occurred in get_agentic_document_analysis: {e}")
        raise

def agentic_md_extraction(json_file: Path, md_file: Path):
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            content = json.load(f)
        if "data" not in content or "chunks" not in content["data"]:
            print(f"Warning: 'data' or 'chunks' not found in JSON from {json_file}.")
            with open(md_file, 'w', encoding='utf-8') as f_md:
                f_md.write("")
            return
        chunks = content["data"]["chunks"]
        markdown_text_only = [chunk["text"] for chunk in chunks if chunk.get("chunk_type") != "figure" and "text" in chunk]
        with open(md_file, 'w', encoding='utf-8') as f_md:
            f_md.write("\n\n".join(markdown_text_only))
        print(f"Markdown extracted to {md_file}")
    except Exception as e:
        print(f"An error occurred in agentic_md_extraction: {e}")
        raise

# --- Routes ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/convert_digital', methods=['POST'])
def convert_digital_pdf():
    if 'pdf_file' not in request.files:
        return jsonify({"error": "No PDF file provided"}), 400
    file = request.files['pdf_file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and file.filename.endswith('.pdf'):
        request_temp_dir = None
        try:
            request_temp_dir = Path(tempfile.mkdtemp(prefix="digital_"))
            original_pdf_filename = file.filename
            pdf_path = request_temp_dir / original_pdf_filename
            docx_filename = original_pdf_filename.replace('.pdf', '.docx')
            docx_path = request_temp_dir / docx_filename
            
            file.save(pdf_path)
            print(f"Digital PDF saved to: {pdf_path}")

            cv = Pdf2DocxConverter(str(pdf_path))
            cv.convert(str(docx_path))
            cv.close()
            print(f"Digital PDF converted to DOCX: {docx_path}")

            word_buffer = io.BytesIO()
            with open(docx_path, 'rb') as f:
                word_buffer.write(f.read())
            word_buffer.seek(0)
            
            return send_file(
                word_buffer,
                as_attachment=True,
                download_name=docx_filename,
                mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
        except Exception as e:
            print(f"Error during digital PDF conversion: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Digital conversion failed: {str(e)}"}), 500
        finally:
            if request_temp_dir and request_temp_dir.exists():
                try:
                    shutil.rmtree(request_temp_dir)
                    print(f"Cleaned up temp directory for digital conversion: {request_temp_dir}")
                except Exception as e_clean:
                    print(f"Error cleaning up temp directory {request_temp_dir}: {e_clean}")
    else:
        return jsonify({"error": "Invalid file type for digital conversion. Please upload a PDF."}), 400

@app.route('/convert_image_ocr', methods=['POST'])
def convert_image_ocr_pdf():
    if 'pdf_file' not in request.files:
        return jsonify({"error": "No PDF file provided for OCR conversion"}), 400
    file = request.files['pdf_file']
    if file.filename == '':
        return jsonify({"error": "No selected file for OCR conversion"}), 400

    if file and file.filename.endswith('.pdf'):
        request_temp_dir_ocr = None
        try:
            request_temp_dir_ocr = Path(tempfile.mkdtemp(dir=OUTPUT_FOLDER_BASE_IMAGE_OCR, prefix="ocr_"))
            original_pdf_filename = file.filename
            saved_pdf_path = request_temp_dir_ocr / original_pdf_filename
            file.save(saved_pdf_path)
            print(f"Image PDF saved to: {saved_pdf_path}")

            analysis_json_path = request_temp_dir_ocr / "analysis_output.json"
            extracted_md_path = request_temp_dir_ocr / "extracted.md"
            docx_filename = original_pdf_filename.replace('.pdf', '_ocr.docx')
            converted_docx_path = request_temp_dir_ocr / docx_filename

            print("Starting Landing AI Document Analysis for OCR...")
            get_agentic_document_analysis(saved_pdf_path, analysis_json_path)
            
            print("Starting Markdown Extraction for OCR...")
            agentic_md_extraction(analysis_json_path, extracted_md_path)

            print("Starting Pandoc Conversion (MD to DOCX) for OCR...")
            pypandoc.convert_file(str(extracted_md_path), 'docx', outputfile=str(converted_docx_path))
            print(f"Image PDF (OCR) converted to DOCX: {converted_docx_path}")

            if converted_docx_path.exists():
                word_buffer = io.BytesIO()
                with open(converted_docx_path, 'rb') as f:
                    word_buffer.write(f.read())
                word_buffer.seek(0)
                
                return send_file(
                    word_buffer,
                    as_attachment=True,
                    download_name=docx_filename,
                    mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                )
            else:
                return jsonify({"error": "OCR Conversion to DOCX failed internally."}), 500

        except FileNotFoundError as e: # Specifically for config.json
            print(f"Configuration error for OCR: {e}")
            return jsonify({"error": str(e)}), 500
        except ValueError as e: # For API key issues or JSON issues in OCR
            print(f"Configuration or data error for OCR: {e}")
            return jsonify({"error": str(e)}), 500
        except requests.exceptions.RequestException as e: # For Landing AI API errors
            print(f"Landing AI API request error: {e}")
            return jsonify({"error": f"Landing AI API Error: {e}"}), 500
        except pypandoc.PandocMissing:
            print("Pandoc is not installed or not found in PATH for OCR conversion.")
            return jsonify({"error": "Pandoc is not installed on the server (required for OCR conversion)."}), 500
        except Exception as e:
            print(f"An unexpected error occurred during OCR conversion: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"An unexpected server error occurred during OCR: {str(e)}"}), 500
        finally:
            if request_temp_dir_ocr and request_temp_dir_ocr.exists():
                try:
                    shutil.rmtree(request_temp_dir_ocr)
                    print(f"Cleaned up temp directory for OCR: {request_temp_dir_ocr}")
                except Exception as e_clean:
                    print(f"Error cleaning up OCR temp directory {request_temp_dir_ocr}: {e_clean}")
    else:
        return jsonify({"error": "Invalid file type for OCR. Please upload a PDF."}), 400

if __name__ == '__main__':
    # Check for Landing AI API key config
    try:
        init_landing_ai_header() 
        print("Landing AI API key loaded successfully from config.json.")
    except Exception as e:
        print(f"WARNING: Could not initialize Landing AI API headers: {e}. OCR conversion will fail.")
        
    # Check for Pandoc
    try:
        pandoc_version = pypandoc.get_pandoc_version()
        print(f"Pandoc version: {pandoc_version} found.")
    except OSError:
        print("WARNING: Pandoc not found. OCR PDF conversion will fail. Please install Pandoc and ensure it is in your system's PATH.")

    print("Starting combined PDF conversion server...")
    app.run(host='0.0.0.0', port=5000, debug=True) # Running on port 5000