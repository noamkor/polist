import { cache } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const verifySession = cache(async () => {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
});

export const requireAdmin = cache(async () => {
  const session = await verifySession();

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return session;
});

export const getSession = cache(async () => {
  return await auth();
});
