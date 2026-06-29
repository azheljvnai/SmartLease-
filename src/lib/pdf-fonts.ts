import { PDFDocument, StandardFonts, type PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { isFirebaseStorageEnabled } from '../firebase/config';
import regularFontUrl from '../assets/fonts/NotoSans-Regular.ttf?url';
import boldFontUrl from '../assets/fonts/NotoSans-Bold.ttf?url';

export interface PdfFonts {
  font: PDFFont;
  bold: PDFFont;
  /** True when using built-in Helvetica (no embedded font files — much smaller PDFs). */
  compact: boolean;
}

/** Replace characters unsupported by WinAnsi / Helvetica PDF fonts. */
export function sanitizePdfText(text: string, compact: boolean): string {
  if (!compact) return text;
  return text
    .replace(/\u20B1/g, 'PHP ')
    .replace(/☑/g, '[X]')
    .replace(/☐/g, '[ ]')
    .replace(/•/g, '-')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');
}

/**
 * Loads PDF fonts. Uses lightweight Helvetica when Firebase Storage is off (inline Firestore
 * fallback) to keep generated PDFs under the ~1MB document limit.
 */
export async function loadPdfFonts(
  pdfDoc: PDFDocument,
  options?: { forceCompact?: boolean },
): Promise<PdfFonts> {
  const compact = options?.forceCompact ?? !isFirebaseStorageEnabled();

  if (compact) {
    return {
      font: await pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      compact: true,
    };
  }

  pdfDoc.registerFontkit(fontkit);
  const [regularBytes, boldBytes] = await Promise.all([
    fetch(regularFontUrl).then((r) => r.arrayBuffer()),
    fetch(boldFontUrl).then((r) => r.arrayBuffer()),
  ]);

  return {
    font: await pdfDoc.embedFont(regularBytes),
    bold: await pdfDoc.embedFont(boldBytes),
    compact: false,
  };
}
