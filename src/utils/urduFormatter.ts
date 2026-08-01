import { CSSProperties } from 'react';

/**
 * Urdu & RTL Font Reconstruction and Cursive Joining Repair Utility.
 * Ensures Urdu script words are extracted as written without broken letters or split ligatures.
 */

// Range for Arabic/Urdu Unicode characters including Urdu-specific extensions (Peh, Tteh, Cheh, Gaf, etc.)
export const RTL_URDU_CHAR_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

// Connective Urdu/Arabic characters that ALWAYS join to the subsequent letter in cursive script
export const CONNECTING_URDU_CHARS = new Set([
  'ب', 'پ', 'ت', 'ٹ', 'ث', 'ج', 'چ', 'ح', 'خ',
  'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف',
  'ق', 'ک', 'گ', 'ل', 'م', 'ن', 'ں', 'ہ', 'ھ',
  'ی', 'ئ', 'ے', 'ؠ', 'ئی'
]);

/**
 * Checks if a string contains Urdu or Arabic script characters
 */
export function isUrduOrRtlText(text: string): boolean {
  if (!text) return false;
  return RTL_URDU_CHAR_REGEX.test(text);
}

/**
 * Repairs broken Urdu words where OCR inserted spaces between connected cursive ligatures,
 * normalizes Unicode forms, and formats Urdu punctuation.
 */
export function repairUrduCursiveText(text: string): string {
  if (!text) return '';

  // 1. Unicode NFC Normalization (combines base letters with diacritics like zabar, zer, pesh, madd)
  let normalized = text.normalize('NFC');

  // 2. Remove directional formatting glitches & zero-width marks
  normalized = normalized.replace(/[\u200E\u200F\u202A-\u202E\u200B-\u200D]/g, '');

  // 3. Normalize Arabic character variants to standard Urdu letters
  normalized = normalized
    .replace(/ك/g, 'ک')
    .replace(/ي/g, 'ی')
    .replace(/ى/g, 'ی')
    .replace(/ة/g, 'ہ');

  const lines = normalized.split('\n');

  const repairedLines = lines.map((line) => {
    if (!RTL_URDU_CHAR_REGEX.test(line)) return line;

    let currentLine = line;

    // Join isolated single Urdu characters separated by spaces (e.g., "ا ح م د" -> "احمد")
    for (let pass = 0; pass < 4; pass++) {
      currentLine = currentLine.replace(
        /([\u0600-\u06FF\u0750-\u077F])\s+([\u0600-\u06FF\u0750-\u077F])(?=\s|[\u0600-\u06FF\u0750-\u077F]|$)/g,
        (match, c1, c2) => c1 + c2
      );
    }

    // Split words by space for word fragment merging
    let tokens = currentLine.split(/\s+/).filter(Boolean);
    let changed = true;
    let passes = 0;

    while (changed && passes < 4) {
      changed = false;
      passes++;
      const mergedTokens: string[] = [];

      for (let i = 0; i < tokens.length; i++) {
        const current = tokens[i];
        const next = tokens[i + 1];

        if (next && RTL_URDU_CHAR_REGEX.test(current) && RTL_URDU_CHAR_REGEX.test(next)) {
          const lastChar = current[current.length - 1];

          // If current ends with a connecting Urdu char or if current/next is single letter
          if (
            CONNECTING_URDU_CHARS.has(lastChar) ||
            current.length === 1 ||
            next.length === 1
          ) {
            mergedTokens.push(current + next);
            i++;
            changed = true;
            continue;
          }
        }

        mergedTokens.push(current);
      }

      tokens = mergedTokens;
    }

    let repairedLine = tokens.join(' ');

    // Format Urdu Punctuation & Digits
    repairedLine = repairedLine
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\s+([؟،۔!٪])/g, '$1')
      .replace(/([؟،۔!٪])([^\s])/g, '$1 $2');

    return repairedLine;
  });

  return repairedLines.join('\n');
}

/**
 * Returns optimal CSS properties for rendering Urdu / RTL text with Noto Sans Arabic, Noto Nastaliq Urdu or Noto Naskh Arabic font,
 * generous line height, proper text direction, and custom sizing options.
 */
export function getUrduTextStyle(
  text: string,
  options?: { fontSize?: number; fontStyle?: 'nastaliq' | 'sans_arabic' | 'mono' }
): CSSProperties {
  const isUrdu = isUrduOrRtlText(text);
  const size = options?.fontSize || (isUrdu ? 21 : 13);
  const styleMode = options?.fontStyle || 'sans_arabic';

  if (isUrdu) {
    let fontFam = "'Noto Sans Arabic', 'Noto Naskh Arabic', 'Noto Nastaliq Urdu', 'Amiri', 'Jameel Noori Nastaleeq', sans-serif";
    let lineH = '2.2';

    if (styleMode === 'nastaliq') {
      fontFam = "'Noto Nastaliq Urdu', 'Gulzar', 'Noto Sans Arabic', 'Jameel Noori Nastaleeq', serif";
      lineH = '2.7';
    } else if (styleMode === 'mono') {
      fontFam = "ui-monospace, SFMono-Regular, monospace, 'Noto Sans Arabic'";
      lineH = '1.9';
    }

    return {
      fontFamily: fontFam,
      fontSize: `${size}px`,
      lineHeight: lineH,
      direction: 'rtl',
      textAlign: 'right',
      unicodeBidi: 'plaintext',
      letterSpacing: '0.015em',
      fontWeight: styleMode === 'sans_arabic' ? 500 : 400,
    };
  }

  return {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: `${size}px`,
    lineHeight: '1.6',
    direction: 'ltr',
    textAlign: 'left',
    unicodeBidi: 'plaintext',
  };
}


