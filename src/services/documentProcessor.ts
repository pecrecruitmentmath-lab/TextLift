import { DocumentItem, ExtractionOptions, FileTypeCategory } from '../types';
import { extractImageDocument } from './imageExtractor';
import { extractPdfDocument } from './pdfExtractor';
import { extractTextDocument } from './textDocExtractor';

export function detectFileTypeCategory(file: File): FileTypeCategory {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    return 'pdf';
  }

  if (
    mime.startsWith('image/') ||
    /\.(png|jpe?g|webp|bmp|gif|tiff?|heic|svg)$/.test(name)
  ) {
    return 'image';
  }

  return 'text';
}

export async function processDocument(
  doc: DocumentItem,
  options: ExtractionOptions,
  onProgress: (progress: number, message: string) => void
): Promise<{
  pages: DocumentItem['pages'];
  fullText: string;
  ocrPageCount: number;
  textLayerPageCount: number;
  totalPages: number;
  thumbnailUrl?: string;
}> {
  if (doc.typeCategory === 'pdf') {
    const result = await extractPdfDocument(doc.file, options, onProgress);
    const firstPageThumb = result.pages.find((p) => p.dataUrl)?.dataUrl;
    return {
      ...result,
      thumbnailUrl: firstPageThumb,
    };
  }

  if (doc.typeCategory === 'image') {
    const result = await extractImageDocument(doc.file, options, onProgress);
    const thumb = result.pages[0]?.dataUrl;
    return {
      ...result,
      thumbnailUrl: thumb,
    };
  }

  // Text file
  const result = await extractTextDocument(doc.file, options, onProgress);
  return {
    ...result,
  };
}
