# coding=utf8
import os
import io

import PyMuPDF as fitz # Restored
from PyMuPDF.utils import sRGB_to_pdf # Restored
import numpy as np
import cv2
from PIL import Image

"""merge and split"""
def merge_from_images_2(image_list, pdf_file):
    """
    :param image_list: List[str|PIL.Image], image file list,
        the order will be used for page order.
        each file should be full path.
    """
    doc_out = fitz.open()
    for item in image_list: # Changed 'file' to 'item' to avoid confusion with 'file' module
        if isinstance(item, str): # if it's a filepath
            img_doc = fitz.open(item)
        elif isinstance(item, Image.Image): # if it's a PIL Image
            # Convert PIL Image to bytes
            img_byte_arr = io.BytesIO()
            item.save(img_byte_arr, format='PNG') # Save PIL image to bytes buffer
            img_byte_arr = img_byte_arr.getvalue()
            img_doc = fitz.open("png", img_byte_arr) # Open from bytes
        else:
            raise ValueError(f"Unsupported item type in image_list: {type(item)}")

        rect = img_doc[0].rect
        pdfbytes = img_doc.convert_to_pdf()
        img_doc.close()

        page_pdf = fitz.open("pdf", pdfbytes)
        page = doc_out.new_page(width=rect.width, height=rect.height)
        page.show_pdf_page(rect, page_pdf, 0)
        page_pdf.close() # Close the stream PDF
    doc_out.save(pdf_file)
    doc_out.close()


def merge_from_images(image_list, pdf_file):
    doc = fitz.open()
    try:
        for img_item in image_list:
            if isinstance(img_item, str): # File path
                with fitz.open(img_item) as img_doc:
                    pdfbytes = img_doc.convert_to_pdf()
            elif isinstance(img_item, Image.Image): # PIL Image
                img_byte_arr = io.BytesIO()
                img_format = img_item.format if img_item.format else 'PNG' # চেষ্টা করুন ফর্ম্যাট পেতে, না হলে PNG ব্যবহার করুন
                img_item.save(img_byte_arr, format=img_format.upper())
                pdfbytes = fitz.open(stream=img_byte_arr.getvalue(), filetype=img_format.lower()).convert_to_pdf()
            else:
                raise ValueError(f"Unsupported item type: {type(img_item)}")

            with fitz.open("pdf", pdfbytes) as page_pdf:
                doc.insert_pdf(page_pdf)
        doc.save(pdf_file)
    finally:
        doc.close()


def get_page_pixmap(page, scale=1.0, annots=False): # Added annots parameter
    mat = fitz.Matrix(scale, scale)
    return page.get_pixmap(matrix=mat, annots=annots) # Use annots parameter


def pdf_to_pixmaps(pdf_file, scale=1.0):
    doc = fitz.open(pdf_file)
    pixmaps = [get_page_pixmap(page, scale=scale) for page in doc]
    doc.close()
    return pixmaps

def pdf_to_images(fname, target_dir, basename='input', ext='jpg', scale=1.0):
    os.makedirs(target_dir, exist_ok=True) # Ensure target_dir exists
    pixmaps = pdf_to_pixmaps(fname, scale=scale)
    image_filelist = []
    for i, pix in enumerate(pixmaps):
        image_filename = os.path.join(target_dir, f'{basename}-{i}.{ext}')
        image_filelist.append(image_filename)
        pix.save(image_filename) # pix.save directly handles file type by extension
    return image_filelist


def pdf_to_images_pil(pdf_file, scale=1.0):
    doc = fitz.open(pdf_file)
    mat = fitz.Matrix(scale, scale)
    images = []
    for i in range(doc.page_count):
        page = doc.load_page(i) # Explicitly load page
        pix = page.get_pixmap(matrix=mat, annots=False)
        # Ensure correct mode based on pixmap alpha
        mode = "RGB" if pix.alpha == 0 else "RGBA"
        img = Image.frombytes(mode, [pix.width, pix.height], pix.samples)
        images.append(img)
    doc.close()
    return images

