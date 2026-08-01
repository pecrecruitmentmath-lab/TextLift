/**
 * Helper to generate synthetic sample files for quick 1-click testing
 */

export function createSamplePdfFile(): File {
  // Simple PDF content built on standard sample text for testing
  const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 120 >> stream
BT
/F1 16 Tf
50 700 Td
(TextLift PDF & OCR Test Document) Tj
0 -30 Td
(This digital text layer was extracted directly without external APIs.) Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000414 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
485
%%EOF`;

  const blob = new Blob([content], { type: 'application/pdf' });
  return new File([blob], 'Sample_Document.pdf', { type: 'application/pdf' });
}

export function createSampleTextFile(): File {
  const content = `# TextLift Document Extractor Sample

Welcome to TextLift!

Key Features:
- 100% In-Browser & Serverless Processing
- Accurate OCR for scanned PDF pages and images (PNG, JPG, WEBP, etc.)
- Multi-language support (English, Urdu, Arabic, Spanish, French, German, Chinese, etc.)
- Side-by-side original page comparison view
- Export to TXT, Markdown, and JSON formats`;

  const blob = new Blob([content], { type: 'text/plain' });
  return new File([blob], 'Sample_Notes.txt', { type: 'text/plain' });
}

export function createSampleImageCanvasFile(): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Draw simulated scanned document image with text
      ctx.fillStyle = '#FDFBF7';
      ctx.fillRect(0, 0, 600, 300);

      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('TEXTLIFT OCR SAMPLE IMAGE', 40, 60);

      ctx.font = '16px serif';
      ctx.fillText('This text is rendered onto a visual image canvas.', 40, 110);
      ctx.fillText('Tesseract.js OCR will recognize and extract these words', 40, 140);
      ctx.fillText('directly inside your browser tab without any API keys!', 40, 170);

      ctx.fillStyle = '#059669';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('Status: On-Device OCR Active | Accuracy High', 40, 230);
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'Scanned_Receipt_Sample.png', { type: 'image/png' });
        resolve(file);
      } else {
        resolve(createSampleTextFile());
      }
    }, 'image/png');
  });
}
