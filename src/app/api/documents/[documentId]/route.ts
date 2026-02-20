import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { readFileStream, deleteFile } from "@/lib/file-storage";
import fs from "fs/promises";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId } = await params;
  const doc = await prisma.document.findUnique({ where: { id: documentId } });

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const fileBuffer = await fs.readFile(doc.storagePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
        "Content-Length": String(doc.fileSize),
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId } = await params;
  const doc = await prisma.document.findUnique({ where: { id: documentId } });

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteFile(doc.storagePath);
  await prisma.document.delete({ where: { id: documentId } });

  return NextResponse.json({ success: true });
}
