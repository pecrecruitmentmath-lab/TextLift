import { ExtractedPage, ExtractionOptions } from '../types';
import { cleanTextFormatting } from './pdfExtractor';

export async function extractTextDocument(
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
  onProgress(0.1, 'Reading text document content...');

  const textContent = await file.text();
  let processedText = textContent;

  if (options.autoFormat) {
    processedText = cleanTextFormatting(processedText);
  }

  const wordCount = processedText.trim() ? processedText.trim().split(/\s+/).length : 0;
  const charCount = processedText.length;

  const page: ExtractedPage = {
    pageNumber: 1,
    text: processedText,
    source: 'text_file',
    charCount,
    wordCount,
  };

  onProgress(1.0, 'Text document reading complete');

  return {
    pages: [page],
    fullText: processedText,
    ocrPageCount: 0,
    textLayerPageCount: 1,
    totalPages: 1,
  };
}