def split_to_page_pdfs(input_file, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    pdf = fitz.open(input_file)
    for i in range(pdf.page_count): # Use pdf.page_count
        output_file = os.path.join(output_dir, f"page_{i + 1}.pdf")
        output_pdf = fitz.open()
        output_pdf.insert_pdf(pdf, from_page=i, to_page=i)
        output_pdf.save(output_file)
        output_pdf.close()
    pdf.close()

"""image format conversion"""
def pixmap_to_cvimage(pix):
    # samples attribute directly gives image data in BGR or BGRA format for OpenCV
    # Reshape based on whether alpha channel exists
    height, width = pix.height, pix.width
    if pix.alpha: # If there's an alpha channel, it's BGRA
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape((height, width, 4))
    else: # Else, it's BGR
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape((height, width, 3))
    return img


def pixmap_to_pil(pix):
    # Using pix.pil_save method is safer and handles different pixmap types
    # This method was not in the original, adding a robust way
    img_bytes = pix.tobytes(output="png") # Convert to PNG bytes first
    img = Image.open(io.BytesIO(img_bytes))
    return img


def pixmap_to_pil2(pix, format="png"):
    # pil_tobytes is a more direct way if available in your PyMuPDF version
    # However, .tobytes(output=format.lower()) is generally more standard
    img_bytes = pix.tobytes(output=format.lower())
    img = Image.open(io.BytesIO(img_bytes))
    return img

"""drawing"""
def draw_bbox_list(page, bbox_list, color_tuple=(1,0,0), fill_opacity=0.15): # color as tuple
    # color = fitz.utils.getColor("red") # Using tuple is more direct
    for bb in bbox_list:
        rect = fitz.Rect(bb) # *bb unpacks if bb is (x1,y1,x2,y2)
        page.draw_rect(rect, color=color_tuple, fill=color_tuple, fill_opacity=fill_opacity)

"""annotations"""
def get_page_annots(page):
    annots_data = [] # Renamed to avoid conflict with page.annots()
    for annot in page.annots(): # Iterate through generator
        data = {
            'ref_xref': annot.xref, # Store xref for potential later use if needed for deletion by xref
            'text': annot.info.get('content', '').strip(), # Safer get
            'bbox': list(annot.rect), # Convert Rect to list [x0, y0, x1, y2]
            'type': annot.type[1] if annot.type[0] == fitz.PDF_ANNOT_SQUARE else "Unknown", # More specific type
            'points': annot.vertices # This is a list of (x,y) tuples
        }
        annots_data.append(data)
    return annots_data


def clear_annotations(doc):
    for page in doc:
        # page.delete_annot(annot) needs the annot object itself.
        # Iterating and deleting can be tricky if the iterator is affected.
        # A safer way is to get all annots first, then delete.
        annots_to_delete = list(page.annots()) # Get all annot objects
        for annot in annots_to_delete:
            page.delete_annot(annot)
    return doc # Or perhaps no return is needed if doc is modified in-place


def annot_bbox_list(page, bbox_list, text_content='text', color_tuple=(1,0,0)): # color as tuple
    # color = fitz.utils.getColor("red")
    for bbox in bbox_list:
        rect = fitz.Rect(bbox) # *bbox if bbox is (x1,y1,x2,y2)
        annot = page.add_rect_annot(rect)
        annot.set_border(width=1.0)
        annot.set_colors(stroke=color_tuple)
        annot.set_info(content=text_content)
        annot.update() # Important to apply changes to annot


"""reconstruction"""
def draw_page_shapes(page, shapes_data): # Renamed from shapes to shapes_data
    for path_data in shapes_data: # Renamed from path to path_data
        # Create a new shape for each path_data to ensure properties don't leak
        shape_obj = page.new_shape() # Renamed from shape to shape_obj

        for item in path_data["items"]:
            op = item[0]
            if op == "l":
                shape_obj.draw_line(fitz.Point(item[1]), fitz.Point(item[2]))
            elif op == "re":
                shape_obj.draw_rect(fitz.Rect(item[1]))
            elif op == "qu":
                shape_obj.draw_quad(fitz.Quad(item[1]))
            elif op == "c":
                shape_obj.draw_bezier(fitz.Point(item[1]), fitz.Point(item[2]), fitz.Point(item[3]), fitz.Point(item[4]))
            else:
                raise ValueError(f"Unhandled drawing item: {item}")

        shape_obj.finish(
            fill=path_data.get("fill"),
            color=path_data.get("color"),
            dashes=path_data.get("dashes"),
            even_odd=path_data.get("even_odd", True),
            closePath=path_data.get("closePath", True), # Default to True for closed shapes
            lineJoin=path_data.get("lineJoin", 0), # Default lineJoin
            lineCap=max(path_data.get("lineCap", [0,0])), # Default lineCap
            width=path_data.get("width", 1.0), # Default width
            stroke_opacity=path_data.get("stroke_opacity", 1),
            fill_opacity=path_data.get("fill_opacity", 1),
        )
        shape_obj.commit()


def draw_page_images(page, image_blocks_data): # Renamed from texts to image_blocks_data
    for block in image_blocks_data: # Assuming image_blocks_data is a list of blocks
        if block.get('type') == 1 and 'bbox' in block and 'image' in block:  # image block
            page.insert_image(
                fitz.Rect(block['bbox']), # Ensure bbox is a Rect
                stream=block['image']
            )

def write_page_texts(page, text_data_dict): # Renamed from texts to text_data_dict
    """
    :param text_data_dict: dict get from page.get_text('dict')
    """
    if 'blocks' not in text_data_dict: return

    for block in text_data_dict['blocks']:
        if block.get('type') == 0:  # text block
            for line in block.get('lines', []):
                for span in line.get('spans', []):
                    # Ensure color is a tuple of 3 floats (0-1) or ints (0-255)
                    # PyMuPDF expects color in sRGB_to_pdf format if it's not already a PDF color tuple
                    color_val = span.get('color')
                    if isinstance(color_val, int): # If color is packed int
                        # Convert from integer packed color (e.g., 0xRRGGBB or fitz internal)
                        # This requires knowing how the integer is packed.
                        # Assuming it's already in a format that sRGB_to_pdf can handle if it's int.
                        # Or, if it's from get_text('dict'), it's usually (r,g,b) floats after sRGB_to_pdf.
                        # For safety, if it's an int, let's assume it needs to be converted to (r,g,b) tuple.
                        # This part might need adjustment based on how 'color' is stored.
                        # If it's already (r,g,b) tuple from 0-1, sRGB_to_pdf is not needed.
                        # If it's (r,g,b) tuple from 0-255, then sRGB_to_pdf is needed.
                         pass # Assuming it's already in a good format or sRGB_to_pdf handles it

                    # If color is int, it might be hex or similar, PyMuPDF expects tuple (r,g,b)
                    # For simplicity, assuming span['color'] is already a suitable tuple (e.g. from get_text('rawdict'))
                    # or an integer that sRGB_to_pdf can process.
                    # If span['color'] comes from page.get_text("dict"), it's an integer.
                    # We need to convert it to an RGB tuple.

                    rgb_color = fitz.utils.getColorRGB(span['color']) # Get (r,g,b) from integer

                    page.insert_text(fitz.Point(span['origin']), # Ensure origin is a Point
                                     span['text'],
                                     fontsize=span.get('size', 11), # Default fontsize
                                     fontname=span.get('font', 'helv'), # Default font
                                     color=rgb_color) # Use the converted RGB color
                                     # rotate=span.get('flags', 0) # Example, if rotation is needed

"""font"""
def copy_fonts(doc_src, page_src, page_tgt):
    font_list = page_src.get_fonts(full=True) # Get full font info
    font_names_copied = set()
    for font_info in font_list:
        xref = font_info[0]
        # name = font_info[3] # This is the PostScript name often with subset prefix
        # font_buffer = doc_src.extract_font(xref)[4] # (name, ext, type, content)

        extracted_font = doc_src.extract_font(xref)
        if not extracted_font or not extracted_font[4]: # Check if font_buffer is not None or empty
            continue # Skip if font buffer is empty (not embedded or error)

        font_buffer = extracted_font[4]

        # Use a unique font name for insertion to avoid conflicts,
        # or try to derive a base name if needed.
        # For simplicity, using the name as is, but be cautious about subset prefixes.
        # A more robust way might involve checking if font is already in page_tgt.
        # font_name_to_insert = name # Or derive a base name
        font_name_to_insert = extracted_font[1] # Usually the font name in PDF
        if '+' in font_name_to_insert and len(font_name_to_insert.split('+')[-1]) > 0 :
             font_name_to_insert = font_name_to_insert.split('+')[-1]


        try:
            page_tgt.insert_font(fontname=font_name_to_insert, fontbuffer=font_buffer)
            font_names_copied.add(font_name_to_insert)
        except Exception as e:
            print(f"Could not insert font {font_name_to_insert}: {e}")
            # Fallback: try with a generic name if specific one fails, though this is risky
            # try:
            #     generic_name = f"EmbeddedFont{xref}"
            #     page_tgt.insert_font(fontname=generic_name, fontbuffer=font_buffer)
            #     font_names_copied.add(generic_name)
            # except Exception as e2:
            #     print(f"Could not insert font {generic_name} (fallback): {e2}")


    return list(font_names_copied) # Return as list
