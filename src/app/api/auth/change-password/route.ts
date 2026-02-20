import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcryptjs from "bcryptjs";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "חסרים שדות" }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "הסיסמה חייבת להכיל לפחות 6 תווים" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
  }

  const isValid = await bcryptjs.compare(currentPassword, user.hashedPassword);
  if (!isValid) {
    return NextResponse.json({ error: "סיסמה נוכחית שגויה" }, { status: 400 });
  }

  const hashedPassword = await bcryptjs.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { hashedPassword },
  });

  return NextResponse.json({ success: true });
}
