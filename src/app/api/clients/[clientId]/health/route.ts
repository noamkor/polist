import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { healthPolicySchema } from "@/lib/validators/insurance";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const policies = await prisma.healthPolicy.findMany({
    where: { clientId },
    include: { insurance: { include: { documents: true }, orderBy: { year: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(policies);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const body = await request.json();
  const result = healthPolicySchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const policy = await prisma.healthPolicy.create({
    data: { ...result.data, clientId },
  });

  return NextResponse.json(policy, { status: 201 });
}
