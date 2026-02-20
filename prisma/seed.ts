import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
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
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
