import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs/promises";
import path from "path";

export type PdfElementKind = "text" | "x";

export interface PdfTextBox {
  pageIndex: number;
  x: number;
  y: number;
  fontSize: number;
  bold: boolean;
  text: string;
  dir: "ltr" | "rtl";
  kind: PdfElementKind;
  color: string;
}

function hexToRgb(hex: string) {
  const normalized = hex.startsWith("#") ? hex.slice(1) : hex;
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return rgb(0, 0, 0);
  }
  return rgb(r, g, b);
}

async function loadFontBytes(): Promise<{ regular: Uint8Array; bold: Uint8Array }> {
  const fontsDir = path.join(process.cwd(), "public", "fonts", "pdf");
  const [regular, bold] = await Promise.all([
    fs.readFile(path.join(fontsDir, "Heebo-Regular.ttf")),
    fs.readFile(path.join(fontsDir, "Heebo-Bold.ttf")),
  ]);
  return {
    regular: new Uint8Array(regular),
    bold: new Uint8Array(bold),
  };
}

export async function applyTextBoxesToPdf(
  pdfBytes: Uint8Array,
  textBoxes: PdfTextBox[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = await loadFontBytes();
  const regularFont = await pdfDoc.embedFont(fontBytes.regular, { subset: true });
  const boldFont = await pdfDoc.embedFont(fontBytes.bold, { subset: true });

  const pages = pdfDoc.getPages();

  for (const box of textBoxes) {
    if (box.pageIndex < 0 || box.pageIndex >= pages.length) continue;

    const page = pages[box.pageIndex];
    const { height } = page.getSize();

    if (box.kind === "x") {
      const size = box.fontSize;
      const inset = size * 0.1;
      const thickness = Math.max(1, size / 8);
      const left = box.x + inset;
      const right = box.x + size - inset;
      const top = height - box.y - inset;
      const bottom = height - box.y - size + inset;

      page.drawLine({
        start: { x: left, y: top },
        end: { x: right, y: bottom },
        thickness,
        color: hexToRgb(box.color),
      });
      page.drawLine({
        start: { x: right, y: top },
        end: { x: left, y: bottom },
        thickness,
        color: hexToRgb(box.color),
      });
      continue;
    }

    if (!box.text.trim()) continue;

    const font = box.bold ? boldFont : regularFont;
    const lineHeight = box.fontSize * 1.2;
    const isRtl = box.dir === "rtl";
    const lines = box.text.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      if (!rawLine) continue;

      const lineWidth = font.widthOfTextAtSize(rawLine, box.fontSize);
      const drawX = isRtl ? box.x - lineWidth : box.x;
      const drawY = height - box.y - box.fontSize - i * lineHeight;

      page.drawText(rawLine, {
        x: drawX,
        y: drawY,
        size: box.fontSize,
        font,
        color: hexToRgb(box.color),
      });
    }
  }

  return await pdfDoc.save();
}
