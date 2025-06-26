// src/app/api/ocr/fullpage/route.ts
import { NextResponse } from 'next/server';
import { createWorker, OEM } from 'tesseract.js';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image_file') as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image_file part in request' }, { status: 400 });
    }

    console.log(`[API /api/ocr/fullpage] Received image: ${imageFile.name}, size: ${imageFile.size}`);

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    const worker = await createWorker('eng', OEM.LSTM_ONLY, { // Specify English, and LSTM_ONLY for potentially better accuracy
      // logger: m => console.log(m), // Optional: For detailed Tesseract.js logs
      // cacheMethod: 'none', // Optional: disable caching if issues arise in serverless
    });

    // Tesseract.js's recognize method expects a path, Buffer, or ImageData.
    // We pass the Buffer directly.
    const { data } = await worker.recognize(imageBuffer, {}, {pdf: false}); // pdf: false for image output

    // The 'data' object from Tesseract.js contains detailed information including blocks, paragraphs, lines, words, and symbols.
    // We need to transform this into the `text_blocks` structure expected by the frontend.
    // A simple approach is to treat each 'block' from Tesseract as a 'text_block'.
    // Tesseract's block.bbox gives { x0, y0, x1, y1 }. We need x, y, width, height.
    const text_blocks = data.blocks.map((block, index) => ({
      id: `ocr-block-${Date.now()}-${index}`,
      text: block.text, // Tiptap expects HTML, so we might need to wrap this in <p> or process newlines
      x: block.bbox.x0,
      y: block.bbox.y0,
      width: block.bbox.x1 - block.bbox.x0,
      height: block.bbox.y1 - block.bbox.y0,
      // Default style properties, frontend can override
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#000000',
      isEditing: false,
    }));

    await worker.terminate();

    console.log(`[API /api/ocr/fullpage] OCR processed, found ${text_blocks.length} text blocks.`);

    return NextResponse.json({ text_blocks });

  } catch (error) {
    console.error('[API /api/ocr/fullpage] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process full page OCR', details: errorMessage }, { status: 500 });
  }
}

export async function OPTIONS() {
  // Handle preflight OPTIONS requests
  const response = new Response(null, {
    status: 204, // No Content
    headers: {
      'Access-Control-Allow-Origin': '*', // Or your specific frontend origin
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Adjust as needed
    },
  });
  return response;
}
