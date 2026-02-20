import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { homeSchema } from "@/lib/validators/insurance";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const homes = await prisma.home.findMany({
    where: { clientId },
    include: { insurance: { include: { documents: true }, orderBy: { year: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(homes);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const body = await request.json();
  const result = homeSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const home = await prisma.home.create({
    data: { ...result.data, clientId },
  });

  return NextResponse.json(home, { status: 201 });
}
