/**
 * Watermark detection & removal utility.
 * Ignores repetitive watermark text overlays (e.g. "CONFIDENTIAL", "DRAFT", "SAMPLE", website URLs)
 * and cross-page background stamps.
 */

// Common watermark patterns (case-insensitive)
export const COMMON_WATERMARK_PATTERNS: RegExp[] = [
  /\bwatermark\b/i,
  /\bconfidential\b/i,
  /\bdraft\b/i,
  /\bsample\b/i,
  /\bcopy\b/i,
  /\bdo\s+not\s+copy\b/i,
  /\bevaluation\s+(only|copy)\b/i,
  /\bfor\s+preview\s+only\b/i,
  /\binternal\s+use\s+only\b/i,
  /\bnot\s+for\s+sale\b/i,
  /\bproof\s+only\b/i,
  /\bdo\s+not\s+duplicate\b/i,
  /\bcopyright\s+protected\b/i,
  /\bpreview\s+mode\b/i,
  /\bdemo\s+version\b/i,
];

/**
 * Filter out single line if it matches known watermark regex patterns
 */
export function isWatermarkLine(line: string, customPattern?: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Custom user pattern check
  if (customPattern && customPattern.trim()) {
    try {
      const reg = new RegExp(customPattern.trim(), 'i');
      if (reg.test(trimmed)) return true;
    } catch {
      if (trimmed.toLowerCase().includes(customPattern.toLowerCase().trim())) {
        return true;
      }
    }
  }

  // Common watermark patterns
  for (const pattern of COMMON_WATERMARK_PATTERNS) {
    if (pattern.test(trimmed)) {
      // If line is predominantly just the watermark text
      const cleanLine = trimmed.replace(/[^a-zA-Z0-9]/g, '');
      if (cleanLine.length < 50) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Filter out watermark text lines from raw text string
 */
export function filterWatermarkLines(text: string, customPattern?: string): string {
  if (!text) return '';
  const lines = text.split('\n');
  const filtered = lines.filter((line) => !isWatermarkLine(line, customPattern));
  return filtered.join('\n');
}

/**
 * Compares extracted text lines across multiple document pages.
 * If exact identical text line appears across >50% of pages (like background stamps or header watermarks),
 * it removes them while retaining standard content.
 */
export function removeCrossPageWatermarks(pagesText: string[]): string[] {
  if (pagesText.length <= 2) return pagesText;

  const lineCounts = new Map<string, number>();

  pagesText.forEach((pageText) => {
    const uniqueLinesInPage = new Set(
      pageText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 3 && l.length < 80)
    );

    uniqueLinesInPage.forEach((line) => {
      // Check if it's suspicious watermark candidate
      if (
        COMMON_WATERMARK_PATTERNS.some((p) => p.test(line)) ||
        /^[-=_*\s]{4,}$/.test(line)
      ) {
        lineCounts.set(line, (lineCounts.get(line) || 0) + 1);
      }
    });
  });

  const threshold = Math.max(2, Math.floor(pagesText.length * 0.5));
  const watermarksToRemove = new Set<string>();

  lineCounts.forEach((count, line) => {
    if (count >= threshold) {
      watermarksToRemove.add(line);
    }
  });

  if (watermarksToRemove.size === 0) return pagesText;

  return pagesText.map((pageText) => {
    return pageText
      .split('\n')
      .filter((line) => !watermarksToRemove.has(line.trim()))
      .join('\n');
  });
}
