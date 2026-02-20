import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { familyRelationSchema } from "@/lib/validators/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const [relationsA, relationsB] = await Promise.all([
    prisma.familyRelation.findMany({
      where: { clientAId: clientId },
      include: { clientB: { select: { id: true, firstName: true, lastName: true } } },
    }),
    prisma.familyRelation.findMany({
      where: { clientBId: clientId },
      include: { clientA: { select: { id: true, firstName: true, lastName: true } } },
    }),
  ]);

  return NextResponse.json({ relationsA, relationsB });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const body = await request.json();
  const result = familyRelationSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { clientBId, relationType } = result.data;

  if (clientId === clientBId) {
    return NextResponse.json({ error: "Cannot create relation with self" }, { status: 400 });
  }

  // Check if relation already exists in either direction
  const existing = await prisma.familyRelation.findFirst({
    where: {
      OR: [
        { clientAId: clientId, clientBId },
        { clientAId: clientBId, clientBId: clientId },
      ],
    },
  });

  if (existing) {
    return NextResponse.json({ error: "הקשר כבר קיים" }, { status: 409 });
  }

  const relation = await prisma.familyRelation.create({
    data: { clientAId: clientId, clientBId, relationType },
    include: {
      clientA: { select: { id: true, firstName: true, lastName: true } },
      clientB: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(relation, { status: 201 });
}
