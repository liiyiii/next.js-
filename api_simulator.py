from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import random

app = Flask(__name__)
CORS(app) # Allow all origins for simplicity in development

# --- Helper to generate somewhat realistic mock OCR blocks ---
def rgb_to_hex(r, g, b):
    return f'#{r:02x}{g:02x}{b:02x}'

def create_mock_block(block_id, text, translated_text, x, y, w, h, font_size, font_family, weight="normal", style="normal", fg_rgb=(0,0,0), bg_rgb=(255,255,255)):
    return {
        "id": block_id,
        "text": text,
        "translatedText": translated_text,
        "blockBox": [x, y, w, h],
        "fontInfo": {"size": font_size, "family": font_family, "weight": weight, "style": style},
        "colorInfo": {"fgColor": rgb_to_hex(*fg_rgb), "bgColor": rgb_to_hex(*bg_rgb)},
        "position": {"x": x, "y": y}
    }

# --- Predefined Sample OCR/Translation Data ---
SAMPLE_SCENARIOS = {
    "default": {
        "blockList": [
            create_mock_block("default_b1", "Welcome to Image Translator", "欢迎使用图片翻译器", 50, 50, 400, 40, 28, "Arial", "bold", bg_rgb=(220,220,255)),
            create_mock_block("default_b2", "Upload an image to get started.", "上传图片即可开始。", 100, 100, 300, 30, 20, "Verdana", fg_rgb=(30,30,30), bg_rgb=(230,250,230)),
        ]
    },
    "sample_image_1.jpg": { # Example: if a file named 'sample_image_1.jpg' is 'uploaded'
        "blockList": [
            create_mock_block("s1_b1", "Scenario 1: Title Text", "场景1：标题文本", 30, 40, 350, 50, 32, "Georgia", "bold", fg_rgb=(10,10,10), bg_rgb=(255,240,240)),
            create_mock_block("s1_b2", "This is the first paragraph with some details.", "这是包含一些细节的第一段。", 50, 100, 450, 70, 18, "Arial", style="italic", fg_rgb=(20,20,20), bg_rgb=(240,240,255)),
            create_mock_block("s1_b3", "Another line of text here.", "这里是另一行文字。", 50, 180, 400, 30, 18, "Arial", fg_rgb=(20,20,20), bg_rgb=(240,240,255)),
        ]
    },
    "sample_image_2.png": {
         "blockList": [
            create_mock_block("s2_b1", "Complex Layout Example", "复杂布局示例", 20, 20, 300, 30, 24, "Times New Roman", "bold", fg_rgb=(255,255,255), bg_rgb=(50,50,150)),
            create_mock_block("s2_b2", "圖文混合", "Mixed text and graphics (simulated)", 200, 70, 150, 50, 18, "SimSun", fg_rgb=(10,10,10), bg_rgb=(255,255,220)), # Simulating CJK font
            create_mock_block("s2_b3", "Footer note", "页脚注释", 50, 250, 400, 25, 14, "Courier New", fg_rgb=(100,100,100), bg_rgb=(245,245,245)),
        ]
    }
}

@app.route('/api/ocr_full_page', methods=['POST'])
def ocr_full_page_handler():
    if 'image_file' not in request.files:
        return jsonify({"error": "No image_file part in the request"}), 400

    file = request.files['image_file']
    filename = file.filename or ""

    print(f"API Simulator: Received request for /api/ocr_full_page, filename: {filename}")

    if filename and filename in SAMPLE_SCENARIOS:
        scenario_data = SAMPLE_SCENARIOS[filename]
        # Add some randomness to positions for dynamic feel if desired
        # for block in scenario_data["blockList"]:
        #     block["position"]["x"] += random.randint(-5, 5)
        #     block["position"]["y"] += random.randint(-5, 5)
        return jsonify(scenario_data)
    else:
        return jsonify(SAMPLE_SCENARIOS["default"])

@app.route('/api/ocr_region', methods=['POST'])
def ocr_region_handler():
    if 'image_file' not in request.files:
        return jsonify({"error": "No image_file part in the request"}), 400
    if 'region' not in request.form:
        return jsonify({"error": "No region data in the request form"}), 400

    file = request.files['image_file']
    filename = file.filename or ""
    try:
        region_str = request.form['region']
        region = json.loads(region_str) # region is {x, y, width, height}
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON in region data"}), 400

    print(f"API Simulator: Received request for /api/ocr_region, filename: {filename}, region: {region}")

    # Simulate OCR for the region - create a dynamic block based on region
    # For a more advanced mock, you could check if the region overlaps with predefined blocks
    # from a full scenario and return parts of those.
    # Here, we just create a new generic block within the region.

    region_x = region.get("x", 0)
    region_y = region.get("y", 0)
    region_w = region.get("width", 100)
    region_h = region.get("height", 50)

    mock_regional_block = create_mock_block(
        f"region_{random.randint(1000,9999)}",
        f"Text from region",
        f"区域内文本 (模拟)",
        region_x + 5, # Position within the image, slightly offset from region corner
        region_y + 5,
        max(10, region_w - 10), # Ensure width is positive
        max(10, region_h - 10), # Ensure height is positive
        14, "Arial", "normal", "normal", (10,10,10), (230,230,230)
    )

    return jsonify({"blockList": [mock_regional_block]})

if __name__ == '__main__':
    # Note: For development, Flask's built-in server is fine.
    # For any kind of production, use a proper WSGI server like Gunicorn or Waitress.
    print("Starting Python Flask API Simulator on http://localhost:5000")
    print("Endpoints:")
    print("  POST /api/ocr_full_page (expects 'image_file')")
    print("  POST /api/ocr_region (expects 'image_file' and 'region' form data)")
    print("Mock scenarios available for filenames:", list(SAMPLE_SCENARIOS.keys()))
    app.run(debug=True, port=5000)
