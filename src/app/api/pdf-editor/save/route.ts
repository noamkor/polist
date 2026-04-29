import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import fs from "fs/promises";
import path from "path";
import { applyTextBoxesToPdf, PdfTextBox } from "@/lib/pdf-editor";

interface IncomingTextBox {
  pageIndex: number;
  x: number;
  y: number;
  fontSize: number;
  bold: boolean;
  text: string;
  dir?: "ltr" | "rtl";
  kind?: "text" | "x";
  color?: string;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const pdfFile = formData.get("pdf") as File | null;
  const textBoxesRaw = formData.get("textBoxes") as string | null;
  const documentId = formData.get("documentId") as string | null;
  const fileName = (formData.get("fileName") as string | null) || "document.pdf";

  if (!pdfFile || !textBoxesRaw) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let textBoxes: IncomingTextBox[];
  try {
    textBoxes = JSON.parse(textBoxesRaw);
    if (!Array.isArray(textBoxes)) throw new Error("textBoxes must be an array");
  } catch {
    return NextResponse.json({ error: "Invalid textBoxes JSON" }, { status: 400 });
  }

  const cleanedBoxes: PdfTextBox[] = textBoxes
    .filter((b) => {
      if (b.kind === "x") return true;
      return typeof b.text === "string" && b.text.trim().length > 0;
    })
    .map((b) => ({
      pageIndex: Number(b.pageIndex) || 0,
      x: Number(b.x) || 0,
      y: Number(b.y) || 0,
      fontSize: Number(b.fontSize) || 14,
      bold: Boolean(b.bold),
      text: String(b.text || ""),
      dir: b.dir === "ltr" ? "ltr" : "rtl",
      kind: b.kind === "x" ? "x" : "text",
      color: typeof b.color === "string" && /^#[0-9a-fA-F]{6}$/.test(b.color)
        ? b.color
        : "#000000",
    }));

  let originalBytes: Uint8Array;
  let originalPath: string | null = null;

  try {
    if (documentId) {
      const doc = await prisma.document.findUnique({ where: { id: documentId } });
      if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
      if (doc.mimeType !== "application/pdf") {
        return NextResponse.json({ error: "Document is not a PDF" }, { status: 400 });
      }

      if (doc.originalStoragePath) {
        originalPath = doc.originalStoragePath;
      } else {
        const ext = path.extname(doc.storagePath);
        const dir = path.dirname(doc.storagePath);
        const base = path.basename(doc.storagePath, ext);
        const backupPath = path.join(dir, `${base}.original${ext}`);
        await fs.copyFile(doc.storagePath, backupPath);
        originalPath = backupPath;
      }

      const fileBuffer = await fs.readFile(originalPath);
      originalBytes = new Uint8Array(fileBuffer);
    } else {
      const buf = Buffer.from(await pdfFile.arrayBuffer());
      originalBytes = new Uint8Array(buf);
    }

    const outputBytes = await applyTextBoxesToPdf(originalBytes, cleanedBoxes);

    if (documentId) {
      const doc = await prisma.document.findUnique({ where: { id: documentId } });
      if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

      await fs.writeFile(doc.storagePath, outputBytes);
      const updated = await prisma.document.update({
        where: { id: documentId },
        data: {
          fileSize: outputBytes.byteLength,
          updatedAt: new Date(),
          editBoxes: JSON.parse(JSON.stringify(cleanedBoxes)),
          originalStoragePath: originalPath,
        },
      });

      console.log("[pdf-editor/save]", {
        documentId,
        boxesSaved: cleanedBoxes.length,
        editBoxesInDb: Array.isArray(updated.editBoxes) ? updated.editBoxes.length : "not-array",
        originalStoragePath: updated.originalStoragePath,
        storagePath: updated.storagePath,
      });

      return NextResponse.json({ success: true, documentId, boxesSaved: cleanedBoxes.length });
    }

    return new NextResponse(Buffer.from(outputBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (err) {
    console.error("[pdf-editor/save] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
