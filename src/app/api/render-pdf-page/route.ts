// src/app/api/render-pdf-page/route.ts
import { NextResponse } from 'next/server';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'; // Using legacy build for Node.js compatibility
// import { ውሃ } from 'pdfjs-dist/types/src/display/worker_options';

// pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
// For Node.js, a local worker might be better if cdnjs is not ideal or for offline capability
// If using a local worker, you might need to set:
// pdfjsLib.GlobalWorkerOptions.workerSrc = './node_modules/pdfjs-dist/build/pdf.worker.mjs'; // Adjust path as needed
// However, for serverless, a self-contained or properly pathed worker is crucial.
// For Next.js API routes, often the 'legacy' build or ensuring the worker is correctly bundled/accessible is key.
// The `pdfjs-dist/legacy/build/pdf.mjs` often includes a version of the worker or is built to not strictly need it for basic operations.
import { createCanvas, CanvasRenderingContext2D } from 'canvas'; // Import from node-canvas

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get('pdf_file');
    const pageNumStr = formData.get('page_number');

    if (!pdfFile || typeof pdfFile === 'string') {
      return NextResponse.json({ error: 'No pdf_file part in request or pdf_file is not a file' }, { status: 400 });
    }
    if (!pageNumStr || typeof pageNumStr !== 'string') {
        return NextResponse.json({ error: 'No page_number specified' }, { status: 400 });
    }

    const pageNumber = parseInt(pageNumStr, 10);
    if (isNaN(pageNumber) || pageNumber < 1) {
        return NextResponse.json({ error: 'Invalid page_number' }, { status: 400 });
    }

    console.log(`[API /api/render-pdf-page] Received PDF: ${pdfFile.name}, Page: ${pageNumber}`);

    const fileBuffer = await pdfFile.arrayBuffer();
    const typedArray = new Uint8Array(fileBuffer);

    // Dynamically set workerSrc if it's not set or to ensure it's correct for this environment
    // This path might need to be adjusted based on how Next.js bundles server-side dependencies
    // or where `pdf.worker.mjs` is located after build.
    // A common pattern is to copy it to the public folder and reference it, or use a CDN.
    // For serverless functions, this can be tricky. The legacy build sometimes bypasses this need for simple rendering.
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        // This path assumes pdf.worker.mjs is available relative to the compiled API route.
        // This might not work directly in all serverless environments without further configuration.
        // A more robust solution for serverless might involve a custom worker setup or using a different PDF library for Node.js.
        // For now, relying on the legacy build's capabilities or a CDN if it falls back.
        // Consider: pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.mjs');
         console.warn("pdfjsLib.GlobalWorkerOptions.workerSrc not set. PDF.js might try to load from a default or fail if worker is needed.");
    }


    const pdfDoc = await pdfjsLib.getDocument({ data: typedArray }).promise;

    if (pageNumber > pdfDoc.numPages) {
      return NextResponse.json({ error: `Page number ${pageNumber} is out of range (1-${pdfDoc.numPages})` }, { status: 400 });
    }

    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.5 }); // Or desired scale

    // Using node-canvas if available (typical for Node.js environments)
    // For Next.js API routes, direct canvas usage like in browser is not available.
    // We need a Node.js compatible canvas implementation.
    // `canvas` package is common. Let's assume it's installed or explore alternatives.
    // If 'canvas' is not installed, this will fail.
    // For serverless, a lighter alternative or a service might be better.
    // For this example, we'll simulate the canvas part if 'canvas' is not easily integrated.

    // --- This part requires a Node.js canvas implementation ---
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d') as unknown as CanvasRenderingContext2D; // Cast for type compatibility

    if (!context) {
        throw new Error("Failed to get 2D context from node-canvas");
    }

    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;

    const imageUrl = canvas.toDataURL('image/png');
    // --- End of 'canvas' package example ---

    await pdfDoc.destroy();

    return NextResponse.json({
      imageUrl: imageUrl,
      width: viewport.width,
      height: viewport.height
    });

  } catch (error) {
    console.error('[API /api/render-pdf-page] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to render PDF page', details: errorMessage }, { status: 500 });
  }
}

export async function OPTIONS() {
  const response = new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
  return response;
}
