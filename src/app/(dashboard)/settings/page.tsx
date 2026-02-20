import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { labels } from "@/lib/utils/hebrew";
import { UserManagement } from "@/components/settings/UserManagement";
import { ChangePassword } from "@/components/settings/ChangePassword";

export default async function SettingsPage() {
  const session = await requireAdmin();

  const users = await prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{labels.settings}</h1>
      <div className="space-y-6 max-w-2xl">
        <ChangePassword />
        <UserManagement initialUsers={users} />
      </div>
    </div>
  );
}
