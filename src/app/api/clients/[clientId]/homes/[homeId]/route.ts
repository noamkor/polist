import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { homeSchema } from "@/lib/validators/insurance";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; homeId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { homeId } = await params;
  const body = await request.json();
  const result = homeSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const home = await prisma.home.update({ where: { id: homeId }, data: result.data });
  return NextResponse.json(home);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; homeId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { homeId } = await params;
  await prisma.home.delete({ where: { id: homeId } });
  return NextResponse.json({ success: true });
}
