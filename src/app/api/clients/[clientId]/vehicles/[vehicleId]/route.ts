import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { vehicleSchema } from "@/lib/validators/insurance";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; vehicleId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { insurance: { include: { documents: true }, orderBy: { year: "desc" } } },
  });

  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(vehicle);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; vehicleId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId } = await params;
  const body = await request.json();
  const result = vehicleSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: result.data,
  });

  return NextResponse.json(vehicle);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; vehicleId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId } = await params;
  await prisma.vehicle.delete({ where: { id: vehicleId } });
  return NextResponse.json({ success: true });
}
