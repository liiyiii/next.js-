import sys # For sys.path debugging if needed
print("Initial sys.path in app.py:", sys.path)

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
from pathlib import Path
import numpy as np
import PyMuPDF as fitz # Restored import
from PIL import Image
from paddleocr import PaddleOCR

# Assuming helper modules are in a 'helpers' subdirectory relative to backend/app.py
# Adjust these imports based on your final backend directory structure
from helpers.fileio import save_pkl, load_pkl
from helpers.pptx import write_text_block as write_pptx_text_block # Restored
from helpers.pptx import write_image as write_pptx_image # Restored
from helpers.pymupdf import get_page_pixmap as pymupdf_get_page_pixmap # Restored
from helpers.pymupdf import get_page_annots as pymupdf_get_page_annots # Restored


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
Path(UPLOAD_FOLDER).mkdir(parents=True, exist_ok=True)
Path(PROCESSED_FOLDER).mkdir(parents=True, exist_ok=True)

# Initialize PaddleOCR
# You might want to initialize this once globally, or on first request
# For simplicity, initializing here. Consider lazy loading or app context.
ocr_engine = PaddleOCR(use_angle_cls=False, lang='en') # Default to English, can be changed

""" HELPER FUNCTIONS (Adapted from your scripts) """

def extract_ocr_result_api(result):
    quads, texts, scores = [], [], []
    if result and result[0] is not None: # Check if result[0] is not None
        quads = [line[0] for line in result[0]]
        texts = [line[1][0] for line in result[0]]
        scores = [line[1][1] for line in result[0]]
    return quads, texts, scores

def _group_bfs_api(linked_list):
    def _group_bfs_node(linked_list, i, used_nodes):
        group = set()
        waitlist = [i]
        while waitlist:
            cur = waitlist.pop(0)
            if cur in used_nodes:
                continue
            used_nodes.add(cur)
            # Ensure cur is a valid index for linked_list
            if 0 <= cur < len(linked_list):
                children = linked_list[cur]
                group.update(children)
                waitlist.extend(children)
            else:
                # Handle error or log if cur is out of bounds
                print(f"Warning: Node index {cur} is out of bounds for linked_list.")

        return list(group)

    num_node = len(linked_list)
    used_nodes = set()
    groups = []
    for i in range(num_node):
        if i in used_nodes:
            continue
        node_indexes = _group_bfs_node(linked_list, i, used_nodes)
        groups.append(node_indexes)
    return groups


def _group_api(blocks, func_link=None):
    assert func_link is not None
    num_text = len(blocks)
    linked_list = [[i] for i in range(num_text)]
    for i in range(num_text):
        for j in range(i + 1, num_text):
            oa = blocks[i]
            ob = blocks[j]
            if func_link(oa, ob):
                linked_list[i].append(j)
                linked_list[j].append(i)
    return _group_bfs_api(linked_list)

def _a_b_close_enough_api(oa, ob):
    ratio_height = 0.7
    ratio_vert = 0.7
    ratio_horz = 0.8
    a, b = oa[1], ob[1]
    ha = a[3] - a[1]
    hb = b[3] - b[1]
    mh = min(ha, hb)
    if mh == 0: return False # Avoid division by zero if height is zero

    def _near_same_height(a, b):
        return abs(hb - ha) < ratio_height * mh
    def _near_vert_direction(a, b):
        return b[1] - a[3] < ratio_vert * mh
    def _overlap_horz_direction(a, b):
        r = min(a[2], b[2])
        l = max(a[0], b[0])
        return (l - r) < ratio_horz * mh
    return _near_vert_direction(a, b) and _overlap_horz_direction(a, b) and _near_same_height(a, b)

def build_new_text_from_group_blocks_api(blocks):
    def _a_b_same_line(oa, ob):
        a, b = oa[1], ob[1]
        ha = a[3] - a[1]
        hb = b[3] - b[1]
        mh = min(ha, hb)
        if mh == 0: return False # Avoid division by zero
        ay = (a[1] + a[3]) / 2
        by = (b[1] + b[3]) / 2
        return abs(by - ay) < 0.3 * mh

    def _merge_spans(idx_list, blocks_map):
        array = [blocks_map[id_] for id_ in idx_list if id_ in blocks_map]
        if not array: return "", (0,0,0,0)
        array.sort(key=lambda x: x[1][0])
        text = " ".join([item[0] for item in array])
        bbox = (array[0][1][0], array[0][1][1], array[-1][1][2], array[-1][1][3])
        return text, bbox

    def _merge_lines(block_list):
        if not block_list: return "", (0,0,0,0)
        block_list.sort(key=lambda x: x[1][1])
        text = "\n".join([item[0] for item in block_list])
        bbox = (block_list[0][1][0], block_list[0][1][1], block_list[-1][1][2], block_list[-1][1][3])
        return text, bbox

    if not blocks: return ""

    # Create a dictionary for quick block lookup by index
    blocks_map = {i: block for i, block in enumerate(blocks)}

    groups_indices = _group_api(blocks, func_link=_a_b_same_line)

    lines = []
    for group_idx_list in groups_indices:
        # Filter out indices that might be out of bounds if _group_api had issues
        valid_group_idx_list = [idx for idx in group_idx_list if idx in blocks_map]
        if valid_group_idx_list:
            merged_span_text, merged_span_bbox = _merge_spans(valid_group_idx_list, blocks_map)
            if merged_span_text: # Ensure we don't add empty lines
                 lines.append((merged_span_text, merged_span_bbox))

    if not lines: return ""
    text, _ = _merge_lines(lines)
    return text

