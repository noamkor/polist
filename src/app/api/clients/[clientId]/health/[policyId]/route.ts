import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { healthPolicySchema } from "@/lib/validators/insurance";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; policyId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { policyId } = await params;
  const body = await request.json();
  const result = healthPolicySchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const policy = await prisma.healthPolicy.update({ where: { id: policyId }, data: result.data });
  return NextResponse.json(policy);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; policyId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { policyId } = await params;
  await prisma.healthPolicy.delete({ where: { id: policyId } });
  return NextResponse.json({ success: true });
}
