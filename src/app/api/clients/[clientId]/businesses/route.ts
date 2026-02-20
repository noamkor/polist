import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { businessSchema } from "@/lib/validators/insurance";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const businesses = await prisma.business.findMany({
    where: { clientId },
    include: { insurance: { include: { documents: true }, orderBy: { year: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(businesses);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const body = await request.json();
  const result = businessSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const business = await prisma.business.create({
    data: { ...result.data, clientId },
  });

  return NextResponse.json(business, { status: 201 });
}