def merge_text_block_api(texts, bboxes):
    if not texts or not bboxes:
        return [], []
    blocks = list(zip(texts, bboxes))
    blocks.sort(key=lambda x: x[1][1])

    # Create a dictionary for quick block lookup by index for build_new_text_from_group_blocks_api
    # This is important because build_new_text_from_group_blocks_api expects original indices
    original_blocks_map = {i: block for i, block in enumerate(blocks)}

    groups_indices = _group_api(blocks, func_link=_a_b_close_enough_api)

    merged_texts = []
    merged_bboxes = []

    for group_idx_list in groups_indices:
        if not group_idx_list:
            continue

        current_group_blocks = [blocks[idx] for idx in group_idx_list if 0 <= idx < len(blocks)]

        if not current_group_blocks:
            continue

        if len(current_group_blocks) == 1:
            merged_texts.append(current_group_blocks[0][0])
            merged_bboxes.append(current_group_blocks[0][1])
        else:
            # For build_new_text_from_group_blocks_api, we need to pass the blocks
            # that correspond to the *original* indices contained in group_idx_list.
            # However, the internal grouping of build_new_text_from_group_blocks_api
            # will re-index based on the 'current_group_blocks' it receives.

            # We need to pass the actual block data for this specific group
            new_text = build_new_text_from_group_blocks_api(current_group_blocks)

            group_bboxes = [block[1] for block in current_group_blocks]
            x1s, y1s, x2s, y2s = zip(*group_bboxes)
            new_box = (min(x1s), min(y1s), max(x2s), max(y2s))

            merged_texts.append(new_text)
            merged_bboxes.append(new_box)

    return merged_texts, merged_bboxes


def ocr_image_processing(image_path_str, lang='en'):
    """Combined OCR and layout processing logic."""
    global ocr_engine # Use the global ocr_engine
    if ocr_engine.lang != lang: # Reinitialize if language changed
        print(f"Switching OCR language from {ocr_engine.lang} to {lang}")
        ocr_engine = PaddleOCR(use_angle_cls=False, lang=lang)

    ocr_result = ocr_engine.ocr(image_path_str, cls=False)
    quads, texts, scores = extract_ocr_result_api(ocr_result)

    if not texts: # Handle case with no OCR results
        return [], 0, []

    bboxes = [(quad[0][0], quad[0][1], quad[2][0], quad[2][1]) for quad in quads]

    ocr_line_heights = [bb[3] - bb[1] for bb in bboxes if bb[3] > bb[1]] # Ensure height is positive
    if not ocr_line_heights: # Handle if all heights are zero or negative
        median_heights = 15 # Default median height
    else:
        median_heights = np.median(ocr_line_heights)
        if median_heights <= 0: # Ensure median height is positive
            median_heights = 15 # Default if median is not positive

    font_size = int(median_heights / 0.83)  # 1/1.2, ensure font_size is at least 1
    font_size = max(1, font_size)


    merged_texts, merged_bboxes = merge_text_block_api(texts, bboxes)

    # Prepare results for API
    processed_blocks = []
    for i, (text, bbox) in enumerate(zip(merged_texts, merged_bboxes)):
        processed_blocks.append({
            "id": str(uuid.uuid4()),
            "bbox": [round(coord, 2) for coord in bbox], # x1, y1, x2, y2
            "text": text,
            # "original_text": text, # Store original OCR text
            # "translated_text": "" # Placeholder for translation
        })
    return processed_blocks, font_size, scores # also return scores for potential filtering

""" API ROUTES """

