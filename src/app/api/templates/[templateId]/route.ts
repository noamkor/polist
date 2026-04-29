import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { deleteFile } from "@/lib/file-storage";
import { sanitizeFields } from "@/lib/template-types";
import fs from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { templateId } = await params;
  const tpl = await prisma.template.findUnique({ where: { id: templateId } });
  if (!tpl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: tpl.id,
    name: tpl.name,
    description: tpl.description,
    fields: Array.isArray(tpl.fields) ? tpl.fields : [],
    createdAt: tpl.createdAt,
    updatedAt: tpl.updatedAt,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { templateId } = await params;
  const body = await request.json();

  const data: { name?: string; description?: string | null; fields?: object } = {};
  if (typeof body.name === "string" && body.name.trim().length > 0) {
    data.name = body.name.trim();
  }
  if (typeof body.description === "string" || body.description === null) {
    data.description = body.description?.trim() || null;
  }
  if (Array.isArray(body.fields)) {
    data.fields = sanitizeFields(body.fields);
  }

  const updated = await prisma.template.update({
    where: { id: templateId },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { templateId } = await params;
  const tpl = await prisma.template.findUnique({ where: { id: templateId } });
  if (!tpl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (tpl.storagePath) {
    await deleteFile(tpl.storagePath);
    try {
      await fs.rmdir(path.dirname(tpl.storagePath));
    } catch {
      // ignore
    }
  }
  await prisma.template.delete({ where: { id: templateId } });
  return NextResponse.json({ success: true });
}
