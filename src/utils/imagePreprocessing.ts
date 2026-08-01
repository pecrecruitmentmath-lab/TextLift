/**
 * Preprocess canvas/image before feeding to Tesseract OCR for maximum accuracy
 */
export function preprocessCanvasForOCR(
  sourceCanvas: HTMLCanvasElement,
  options: {
    contrast?: number;
    grayscale?: boolean;
    threshold?: boolean;
    ignoreWatermarks?: boolean;
  } = {}
): HTMLCanvasElement {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    return sourceCanvas;
  }
  const { contrast = 1.35, grayscale = true, threshold = false, ignoreWatermarks = true } = options;

  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imgData.data;

  // Apply Grayscale, Watermark Filtering & Contrast Enhancement
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];

    if (grayscale) {
      // Standard luminance formula
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = g = b = gray;
    }

    if (ignoreWatermarks) {
      // Faint light-gray background watermarks typically have luminance between 175 and 235
      // Push high-luminance faint pixels to pure white (255) to wipe background watermarks
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum > 175) {
        r = g = b = 255;
      }
    }

    if (contrast !== 1.0) {
      // Contrast adjustment
      r = Math.min(255, Math.max(0, (r - 128) * contrast + 128));
      g = Math.min(255, Math.max(0, (g - 128) * contrast + 128));
      b = Math.min(255, Math.max(0, (b - 128) * contrast + 128));
    }

    if (threshold) {
      // Binarization thresholding
      const avg = (r + g + b) / 3;
      const val = avg > 150 ? 255 : 0;
      r = g = b = val;
    }

    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}
