export type ExtractionMode = 'auto' | 'always' | 'never';

export type FileTypeCategory = 'pdf' | 'image' | 'text';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  source: 'text_layer' | 'ocr' | 'text_file';
  confidence?: number;
  dataUrl?: string; // Rendered image thumbnail for side-by-side view
  charCount: number;
  wordCount: number;
}

export interface DocumentItem {
  id: string;
  file: File;
  name: string;
  size: number;
  typeCategory: FileTypeCategory;
  mimeType: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
  progressMessage: string;
  pages: ExtractedPage[];
  fullText: string;
  error?: string;
  extractedAt?: number;
  ocrPageCount: number;
  textLayerPageCount: number;
  totalPages: number;
  thumbnailUrl?: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  popular?: boolean;
}

export interface ExtractionOptions {
  mode: ExtractionMode;
  languages: string[]; // Tesseract language codes e.g. ['eng', 'urd', 'ara']
  preprocessImage: boolean;
  scaleFactor: number; // e.g. 2.0 or 2.5 for PDF rendering DPI
  autoFormat: boolean; // Clean hyphenation & whitespace
  minTextThreshold: number; // Min chars to consider page as having text layer
  ignoreWatermarks: boolean; // Filter watermark text overlays and faint stamps
  customWatermarkPattern?: string; // Optional custom string/regex to remove
  concurrencyLimit?: number; // Batch page rendering concurrency buffer
}
