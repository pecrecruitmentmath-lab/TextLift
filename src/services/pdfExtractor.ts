import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ExtractedPage, ExtractionOptions } from '../types';
import { recognizeImageCanvas } from './ocrService';
import { repairUrduCursiveText, isUrduOrRtlText } from '../utils/urduFormatter';
import { filterWatermarkLines, removeCrossPageWatermarks } from '../utils/watermarkFilter';

// Configure worker source matching exact installed pdfjs-dist package version
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export function cleanTextFormatting(text: string): string {
  if (!text) return '';
  return text
    // Fix hyphenated line breaks (e.g., "docu-\nment" -> "document")
    .replace(/(\w+)-\n\s*(\w+)/g, '$1$2')
    // Replace multiple spaces with single space within lines
    .replace(/[ \t]+/g, ' ')
    // Normalize triple newlines to double newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Reconstructs raw text from PDF text items by sorting them by Y (descending)
 * and X (ascending) coordinates. Ensures ZERO skipped lines or scrambled rows.
 */
function extractStructuredTextFromPdfItems(
  items: any[],
  ignoreWatermarks: boolean = true,
  customWatermarkPattern?: string
): string {
  if (!items || items.length === 0) return '';

  const validItems = items.filter(
    (item: any) => item && typeof item.str === 'string' && item.str.trim().length > 0
  );
  if (validItems.length === 0) return '';

  const parsed = validItems.map((item: any) => {
    const transform = item.transform || [1, 0, 0, 1, 0, 0];
    const x = transform[4] || 0;
    const y = transform[5] || 0;
    const height = Math.abs(transform[3] || item.height || 10);
    return {
      str: item.str,
      x,
      y,
      height,
    };
  });

  // Group items into horizontal lines based on Y coordinate tolerance
  const lines: { y: number; items: typeof parsed }[] = [];

  parsed.forEach((item) => {
    const lineFound = lines.find(
      (l) => Math.abs(l.y - item.y) <= Math.max(3.5, item.height * 0.45)
    );
    if (lineFound) {
      lineFound.items.push(item);
    } else {
      lines.push({ y: item.y, items: [item] });
    }
  });

  // Sort lines top to bottom (in PDF space, larger Y is higher up on page)
  lines.sort((a, b) => b.y - a.y);

  // For each line, sort items left to right (X ascending) and build line text
  const lineStrings = lines
    .map((line) => {
      line.items.sort((a, b) => a.x - b.x);
      let lineText = '';
      let lastX = -1;

      line.items.forEach((item) => {
        if (lastX >= 0 && item.x - lastX > 3) {
          lineText += ' ';
        }
        lineText += item.str;
        lastX = item.x + item.str.length * Math.max(3, item.height * 0.4);
      });

      return lineText.trim();
    })
    .filter(Boolean);

  let rawText = lineStrings.join('\n');

  if (ignoreWatermarks) {
    rawText = filterWatermarkLines(rawText, customWatermarkPattern);
  }

  return rawText;
}

export async function extractPdfDocument(
  file: File,
  options: ExtractionOptions,
  onProgress: (progress: number, message: string) => void
): Promise<{
  pages: ExtractedPage[];
  fullText: string;
  ocrPageCount: number;
  textLayerPageCount: number;
  totalPages: number;
}> {
  onProgress(0.05, 'Reading PDF document structure...');

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdfDoc.numPages;

  const pages: ExtractedPage[] = new Array(numPages);
  let ocrPageCount = 0;
  let textLayerPageCount = 0;

  // Process pages with concurrent buffering (chunk size 2-3 for max throughput)
  const concurrency = Math.min(3, Math.max(1, options.concurrencyLimit || 2));

  for (let i = 0; i < numPages; i += concurrency) {
    const batchPageNums: number[] = [];
    for (let j = 0; j < concurrency && i + j < numPages; j++) {
      batchPageNums.push(i + j + 1);
    }

    const currentProgress = 0.05 + (i / numPages) * 0.9;
    onProgress(
      currentProgress,
      `Processing pages ${batchPageNums.join(', ')} of ${numPages} (high-speed buffer)...`
    );

    await Promise.all(
      batchPageNums.map(async (pageNum) => {
        const page = await pdfDoc.getPage(pageNum);

        // 1. Structured Text Extraction (Zero Skipped Lines)
        const textContent = await page.getTextContent();
        let rawLayerText = extractStructuredTextFromPdfItems(
          textContent.items,
          options.ignoreWatermarks !== false,
          options.customWatermarkPattern
        );

        const cleanLayerLength = rawLayerText.replace(/\s+/g, '').length;

        // Decide if OCR is needed
        const shouldRunOcr =
          options.mode === 'always'
            ? true
            : options.mode === 'never'
            ? false
            : cleanLayerLength < (options.minTextThreshold || 25);

        let pageText = rawLayerText;
        let pageSource: 'text_layer' | 'ocr' = 'text_layer';
        let confidence: number | undefined = undefined;
        let dataUrl: string | undefined = undefined;

        // Render high-DPI canvas for side-by-side view & potential OCR
        const scale = options.scaleFactor || 2.2;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport } as any).promise;
          try {
            dataUrl =
              canvas.toDataURL('image/webp', 0.8) || canvas.toDataURL('image/jpeg', 0.8);
          } catch {
            // Fallback
          }
        }

        if (shouldRunOcr && options.mode !== 'never') {
          pageSource = 'ocr';
          ocrPageCount++;

          try {
            const ocrResult = await recognizeImageCanvas(
              canvas,
              options.languages,
              options.preprocessImage !== false,
              options.ignoreWatermarks !== false,
              options.customWatermarkPattern,
              (pct, msg) => {
                const subPct = currentProgress + (pct / numPages) * 0.9;
                onProgress(subPct, `Page ${pageNum}: ${msg}`);
              }
            );

            pageText = ocrResult.text;
            confidence = ocrResult.confidence;
          } catch (ocrErr: any) {
            console.error(`OCR failed for page ${pageNum}:`, ocrErr);
            pageText =
              rawLayerText ||
              `[OCR processing error on page ${pageNum}: ${ocrErr?.message || 'Failed'}]`;
          }
        } else {
          textLayerPageCount++;
        }

        // Urdu & RTL Cursive Joining Fix
        if (options.languages.includes('urd') || isUrduOrRtlText(pageText)) {
          pageText = repairUrduCursiveText(pageText);
        }

        if (options.autoFormat) {
          pageText = cleanTextFormatting(pageText);
        }

        const words = pageText.trim() ? pageText.trim().split(/\s+/).length : 0;
        const chars = pageText.length;

        pages[pageNum - 1] = {
          pageNumber: pageNum,
          text: pageText,
          source: pageSource,
          confidence,
          dataUrl,
          charCount: chars,
          wordCount: words,
        };
      })
    );
  }

  onProgress(0.96, 'Filtering cross-page watermarks & assembling output...');

  // Remove repetitive background watermark stamps across pages
  let finalPageTexts = pages.map((p) => p.text);
  if (options.ignoreWatermarks !== false && numPages >= 2) {
    finalPageTexts = removeCrossPageWatermarks(finalPageTexts);
    finalPageTexts.forEach((cleanedText, idx) => {
      pages[idx].text = cleanedText;
      pages[idx].charCount = cleanedText.length;
      pages[idx].wordCount = cleanedText.trim() ? cleanedText.trim().split(/\s+/).length : 0;
    });
  }

  const fullText = pages
    .map((p) => `--- Page ${p.pageNumber} (${p.source === 'ocr' ? 'OCR' : 'Text Layer'}) ---\n${p.text}`)
    .join('\n\n');

  onProgress(1.0, 'Extraction complete');

  return {
    pages,
    fullText,
    ocrPageCount,
    textLayerPageCount,
    totalPages: numPages,
  };
}
