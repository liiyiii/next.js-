// src/app/api/export/edited-word/route.ts
import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, ImageRun, TextBox, HorizontalPositionAlign, VerticalPositionAlign, TextWrappingType, TextWrappingSide } from 'docx';
import htmlToDocx from 'html-to-docx-buffer'; // Using this for HTML content conversion
import { parse } from 'node-html-parser'; // For potentially stripping HTML if html-to-docx fails or for plain text extraction

// Helper to convert pixels to EMU (English Metric Units) for DOCX positioning/sizing if needed, though docx package often uses DXA (twips)
// 1 inch = 914400 EMU; 1 inch = 72 points; 1 point = 20 twips (DXA)
// Assuming 96 DPI for pixel conversion initially. 1 inch = 96 pixels.
// So, 1 pixel = 914400 / 96 = 9525 EMU.  1 pixel = (72*20) / 96 = 15 DXA (twips)
const PIXELS_TO_DXA = 15;

function convertPtToHalfPoints(pt: number): number {
  return Math.round(pt * 2);
}

// Basic HTML to TextRun array converter (very simplified)
// For more complex HTML, html-to-docx-buffer is preferred
function htmlToTextRuns(html: string, defaultFontSize: number, defaultFontFamily: string, defaultColor: string): (TextRun | Paragraph)[] {
    const runs: TextRun[] = [];
    const root = parse(html);
    // This is a very naive parser. A proper solution would recursively traverse the tree.
    // html-to-docx-buffer should handle this better. This is a fallback or for simple text.
    root.childNodes.forEach(node => {
        if (node.nodeType === 3) { // TextNode
            runs.push(new TextRun({
                text: node.text,
                size: convertPtToHalfPoints(defaultFontSize),
                font: defaultFontFamily,
                color: defaultColor.replace("#","")
            }));
        } else if (node.nodeType === 1) { // ElementNode
            const el = node as unknown as import('node-html-parser').HTMLElement;
            let text = el.text;
            let isBold = false;
            let isItalic = false;
            let isUnderline = false;

            if (el.tagName === 'STRONG' || el.tagName === 'B') isBold = true;
            if (el.tagName === 'EM' || el.tagName === 'I') isItalic = true;
            if (el.tagName === 'U') isUnderline = true;

            // Very basic style parsing
            const style = el.getAttribute('style');
            let color = defaultColor.replace("#","");
            let size = convertPtToHalfPoints(defaultFontSize);
            let font = defaultFontFamily;

            if (style) {
                const colorMatch = style.match(/color:\s*([^;]+)/);
                if (colorMatch) color = colorMatch[1].replace("#","");
                // Add more style parsing if needed (font-size, font-family)
            }

            // If the node itself has text, or its children do.
            // This simplified version only takes direct text of the element.
            if (text) {
                 runs.push(new TextRun({ text, bold: isBold, italic: isItalic, underline: isUnderline, size, font, color }));
            }
            // Recursively parse children if a more complex structure is needed (not done in this simplified version)
        }
    });
    if (runs.length === 0 && html) { // Fallback for unparsed HTML
        runs.push(new TextRun({ text: html, size: convertPtToHalfPoints(defaultFontSize), font: defaultFontFamily, color: defaultColor.replace("#","") }));
    }
    // Wrap in a paragraph for TextBox content
    return [new Paragraph({ children: runs.length > 0 ? runs : [new TextRun(" ")] })]; // TextBox needs at least one paragraph
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { textBlocks, imageUrl, imageDimensions } = body;

    if (!textBlocks || !Array.isArray(textBlocks)) {
      return NextResponse.json({ error: 'Invalid textBlocks data' }, { status: 400 });
    }
    if (!imageUrl || typeof imageUrl !== 'string' || !imageDimensions) {
        return NextResponse.json({ error: 'Missing or invalid image data' }, { status: 400 });
    }

    console.log('[API /api/export/edited-word] Received data for DOCX generation. Number of text blocks:', textBlocks.length);

    const sections = [];
    const children = [];

    // 1. Add background image (attempt)
    // The `docx` package doesn't directly support page background images easily.
    // A common workaround is to put a large image in the header, set to be behind text.
    // This is complex. For now, we'll insert it as a regular image if provided.
    // Or, more simply, we can create a large floating image.
    if (imageUrl.startsWith('data:image/')) {
        const base64Data = imageUrl.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        children.push(
            new Paragraph({ // Paragraph to hold the floating image
                children: [
                    new ImageRun({
                        data: imageBuffer,
                        transformation: {
                            width: imageDimensions.width * PIXELS_TO_DXA, // Convert pixels to DXA
                            height: imageDimensions.height * PIXELS_TO_DXA,
                        },
                        floating: { // Make image float
                            horizontalPosition: { align: HorizontalPositionAlign.PAGE },
                            verticalPosition: { align: VerticalPositionAlign.PAGE },
                            wrap: { type: TextWrappingType.NONE }, // No text wrapping, image is a layer
                            behindDocument: true, // Image behind text
                        },
                    }),
                ],
            })
        );
    }


    // 2. Create TextBox for each textBlock
    for (const block of textBlocks) {
        let paragraphChildren;
        try {
            // Attempt to convert HTML from Tiptap to DOCX structure using html-to-docx-buffer
            // This is a simplified usage. html-to-docx-buffer might return a full Document buffer.
            // We need to integrate its output (likely an array of ISectionOptions or similar)
            // or parse its generated objects if it provides lower-level access.
            // For now, let's assume we get paragraphs or use a simpler converter.
            // htmlToDocx is designed to create a full buffer, not IParagraphOptions[] directly for TextBox.
            // So, we might need to parse HTML to TextRuns manually for TextBox, or find another way.

            // Simpler approach: manually parse to TextRuns for now
            paragraphChildren = htmlToTextRuns(
                block.text || " ", // Ensure text is not empty
                block.fontSize || 16,
                block.fontFamily || 'Arial',
                block.color || '#000000'
            );

        } catch (htmlErr) {
            console.warn(`Failed to convert HTML for block ${block.id}, using plain text. Error:`, htmlErr);
            paragraphChildren = [new Paragraph({ children: [new TextRun(block.text || " ")] })];
        }

        const textBox = new TextBox({
            children: paragraphChildren,
            width: (block.width || 100) * PIXELS_TO_DXA, // Convert pixels to DXA
            height: (block.height || 50) * PIXELS_TO_DXA,
            floating: {
                horizontalPosition: {
                    offset: block.x * PIXELS_TO_DXA,
                },
                verticalPosition: {
                    offset: block.y * PIXELS_TO_DXA,
                },
                allowOverlap: true, // Allow textboxes to overlap
                wrap: { // No text wrapping around the textbox itself
                    type: TextWrappingType.NONE,
                    side: TextWrappingSide.BOTH_SIDES,
                },
            },
            // Basic border for visibility, can be removed or styled
            // outline: { style: "single", width: 1 * PIXELS_TO_DXA, color: "D3D3D3" }
        });
        children.push(new Paragraph({children: [textBox]})); // Each textbox needs to be in a paragraph apparently
    }

    const doc = new Document({
      sections: [{
        // properties: { // Page size, margins etc. can be set here if needed
        //     page: {
        //         size: { width: imageDimensions.width * PIXELS_TO_DXA, height: imageDimensions.height * PIXELS_TO_DXA },
        //         margin: { top: 0, right: 0, bottom: 0, left: 0 },
        //     },
        // },
        children: children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="edited_document.docx"`,
      },
    });

  } catch (error) {
    console.error('[API /api/export/edited-word] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to generate DOCX', details: errorMessage }, { status: 500 });
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