@app.route('/api/ocr-and-layout', methods=['POST'])
def ocr_and_layout():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No image file selected"}), 400

    try:
        filename = str(uuid.uuid4()) + "_" + file.filename
        image_path = Path(UPLOAD_FOLDER) / filename
        file.save(image_path)

        # Determine language from request or default to 'en'
        lang = request.form.get('lang', 'en')
        if lang in ['zh', 'ch', 'chinese']:
            lang = 'ch'
        elif lang not in ocr_engine.lang_list: # Check if lang is supported by PaddleOCR
             # Fallback to 'en' or handle error if language not supported
            print(f"Warning: Language '{lang}' not directly supported or recognized. Defaulting to 'en'.")
            lang = 'en'


        processed_blocks, font_size, scores = ocr_image_processing(str(image_path), lang=lang)

        # For now, we return the path to the uploaded image.
        # In a real app, you might want to serve it via a URL or embed as base64 if small.
        # Making it relative to a potential 'static' or 'uploads' serving directory.
        # This example assumes UPLOAD_FOLDER is accessible by the client, which might not be ideal.
        # A better approach is to return a URL that Flask serves.
        image_url = f'/uploads/{filename}' # This requires UPLOAD_FOLDER to be served statically

        return jsonify({
            "message": "OCR and layout analysis successful",
            "image_url": image_url, # URL to the original uploaded image
            "processed_image_required": False, # No separate processed image for now
            "font_size": font_size,
            "blocks": processed_blocks,
            "scores": scores # Optionally return scores
        }), 200

    except Exception as e:
        app.logger.error(f"Error in OCR and layout: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        # Optional: Clean up uploaded file if not needed later
        # if 'image_path' in locals() and image_path.exists():
        #     os.remove(image_path)
        pass


@app.route('/api/translate', methods=['POST'])
def translate_text():
    data = request.get_json()
    if not data or 'texts' not in data:
        return jsonify({"error": "No texts provided for translation"}), 400

    texts_to_translate = data['texts']
    # lang_to = data.get('target_lang', 'en') # Example: get target language

    # Placeholder for actual translation logic
    # Replace this with your chosen translation API/library call
    translated_texts = []
    for text in texts_to_translate:
        translated_texts.append(f"[Translated] {text}") # Simple placeholder

    return jsonify({"translated_texts": translated_texts}), 200


@app.route('/api/export', methods=['POST'])
def export_handler():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided for export"}), 400

    export_format = data.get('format', 'pdf').lower() # pdf, jpg, json
    # image_url = data.get('image_url') # URL/path of the base image
    # blocks = data.get('blocks') # List of text blocks with content, bbox, styles

    # This is a placeholder.
    # Actual implementation will require more sophisticated handling based on your prompt:
    # - For PDF: Use fitz to draw image and then text blocks (with styles) onto a PDF page.
    # - For JPG: Use PIL/Pillow to draw text (with styles) onto the base image.
    # - For JSON: Simply structure the 'blocks' data and return.

    # For MVP, let's simulate a file download for PDF
    if export_format == 'pdf':
        try:
            # Simulate PDF creation - in reality, use Fitz or another library
            # to reconstruct the page with the image and translated text blocks.
            # For now, just create a dummy PDF.
            output_filename = f"export_{uuid.uuid4()}.pdf"
            output_path = Path(PROCESSED_FOLDER) / output_filename

            doc = fitz.open() # Create a new PDF
            page = doc.new_page()
            page.insert_text((50, 72), "Generated PDF with translated content (Placeholder)", fontsize=12)

            # If you have image_url and blocks, you would load the image
            # and draw each block onto the page here.
            # Example:
            # if image_url and blocks:
            #   try:
            #     # Assuming image_url is a path accessible by the server
            #     base_image_path = Path(UPLOAD_FOLDER) / Path(image_url).name
            #     if base_image_path.exists():
            #       page.insert_image(page.rect, filename=str(base_image_path))
            #     for block in blocks:
            #       text = block.get('translated_text') or block.get('text', '')
            #       bbox = block.get('bbox') # x1,y1,x2,y2
            #       # Basic text insertion, styling would be more complex
            #       if text and bbox:
            #           rect = fitz.Rect(bbox)
            #           # This is very basic, you'd need to handle font, size, color from block.style
            #           page.insert_textbox(rect, text, fontsize=10, fontname="helv")
            #   except Exception as e_render:
            #       print(f"Error rendering PDF content: {e_render}")


            doc.save(output_path)
            doc.close()

            return send_file(output_path, as_attachment=True, download_name=output_filename)
        except Exception as e:
            app.logger.error(f"Error exporting PDF: {e}")
            return jsonify({"error": f"Failed to export PDF: {str(e)}"}), 500

    elif export_format == 'jpg':
        # Placeholder: Use PIL to draw text on image and return
        return jsonify({"message": "JPG export placeholder", "format": "jpg"}), 200
    elif export_format == 'json':
        # Placeholder: Return the blocks data
        return jsonify(data.get('blocks', [])), 200 # Return the blocks data itself
    else:
        return jsonify({"error": "Unsupported export format"}), 400

# This allows serving files from UPLOAD_FOLDER, e.g., for <img src="/uploads/...">
# In production, use a proper web server (Nginx, Apache) to serve static files.
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_file(Path(UPLOAD_FOLDER) / filename)


if __name__ == '__main__':
    # Make sure the helper directory is in Python's path if running directly
    # This might be needed if helpers are not installed as a package
    import sys
    # Assuming this script is in 'backend/' and helpers are in 'backend/helpers/'
    # Adjust if your structure is different
    sys.path.append(str(Path(__file__).parent.resolve()))

    app.run(debug=True, port=5001) # Running on a different port than default Next.js
