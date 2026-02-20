import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { clientSchema } from "@/lib/validators/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      phoneNumbers: true,
      vehicles: { include: { insurance: { include: { documents: true } } } },
      homes: { include: { insurance: { include: { documents: true } } } },
      businesses: { include: { insurance: { include: { documents: true } } } },
      healthPolicies: { include: { insurance: { include: { documents: true } } } },
      pensionPolicies: { include: { insurance: { include: { documents: true } } } },
      familyRelationsA: { include: { clientB: { select: { id: true, firstName: true, lastName: true } } } },
      familyRelationsB: { include: { clientA: { select: { id: true, firstName: true, lastName: true } } } },
      documents: true,
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(client);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  const body = await request.json();
  const result = clientSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { phoneNumbers, ...clientData } = result.data;

  const client = await prisma.$transaction(async (tx) => {
    // Update client data
    const updated = await tx.client.update({
      where: { id: clientId },
      data: {
        ...clientData,
        email: clientData.email || null,
        dateOfBirth: clientData.dateOfBirth ? new Date(clientData.dateOfBirth) : null,
      },
    });

    // Sync phone numbers
    if (phoneNumbers !== undefined) {
      // Delete existing phone numbers that are not in the new list
      const existingIds = phoneNumbers.filter((p) => p.id).map((p) => p.id!);
      await tx.phoneNumber.deleteMany({
        where: { clientId, id: { notIn: existingIds } },
      });

      // Upsert phone numbers
      for (const phone of phoneNumbers) {
        if (phone.id) {
          await tx.phoneNumber.update({
            where: { id: phone.id },
            data: { number: phone.number, label: phone.label },
          });
        } else {
          await tx.phoneNumber.create({
            data: { number: phone.number, label: phone.label, clientId },
          });
        }
      }
    }

    return tx.client.findUnique({
      where: { id: clientId },
      include: { phoneNumbers: true },
    });
  });

  return NextResponse.json(client);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;
  await prisma.client.delete({ where: { id: clientId } });

  return NextResponse.json({ success: true });
}
