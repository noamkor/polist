import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcryptjs from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username, password, name, role } = await request.json();

  if (!username || !password || !name) {
    return NextResponse.json({ error: "חסרים שדות חובה" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "שם משתמש כבר קיים" }, { status: 409 });
  }

  const hashedPassword = await bcryptjs.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      username,
      hashedPassword,
      name,
      role: role || "AGENT",
    },
    select: { id: true, username: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
