import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { labels } from "@/lib/utils/hebrew";
import { formatDate } from "@/lib/utils/dates";
import { ExpiringInsurances } from "@/components/dashboard/ExpiringInsurances";
import { BirthdaysList } from "@/components/dashboard/BirthdaysList";
import { AdvisorPanel } from "@/components/dashboard/AdvisorPanel";

export default async function DashboardPage() {
  await verifySession();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const currentMonth = now.getMonth() + 1; // 1-based
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;

  // End of next month for expiring insurance queries
  const nextMonthYear = currentMonth === 12 ? now.getFullYear() + 1 : now.getFullYear();
  const endOfNextMonth = new Date(nextMonthYear, nextMonth, 0, 23, 59, 59, 999);

  const [
    clientCount,
    vehicleClientCount,
    homeClientCount,
    businessClientCount,
    healthClientCount,
    pensionClientCount,
    birthdayClients,
    expiringVehicle,
    expiringHome,
    expiringBusiness,
    expiringHealth,
    expiringPension,
    // Advisor queries
    noInsuranceClients,
    potentialRelations,
    missingContactClients,
    missingBirthdayClients,
    uninsuredVehicles,
    uninsuredHomes,
    uninsuredBusinesses,
    uninsuredHealth,
    uninsuredPension,
    missingDatesVehicle,
    missingDatesHome,
    missingDatesBusiness,
    missingDatesHealth,
    missingDatesPension,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { vehicles: { some: {} } } }),
    prisma.client.count({ where: { homes: { some: {} } } }),
    prisma.client.count({ where: { businesses: { some: {} } } }),
    prisma.client.count({ where: { healthPolicies: { some: {} } } }),
    prisma.client.count({ where: { pensionPolicies: { some: {} } } }),
    prisma.$queryRaw<Array<{ id: string; firstName: string; lastName: string; dateOfBirth: Date; gender: string | null }>>`
      SELECT id, "firstName", "lastName", "dateOfBirth", "gender"
      FROM "Client"
      WHERE "dateOfBirth" IS NOT NULL
        AND EXTRACT(MONTH FROM "dateOfBirth") IN (${currentMonth}, ${nextMonth})
      ORDER BY
        CASE WHEN EXTRACT(MONTH FROM "dateOfBirth") = ${currentMonth} THEN 0 ELSE 1 END,
        EXTRACT(DAY FROM "dateOfBirth") ASC
    `,
    prisma.vehicleInsurance.findMany({
      where: { endDate: { gte: today, lte: endOfNextMonth } },
      include: { vehicle: { include: { client: true } } },
    }),
    prisma.homeInsurance.findMany({
      where: { endDate: { gte: today, lte: endOfNextMonth } },
      include: { home: { include: { client: true } } },
    }),
    prisma.businessInsurance.findMany({
      where: { endDate: { gte: today, lte: endOfNextMonth } },
      include: { business: { include: { client: true } } },
    }),
    prisma.healthInsurance.findMany({
      where: { endDate: { gte: today, lte: endOfNextMonth } },
      include: { healthPolicy: { include: { client: true } } },
    }),
    prisma.pensionInsurance.findMany({
      where: { endDate: { gte: today, lte: endOfNextMonth } },
      include: { pensionPolicy: { include: { client: true } } },
    }),
    // Advisor: clients with no assets/policies at all
    prisma.client.findMany({
      where: {
        vehicles: { none: {} },
        homes: { none: {} },
        businesses: { none: {} },
        healthPolicies: { none: {} },
        pensionPolicies: { none: {} },
      },
      select: { id: true, firstName: true, lastName: true },
      take: 10,
    }),
    // Advisor: potential family relations (same last name, no relation defined)
    prisma.$queryRaw<Array<{ id1: string; firstName1: string; id2: string; firstName2: string; lastName: string }>>`
      SELECT c1.id as "id1", c1."firstName" as "firstName1",
             c2.id as "id2", c2."firstName" as "firstName2",
             c1."lastName" as "lastName"
      FROM "Client" c1
      JOIN "Client" c2 ON c1."lastName" = c2."lastName" AND c1.id < c2.id
      LEFT JOIN "FamilyRelation" fr ON
        (fr."clientAId" = c1.id AND fr."clientBId" = c2.id) OR
        (fr."clientAId" = c2.id AND fr."clientBId" = c1.id)
      WHERE fr.id IS NULL
        AND c1."lastName" IS NOT NULL AND c1."lastName" != ''
      LIMIT 10
    `,
    // Advisor: clients without any contact info
    prisma.client.findMany({
      where: {
        AND: [
          { phoneNumbers: { none: {} } },
          { OR: [{ email: null }, { email: "" }] },
        ],
      },
      select: { id: true, firstName: true, lastName: true },
      take: 10,
    }),
    // Advisor: clients without date of birth
    prisma.client.findMany({
      where: { dateOfBirth: null },
      select: { id: true, firstName: true, lastName: true },
      take: 10,
    }),
    // Advisor: assets without insurance records
    prisma.vehicle.findMany({
      where: { insurance: { none: {} } },
      select: { licensePlate: true, manufacturer: true, client: { select: { id: true, firstName: true, lastName: true } } },
      take: 5,
    }),
    prisma.home.findMany({
      where: { insurance: { none: {} } },
      select: { address: true, client: { select: { id: true, firstName: true, lastName: true } } },
      take: 5,
    }),
    prisma.business.findMany({
      where: { insurance: { none: {} } },
      select: { businessName: true, client: { select: { id: true, firstName: true, lastName: true } } },
      take: 5,
    }),
    prisma.healthPolicy.findMany({
      where: { insurance: { none: {} } },
      select: { policyName: true, client: { select: { id: true, firstName: true, lastName: true } } },
      take: 5,
    }),
    prisma.pensionPolicy.findMany({
      where: { insurance: { none: {} } },
      select: { policyName: true, client: { select: { id: true, firstName: true, lastName: true } } },
      take: 5,
    }),
    // Advisor: insurance records missing start/end dates
    prisma.vehicleInsurance.findMany({
      where: { OR: [{ startDate: null }, { endDate: null }] },
      select: { year: true, vehicle: { select: { licensePlate: true, manufacturer: true, client: { select: { id: true, firstName: true, lastName: true } } } } },
      take: 5,
    }),
    prisma.homeInsurance.findMany({
      where: { OR: [{ startDate: null }, { endDate: null }] },
      select: { year: true, home: { select: { address: true, client: { select: { id: true, firstName: true, lastName: true } } } } },
      take: 5,
    }),
    prisma.businessInsurance.findMany({
      where: { OR: [{ startDate: null }, { endDate: null }] },
      select: { year: true, business: { select: { businessName: true, client: { select: { id: true, firstName: true, lastName: true } } } } },
      take: 5,
    }),
    prisma.healthInsurance.findMany({
      where: { OR: [{ startDate: null }, { endDate: null }] },
      select: { year: true, healthPolicy: { select: { policyName: true, client: { select: { id: true, firstName: true, lastName: true } } } } },
      take: 5,
    }),
    prisma.pensionInsurance.findMany({
      where: { OR: [{ startDate: null }, { endDate: null }] },
      select: { year: true, pensionPolicy: { select: { policyName: true, client: { select: { id: true, firstName: true, lastName: true } } } } },
      take: 5,
    }),
  ]);

  const insuranceStats = [
    { label: labels.vehicles, count: vehicleClientCount },
    { label: labels.homes, count: homeClientCount },
    { label: labels.businesses, count: businessClientCount },
    { label: labels.health, count: healthClientCount },
    { label: labels.pension, count: pensionClientCount },
  ];

  // Build expiring insurances list
  const expiring = [
    ...expiringVehicle.map((r) => ({
      id: r.id,
      year: r.year,
      endDate: r.endDate!.toISOString(),
      endMonth: r.endDate!.getMonth() + 1,
      provider: r.provider,
      policyNumber: r.policyNumber,
      premium: r.premium,
      category: "VEHICLE",
      assetId: r.vehicleId,
      assetLabel: `${r.vehicle.manufacturer || ""} ${r.vehicle.model || ""} - ${r.vehicle.licensePlate}`.trim(),
      clientName: `${r.vehicle.client.firstName} ${r.vehicle.client.lastName}`,
      clientId: r.vehicle.client.id,
    })),
    ...expiringHome.map((r) => ({
      id: r.id,
      year: r.year,
      endDate: r.endDate!.toISOString(),
      endMonth: r.endDate!.getMonth() + 1,
      provider: r.provider,
      policyNumber: r.policyNumber,
      premium: r.premium,
      category: "HOME",
      assetId: r.homeId,
      assetLabel: r.home.address,
      clientName: `${r.home.client.firstName} ${r.home.client.lastName}`,
      clientId: r.home.client.id,
    })),
    ...expiringBusiness.map((r) => ({
      id: r.id,
      year: r.year,
      endDate: r.endDate!.toISOString(),
      endMonth: r.endDate!.getMonth() + 1,
      provider: r.provider,
      policyNumber: r.policyNumber,
      premium: r.premium,
      category: "BUSINESS",
      assetId: r.businessId,
      assetLabel: r.business.businessName,
      clientName: `${r.business.client.firstName} ${r.business.client.lastName}`,
      clientId: r.business.client.id,
    })),
    ...expiringHealth.map((r) => ({
      id: r.id,
      year: r.year,
      endDate: r.endDate!.toISOString(),
      endMonth: r.endDate!.getMonth() + 1,
      provider: r.healthPolicy.provider,
      policyNumber: r.policyNumber,
      premium: r.premium,
      category: "HEALTH",
      assetId: r.healthPolicyId,
      assetLabel: r.healthPolicy.policyName,
      clientName: `${r.healthPolicy.client.firstName} ${r.healthPolicy.client.lastName}`,
      clientId: r.healthPolicy.client.id,
    })),
    ...expiringPension.map((r) => ({
      id: r.id,
      year: r.year,
      endDate: r.endDate!.toISOString(),
      endMonth: r.endDate!.getMonth() + 1,
      provider: r.pensionPolicy.provider,
      policyNumber: r.policyNumber,
      premium: r.premium,
      category: "PENSION",
      assetId: r.pensionPolicyId,
      assetLabel: r.pensionPolicy.policyName,
      clientName: `${r.pensionPolicy.client.firstName} ${r.pensionPolicy.client.lastName}`,
      clientId: r.pensionPolicy.client.id,
    })),
  ].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

  // Check which expiring insurances already have a next-year record (already renewed)
  const renewalChecks = await Promise.all([
    expiringVehicle.length > 0
      ? prisma.vehicleInsurance.findMany({
          where: { OR: expiringVehicle.map((r) => ({ vehicleId: r.vehicleId, year: r.year + 1 })) },
          select: { vehicleId: true, year: true },
        })
      : [],
    expiringHome.length > 0
      ? prisma.homeInsurance.findMany({
          where: { OR: expiringHome.map((r) => ({ homeId: r.homeId, year: r.year + 1 })) },
          select: { homeId: true, year: true },
        })
      : [],
    expiringBusiness.length > 0
      ? prisma.businessInsurance.findMany({
          where: { OR: expiringBusiness.map((r) => ({ businessId: r.businessId, year: r.year + 1 })) },
          select: { businessId: true, year: true },
        })
      : [],
    expiringHealth.length > 0
      ? prisma.healthInsurance.findMany({
          where: { OR: expiringHealth.map((r) => ({ healthPolicyId: r.healthPolicyId, year: r.year + 1 })) },
          select: { healthPolicyId: true, year: true },
        })
      : [],
    expiringPension.length > 0
      ? prisma.pensionInsurance.findMany({
          where: { OR: expiringPension.map((r) => ({ pensionPolicyId: r.pensionPolicyId, year: r.year + 1 })) },
          select: { pensionPolicyId: true, year: true },
        })
      : [],
  ]);

  const renewedSet = new Set<string>();
  for (const r of renewalChecks[0]) renewedSet.add(`VEHICLE:${r.vehicleId}:${r.year}`);
  for (const r of renewalChecks[1]) renewedSet.add(`HOME:${r.homeId}:${r.year}`);
  for (const r of renewalChecks[2]) renewedSet.add(`BUSINESS:${r.businessId}:${r.year}`);
  for (const r of renewalChecks[3]) renewedSet.add(`HEALTH:${r.healthPolicyId}:${r.year}`);
  for (const r of renewalChecks[4]) renewedSet.add(`PENSION:${r.pensionPolicyId}:${r.year}`);

  const expiringWithRenewed = expiring.map((item) => ({
    ...item,
    renewed: renewedSet.has(`${item.category}:${item.assetId}:${item.year + 1}`),
  }));

  const monthNames = new Intl.DateTimeFormat("he-IL", { month: "long" });
  const currentMonthLabel = monthNames.format(new Date(now.getFullYear(), now.getMonth()));
  const nextMonthLabel = monthNames.format(new Date(now.getFullYear(), now.getMonth() + 1));

  const birthdayItems = birthdayClients.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    dateOfBirth: c.dateOfBirth.toISOString(),
    birthMonth: new Date(c.dateOfBirth).getMonth() + 1,
    gender: c.gender,
  }));

  // Build uninsured assets list
  const uninsuredAssets = [
    ...uninsuredVehicles.map((v) => ({
      category: "VEHICLE",
      assetLabel: `${v.manufacturer || ""} ${v.licensePlate}`.trim(),
      clientId: v.client.id,
      clientName: `${v.client.firstName} ${v.client.lastName}`,
    })),
    ...uninsuredHomes.map((h) => ({
      category: "HOME",
      assetLabel: h.address,
      clientId: h.client.id,
      clientName: `${h.client.firstName} ${h.client.lastName}`,
    })),
    ...uninsuredBusinesses.map((b) => ({
      category: "BUSINESS",
      assetLabel: b.businessName,
      clientId: b.client.id,
      clientName: `${b.client.firstName} ${b.client.lastName}`,
    })),
    ...uninsuredHealth.map((h) => ({
      category: "HEALTH",
      assetLabel: h.policyName,
      clientId: h.client.id,
      clientName: `${h.client.firstName} ${h.client.lastName}`,
    })),
    ...uninsuredPension.map((p) => ({
      category: "PENSION",
      assetLabel: p.policyName,
      clientId: p.client.id,
      clientName: `${p.client.firstName} ${p.client.lastName}`,
    })),
  ];

  // Build missing dates records list
  const missingDatesRecords = [
    ...missingDatesVehicle.map((r) => ({
      category: "VEHICLE",
      year: r.year,
      assetLabel: `${r.vehicle.manufacturer || ""} ${r.vehicle.licensePlate}`.trim(),
      clientId: r.vehicle.client.id,
      clientName: `${r.vehicle.client.firstName} ${r.vehicle.client.lastName}`,
    })),
    ...missingDatesHome.map((r) => ({
      category: "HOME",
      year: r.year,
      assetLabel: r.home.address,
      clientId: r.home.client.id,
      clientName: `${r.home.client.firstName} ${r.home.client.lastName}`,
    })),
    ...missingDatesBusiness.map((r) => ({
      category: "BUSINESS",
      year: r.year,
      assetLabel: r.business.businessName,
      clientId: r.business.client.id,
      clientName: `${r.business.client.firstName} ${r.business.client.lastName}`,
    })),
    ...missingDatesHealth.map((r) => ({
      category: "HEALTH",
      year: r.year,
      assetLabel: r.healthPolicy.policyName,
      clientId: r.healthPolicy.client.id,
      clientName: `${r.healthPolicy.client.firstName} ${r.healthPolicy.client.lastName}`,
    })),
    ...missingDatesPension.map((r) => ({
      category: "PENSION",
      year: r.year,
      assetLabel: r.pensionPolicy.policyName,
      clientId: r.pensionPolicy.client.id,
      clientName: `${r.pensionPolicy.client.firstName} ${r.pensionPolicy.client.lastName}`,
    })),
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{labels.dashboard}</h1>

      {/* Stats row - clients + insurance types */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
        <Link
          href="/clients"
          className="col-span-1 sm:col-span-1 bg-card rounded-xl p-4 shadow-sm border-2 border-foreground/20 text-center hover:shadow-md transition-shadow"
        >
          <p className="text-2xl font-bold">{clientCount}</p>
          <p className="text-sm text-muted-foreground mt-1 font-medium">{labels.totalClients}</p>
        </Link>
        {insuranceStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-xl p-4 shadow-sm border border-border-light text-center"
          >
            <p className="text-2xl font-bold">{stat.count}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <AdvisorPanel
        noInsuranceClients={noInsuranceClients}
        potentialRelations={potentialRelations}
        missingContactClients={missingContactClients}
        missingBirthdayClients={missingBirthdayClients}
        uninsuredAssets={uninsuredAssets}
        missingDatesRecords={missingDatesRecords}
      />

      <ExpiringInsurances
        items={expiringWithRenewed}
        currentMonth={currentMonth}
        nextMonth={nextMonth}
        currentMonthLabel={currentMonthLabel}
        nextMonthLabel={nextMonthLabel}
      />

      <BirthdaysList
        items={birthdayItems}
        currentMonth={currentMonth}
        nextMonth={nextMonth}
        currentMonthLabel={currentMonthLabel}
        nextMonthLabel={nextMonthLabel}
      />
    </div>
  );
}
