"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { labels } from "@/lib/utils/hebrew";

export function BackupButton() {
  const [loading, setLoading] = useState(false);

  async function handleBackup() {
    setLoading(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("Backup failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `polist-backup-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("שגיאה ביצירת הגיבוי");
    }
    setLoading(false);
  }

  return (
    <Button onClick={handleBackup} loading={loading} size="lg">
      {loading ? labels.backupInProgress : labels.downloadBackup}
    </Button>
  );
}
