import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { businessSchema } from "@/lib/validators/insurance";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; businessId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = await params;
  const body = await request.json();
  const result = businessSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const business = await prisma.business.update({ where: { id: businessId }, data: result.data });
  return NextResponse.json(business);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; businessId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = await params;
  await prisma.business.delete({ where: { id: businessId } });
  return NextResponse.json({ success: true });
}
