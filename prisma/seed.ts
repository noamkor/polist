import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1. Admin user
  const existingAdmin = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcryptjs.hash("admin123", 12);
    await prisma.user.create({
      data: {
        username: "admin",
        hashedPassword,
        name: "מנהל מערכת",
        role: "ADMIN",
      },
    });
    console.log("Admin user created: admin / admin123");
  } else {
    console.log("Admin user already exists");
  }

  // 2. Mock clients & expiring insurances
  const existingClients = await prisma.client.count();
  if (existingClients > 0) {
    console.log(`Skipping mock data — ${existingClients} clients already exist`);
    return;
  }

  console.log("Creating mock clients and expiring insurances...");

  // Clients
  const david = await prisma.client.create({
    data: {
      firstName: "דוד",
      lastName: "כהן",
      idNumber: "012345678",
      gender: "MALE",
      email: "david@example.com",
      dateOfBirth: new Date("1985-03-15"),
      address: "הרצל 10, תל אביב",
      phoneNumbers: {
        create: [{ number: "050-1234567", label: "נייד" }],
      },
    },
  });

  const sarah = await prisma.client.create({
    data: {
      firstName: "שרה",
      lastName: "כהן",
      idNumber: "023456789",
      gender: "FEMALE",
      email: "sarah@example.com",
      dateOfBirth: new Date("1988-02-28"),
      address: "הרצל 10, תל אביב",
      phoneNumbers: {
        create: [{ number: "050-2345678", label: "נייד" }],
      },
    },
  });

  const moshe = await prisma.client.create({
    data: {
      firstName: "משה",
      lastName: "לוי",
      idNumber: "034567890",
      gender: "MALE",
      email: "moshe@example.com",
      dateOfBirth: new Date("1975-07-20"),
      address: "ויצמן 5, חיפה",
      phoneNumbers: {
        create: [
          { number: "052-3456789", label: "נייד" },
          { number: "04-8123456", label: "בית" },
        ],
      },
    },
  });

  const yael = await prisma.client.create({
    data: {
      firstName: "יעל",
      lastName: "אברהם",
      idNumber: "045678901",
      gender: "FEMALE",
      dateOfBirth: new Date("1990-11-05"),
      address: "בן גוריון 22, ירושלים",
      phoneNumbers: {
        create: [{ number: "054-4567890", label: "נייד" }],
      },
    },
  });

  const avi = await prisma.client.create({
    data: {
      firstName: "אבי",
      lastName: "לוי",
      idNumber: "056789012",
      gender: "MALE",
      email: "avi@example.com",
      dateOfBirth: new Date("1980-06-12"),
      address: "רוטשילד 30, תל אביב",
      phoneNumbers: {
        create: [{ number: "053-5678901", label: "נייד" }],
      },
    },
  });

  const rachel = await prisma.client.create({
    data: {
      firstName: "רחל",
      lastName: "מזרחי",
      idNumber: "067890123",
      gender: "FEMALE",
      email: "rachel@example.com",
      dateOfBirth: new Date("1992-02-10"),
      address: "שדרות ירושלים 15, רמת גן",
      phoneNumbers: {
        create: [{ number: "058-6789012", label: "נייד" }],
      },
    },
  });

  // Client with no insurance at all (for advisor insight)
  await prisma.client.create({
    data: {
      firstName: "יוסף",
      lastName: "חדש",
      idNumber: "078901234",
      gender: "MALE",
    },
  });

  // Family relation: David & Sarah (spouse)
  await prisma.familyRelation.create({
    data: { clientAId: david.id, clientBId: sarah.id, relationType: "SPOUSE" },
  });

  // --- Vehicles ---
  const davidCar = await prisma.vehicle.create({
    data: {
      licensePlate: "12-345-67",
      manufacturer: "טויוטה",
      model: "קורולה",
      year: 2020,
      clientId: david.id,
    },
  });

  const mosheCar = await prisma.vehicle.create({
    data: {
      licensePlate: "23-456-78",
      manufacturer: "יונדאי",
      model: "i30",
      year: 2022,
      clientId: moshe.id,
    },
  });

  const yaelCar = await prisma.vehicle.create({
    data: {
      licensePlate: "34-567-89",
      manufacturer: "מאזדה",
      model: "3",
      year: 2021,
      clientId: yael.id,
    },
  });

  const aviCar = await prisma.vehicle.create({
    data: {
      licensePlate: "45-678-90",
      manufacturer: "קיה",
      model: "ספורטאז'",
      year: 2023,
      clientId: avi.id,
    },
  });

  // Vehicle insurance — expiring soon
  await prisma.vehicleInsurance.create({
    data: {
      year: 2025,
      provider: "הראל",
      policyNumber: "VH-100234",
      startDate: new Date("2025-03-01"),
      endDate: new Date("2026-02-28"),
      premium: 3200,
      vehicleId: davidCar.id,
    },
  });

  await prisma.vehicleInsurance.create({
    data: {
      year: 2025,
      provider: "מגדל",
      policyNumber: "VH-200567",
      startDate: new Date("2025-03-10"),
      endDate: new Date("2026-03-09"),
      premium: 2800,
      vehicleId: mosheCar.id,
    },
  });

  await prisma.vehicleInsurance.create({
    data: {
      year: 2025,
      provider: "כלל",
      policyNumber: "VH-300890",
      startDate: new Date("2025-02-25"),
      endDate: new Date("2026-02-24"),
      premium: 2950,
      vehicleId: yaelCar.id,
    },
  });

  await prisma.vehicleInsurance.create({
    data: {
      year: 2025,
      provider: "הפניקס",
      policyNumber: "VH-401234",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-31"),
      premium: 3500,
      vehicleId: aviCar.id,
    },
  });

  // --- Homes ---
  const davidHome = await prisma.home.create({
    data: { address: "הרצל 10, תל אביב", clientId: david.id },
  });

  const sarahHome = await prisma.home.create({
    data: { address: "הרצל 10, דירה 5, תל אביב", clientId: sarah.id },
  });

  const rachelHome = await prisma.home.create({
    data: { address: "שדרות ירושלים 15, רמת גן", clientId: rachel.id },
  });

  // Home insurance — expiring soon
  await prisma.homeInsurance.create({
    data: {
      year: 2025,
      provider: "הראל",
      policyNumber: "HM-550123",
      startDate: new Date("2025-03-01"),
      endDate: new Date("2026-02-28"),
      premium: 1800,
      homeId: davidHome.id,
    },
  });

  await prisma.homeInsurance.create({
    data: {
      year: 2025,
      provider: "מגדל",
      policyNumber: "HM-660234",
      startDate: new Date("2025-03-15"),
      endDate: new Date("2026-03-14"),
      premium: 1500,
      homeId: sarahHome.id,
    },
  });

  await prisma.homeInsurance.create({
    data: {
      year: 2025,
      provider: "כלל",
      policyNumber: "HM-770345",
      startDate: new Date("2025-02-20"),
      endDate: new Date("2026-02-19"),
      premium: 2200,
      homeId: rachelHome.id,
    },
  });

  // --- Businesses ---
  const mosheBiz = await prisma.business.create({
    data: { businessName: "מכולת לוי", address: "ויצמן 5, חיפה", clientId: moshe.id },
  });

  await prisma.businessInsurance.create({
    data: {
      year: 2025,
      provider: "הפניקס",
      policyNumber: "BZ-880456",
      startDate: new Date("2025-03-01"),
      endDate: new Date("2026-02-28"),
      premium: 5500,
      businessId: mosheBiz.id,
    },
  });

  // --- Health Policies ---
  const sarahHealth = await prisma.healthPolicy.create({
    data: { policyName: "ביטוח בריאות פרטי", provider: "כללית", clientId: sarah.id },
  });

  const aviHealth = await prisma.healthPolicy.create({
    data: { policyName: "ביטוח בריאות מקיף", provider: "מכבי", clientId: avi.id },
  });

  await prisma.healthInsurance.create({
    data: {
      year: 2025,
      policyNumber: "HL-990567",
      startDate: new Date("2025-02-15"),
      endDate: new Date("2026-02-25"),
      premium: 450,
      healthPolicyId: sarahHealth.id,
    },
  });

  await prisma.healthInsurance.create({
    data: {
      year: 2025,
      policyNumber: "HL-110678",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-20"),
      premium: 520,
      healthPolicyId: aviHealth.id,
    },
  });

  // --- Pension Policies ---
  const davidPension = await prisma.pensionPolicy.create({
    data: { policyName: "פנסיה מקיפה", provider: "מנורה", clientId: david.id },
  });

  const rachelPension = await prisma.pensionPolicy.create({
    data: { policyName: "קרן פנסיה", provider: "הראל", clientId: rachel.id },
  });

  await prisma.pensionInsurance.create({
    data: {
      year: 2025,
      policyNumber: "PN-220789",
      startDate: new Date("2025-03-01"),
      endDate: new Date("2026-03-05"),
      premium: 380,
      pensionPolicyId: davidPension.id,
    },
  });

  await prisma.pensionInsurance.create({
    data: {
      year: 2025,
      policyNumber: "PN-330890",
      startDate: new Date("2025-02-10"),
      endDate: new Date("2026-02-22"),
      premium: 420,
      pensionPolicyId: rachelPension.id,
    },
  });

  console.log("Mock data created:");
  console.log("  - 7 clients (דוד כהן, שרה כהן, משה לוי, יעל אברהם, אבי לוי, רחל מזרחי, יוסף חדש)");
  console.log("  - 1 family relation (דוד & שרה — spouse)");
  console.log("  - 4 vehicles with insurance (3 expiring Feb 2026, 1 Mar 2026)");
  console.log("  - 3 homes with insurance (2 expiring Feb 2026, 1 Mar 2026)");
  console.log("  - 1 business with insurance (expiring Feb 2026)");
  console.log("  - 2 health policies with insurance (1 expiring Feb 2026, 1 Mar 2026)");
  console.log("  - 2 pension policies with insurance (1 expiring Feb 2026, 1 Mar 2026)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
