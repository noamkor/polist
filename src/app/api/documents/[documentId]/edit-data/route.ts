import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId } = await params;
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { fileName: true, editBoxes: true, mimeType: true },
  });

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    fileName: doc.fileName,
    boxes: Array.isArray(doc.editBoxes) ? doc.editBoxes : [],
  });
}
