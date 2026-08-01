import { createWorker, Worker, PSM } from 'tesseract.js';
import { preprocessCanvasForOCR } from '../utils/imagePreprocessing';
import { repairUrduCursiveText, isUrduOrRtlText } from '../utils/urduFormatter';
import { filterWatermarkLines } from '../utils/watermarkFilter';

let workerInstance: Worker | null = null;
let currentLangsKey: string | null = null;

export async function getOcrWorker(
  languages: string[],
  onProgress?: (progress: number, status: string) => void
): Promise<Worker> {
  let selected = languages.length > 0 ? [...languages] : ['eng'];

  // Auto-supplement Urdu with Arabic script models if selected alone for optimal dictionary matching
  if (selected.includes('urd') && !selected.includes('ara')) {
    selected.push('ara');
  }

  const langKey = selected.join('+');

  if (workerInstance && currentLangsKey === langKey) {
    return workerInstance;
  }

  if (workerInstance) {
    try {
      await workerInstance.terminate();
    } catch {
      // Ignore termination error
    }
    workerInstance = null;
  }

  onProgress?.(0.05, `Downloading OCR language model (${langKey})...`);

  workerInstance = await createWorker(selected, 1, {
    logger: (m) => {
      if (m.status && typeof m.progress === 'number') {
        const pct = Math.round(m.progress * 100);
        onProgress?.(m.progress, `OCR Engine: ${m.status} (${pct}%)`);
      }
    },
  });

  // Optimize Tesseract parameters for cursive joining & page segmentation
  if (selected.includes('urd') || selected.includes('ara')) {
    try {
      await workerInstance.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
        preserve_interword_spaces: '1',
      });
    } catch {
      // Ignore parameter setting errors
    }
  }

  currentLangsKey = langKey;
  return workerInstance;
}

export async function recognizeImageCanvas(
  canvas: HTMLCanvasElement,
  languages: string[],
  shouldPreprocess: boolean = true,
  ignoreWatermarks: boolean = true,
  customWatermarkPattern?: string,
  onProgress?: (progress: number, status: string) => void
): Promise<{ text: string; confidence: number }> {
  const processedCanvas = shouldPreprocess
    ? preprocessCanvasForOCR(canvas, { ignoreWatermarks })
    : canvas;

  const imageSource = processedCanvas.toDataURL('image/png');
  const worker = await getOcrWorker(languages, onProgress);

  const result = await worker.recognize(imageSource);
  let rawText = (result.data.text || '').trim();
  const confidence = Math.round(result.data.confidence || 0);

  // Watermark removal
  if (ignoreWatermarks) {
    rawText = filterWatermarkLines(rawText, customWatermarkPattern);
  }

  // Urdu & RTL Cursive Reconstruction
  if (languages.includes('urd') || isUrduOrRtlText(rawText)) {
    rawText = repairUrduCursiveText(rawText);
  }

  return { text: rawText, confidence };
}
