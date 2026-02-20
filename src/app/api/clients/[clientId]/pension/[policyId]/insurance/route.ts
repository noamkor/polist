import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { insuranceYearSchema, insuranceYearUpdateSchema } from "@/lib/validators/insurance";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; policyId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { policyId } = await params;
  const records = await prisma.pensionInsurance.findMany({
    where: { pensionPolicyId: policyId },
    include: { documents: true },
    orderBy: { year: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; policyId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { policyId } = await params;
  const body = await request.json();
  const result = insuranceYearSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const data = result.data;
  const record = await prisma.pensionInsurance.create({
    data: {
      year: data.year,
      policyNumber: data.policyNumber || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      premium: data.premium || null,
      notes: data.notes || null,
      pensionPolicyId: policyId,
    },
  });

  return NextResponse.json(record, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const result = insuranceYearUpdateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { id, ...data } = result.data;
  const record = await prisma.pensionInsurance.update({
    where: { id },
    data: {
      year: data.year,
      policyNumber: data.policyNumber || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      premium: data.premium || null,
      notes: data.notes || null,
    },
  });

  return NextResponse.json(record);
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.pensionInsurance.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
