import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import fs from "fs/promises";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId } = await params;
  const url = new URL(request.url);
  const wantOriginal = url.searchParams.get("original") === "1";
  const doc = await prisma.document.findUnique({ where: { id: documentId } });

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const sourcePath = wantOriginal && doc.originalStoragePath
      ? doc.originalStoragePath
      : doc.storagePath;
    const fileBuffer = await fs.readFile(sourcePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}"`,
        "Cache-Control": "no-store, must-revalidate",
        "Last-Modified": doc.updatedAt.toUTCString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }
}
