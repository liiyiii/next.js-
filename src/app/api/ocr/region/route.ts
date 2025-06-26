// src/app/api/ocr/region/route.ts
import { NextResponse } from 'next/server';
import { createWorker, OEM } from 'tesseract.js';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image_file') as File | null;
    const regionStr = formData.get('region') as string | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image_file part in request' }, { status: 400 });
    }
    if (!regionStr) {
      return NextResponse.json({ error: 'No region data in request form' }, { status: 400 });
    }

    let region: { x: number; y: number; width: number; height: number };
    try {
      region = JSON.parse(regionStr);
      if (
        !region ||
        typeof region.x !== 'number' ||
        typeof region.y !== 'number' ||
        typeof region.width !== 'number' ||
        typeof region.height !== 'number'
      ) {
        throw new Error('Invalid region data structure');
      }
    } catch (e) {
      const errMessage = e instanceof Error ? e.message : "Unknown error parsing region JSON";
      console.error("[API /api/ocr/region] Error parsing region JSON:", regionStr, e);
      return NextResponse.json({ error: 'Invalid region JSON format or structure', details: errMessage }, { status: 400 });
    }

    console.log(`[API /api/ocr/region] Received image: ${imageFile.name}, Region:`, region);

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    const worker = await createWorker('eng', OEM.LSTM_ONLY, {
      // logger: m => console.log(m),
    });

    // Tesseract.js rectangle for recognize method
    const tesseractRectangle = {
      left: region.x,
      top: region.y,
      width: region.width,
      height: region.height,
    };

    const { data: { text } } = await worker.recognize(imageBuffer, { rectangle: tesseractRectangle });

    await worker.terminate();

    console.log(`[API /api/ocr/region] OCR processed for region. Text: "${text.substring(0, 100)}..."`);

    return NextResponse.json({ text }); // Return only the recognized text as per plan

  } catch (error) {
    console.error('[API /api/ocr/region] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process region OCR', details: errorMessage }, { status: 500 });
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
