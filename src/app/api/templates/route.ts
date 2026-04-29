import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { saveFile, isAllowedFileSize } from "@/lib/file-storage";
import { getTemplateDir } from "@/lib/utils/paths";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.template.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      fields: true,
    },
  });

  return NextResponse.json(
    templates.map((t) => ({
      ...t,
      fieldCount: Array.isArray(t.fields) ? t.fields.length : 0,
      fields: undefined,
    }))
  );
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const name = ((formData.get("name") as string | null) || "").trim();
  const description = ((formData.get("description") as string | null) || "").trim() || null;

  if (!file || !name) {
    return NextResponse.json({ error: "Missing file or name" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
  }
  if (!isAllowedFileSize(file.size)) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
  }

  const created = await prisma.template.create({
    data: {
      name,
      description,
      storagePath: "",
      fields: [],
    },
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  const directory = getTemplateDir(created.id);
  const storagePath = await saveFile(directory, file.name, buffer);

  const updated = await prisma.template.update({
    where: { id: created.id },
    data: { storagePath },
  });

  return NextResponse.json(updated, { status: 201 });
}
