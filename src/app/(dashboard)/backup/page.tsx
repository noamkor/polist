import { requireAdmin } from "@/lib/dal";
import { labels } from "@/lib/utils/hebrew";
import { BackupButton } from "@/components/backup/BackupButton";

export default async function BackupPage() {
  await requireAdmin();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{labels.backupTitle}</h1>
      <div className="bg-card rounded-xl p-8 shadow-sm border border-border-light max-w-lg">
        <p className="text-muted-foreground mb-6">{labels.backupDescription}</p>
        <BackupButton />
      </div>
    </div>
  );
}
