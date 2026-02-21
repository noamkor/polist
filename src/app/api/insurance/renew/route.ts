import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { category, assetId, year, provider, policyNumber, premium, endDate } = await request.json();

  if (!category || !assetId || !year) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const newYear = year + 1;

  // Calculate new start date as day after the old end date
  let newStartDate: Date | null = null;
  if (endDate) {
    const d = new Date(endDate);
    d.setDate(d.getDate() + 1);
    newStartDate = d;
  }

  // Calculate new end date as one year after new start date
  let newEndDate: Date | null = null;
  if (newStartDate) {
    newEndDate = new Date(newStartDate);
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    newEndDate.setDate(newEndDate.getDate() - 1);
  }

  const baseData = {
    year: newYear,
    policyNumber: policyNumber || null,
    premium: premium || null,
    startDate: newStartDate,
    endDate: newEndDate,
    notes: null,
  };

  // Health & Pension don't have a provider field — provider lives on the parent policy
  const dataWithProvider = { ...baseData, provider: provider || null };

  try {
    let record;
    switch (category) {
      case "VEHICLE":
        record = await prisma.vehicleInsurance.create({
          data: { ...dataWithProvider, vehicleId: assetId },
        });
        break;
      case "HOME":
        record = await prisma.homeInsurance.create({
          data: { ...dataWithProvider, homeId: assetId },
        });
        break;
      case "BUSINESS":
        record = await prisma.businessInsurance.create({
          data: { ...dataWithProvider, businessId: assetId },
        });
        break;
      case "HEALTH":
        record = await prisma.healthInsurance.create({
          data: { ...baseData, healthPolicyId: assetId },
        });
        break;
      case "PENSION":
        record = await prisma.pensionInsurance.create({
          data: { ...baseData, pensionPolicyId: assetId },
        });
        break;
      default:
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    // Unique constraint violation - year already exists, meaning already renewed
    if (error.code === "P2002") {
      return NextResponse.json({ alreadyRenewed: true }, { status: 200 });
    }
    throw error;
  }
}
