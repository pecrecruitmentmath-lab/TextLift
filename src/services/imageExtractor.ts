import { ExtractedPage, ExtractionOptions } from '../types';
import { recognizeImageCanvas } from './ocrService';
import { extractTextWithGeminiAI } from './geminiOcrService';
import { cleanTextFormatting } from './pdfExtractor';

export async function extractImageDocument(
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
  onProgress(0.05, 'Loading image into memory...');

  const imageUrl = URL.createObjectURL(file);
  const img = new Image();

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image file.'));
    img.src = imageUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(imageUrl);
    throw new Error('Canvas context non-functional.');
  }

  ctx.drawImage(img, 0, 0);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  URL.revokeObjectURL(imageUrl);

  let text = '';
  let confidence = 0;
  let pageEngine: 'local' | 'gemini' = options.engine || 'local';

  if (options.engine === 'gemini') {
    onProgress(0.2, 'Extracting text using Gemini AI Vision...');
    try {
      const base64Png = canvas.toDataURL('image/png');
      const geminiRes = await extractTextWithGeminiAI(
        base64Png,
        'image/png',
        options.languages.join(', ')
      );
      text = geminiRes.text;
      confidence = 99;
      pageEngine = 'gemini';
    } catch (geminiErr: any) {
      console.warn('Gemini AI image extraction failed, falling back to local OCR:', geminiErr);
      onProgress(0.3, 'Falling back to Local OCR Engine...');
      const ocrResult = await recognizeImageCanvas(
        canvas,
        options.languages,
        options.preprocessImage !== false,
        options.ignoreWatermarks !== false,
        options.customWatermarkPattern,
        (pct, msg) => {
          onProgress(0.3 + pct * 0.65, msg);
        }
      );
      text = ocrResult.text;
      confidence = ocrResult.confidence;
      pageEngine = 'local';
    }
  } else {
    onProgress(0.15, 'Running Local OCR recognition...');
    const ocrResult = await recognizeImageCanvas(
      canvas,
      options.languages,
      options.preprocessImage !== false,
      options.ignoreWatermarks !== false,
      options.customWatermarkPattern,
      (pct, msg) => {
        onProgress(0.15 + pct * 0.8, msg);
      }
    );
    text = ocrResult.text;
    confidence = ocrResult.confidence;
    pageEngine = 'local';
  }

  if (options.autoFormat) {
    text = cleanTextFormatting(text);
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const page: ExtractedPage = {
    pageNumber: 1,
    text,
    source: 'ocr',
    engine: pageEngine,
    confidence,
    dataUrl,
    charCount,
    wordCount,
  };

  onProgress(1.0, 'Image extraction complete');

  return {
    pages: [page],
    fullText: text,
    ocrPageCount: 1,
    textLayerPageCount: 0,
    totalPages: 1,
  };
}
