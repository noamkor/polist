import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { clientSchema } from "@/lib/validators/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const category = searchParams.get("category");

  const where: any = {};

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phoneNumbers: { some: { number: { contains: search } } } },
      { idNumber: { contains: search } },
      { vehicles: { some: { licensePlate: { contains: search, mode: "insensitive" } } } },
    ];
  }

  if (category) {
    switch (category) {
      case "VEHICLE":
        where.vehicles = { some: {} };
        break;
      case "HOME":
        where.homes = { some: {} };
        break;
      case "BUSINESS":
        where.businesses = { some: {} };
        break;
      case "HEALTH":
        where.healthPolicies = { some: {} };
        break;
      case "PENSION":
        where.pensionPolicies = { some: {} };
        break;
    }
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        phoneNumbers: true,
        _count: {
          select: {
            vehicles: true,
            homes: true,
            businesses: true,
            healthPolicies: true,
            pensionPolicies: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.client.count({ where }),
  ]);

  return NextResponse.json({ clients, total, page, limit });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const result = clientSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { phoneNumbers, ...clientData } = result.data;

  const client = await prisma.client.create({
    data: {
      ...clientData,
      email: clientData.email || null,
      dateOfBirth: clientData.dateOfBirth ? new Date(clientData.dateOfBirth) : null,
      phoneNumbers: phoneNumbers?.length
        ? { create: phoneNumbers.map((p) => ({ number: p.number, label: p.label })) }
        : undefined,
    },
    include: { phoneNumbers: true },
  });

  return NextResponse.json(client, { status: 201 });
}
