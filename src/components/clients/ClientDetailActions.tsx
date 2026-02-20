"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { labels } from "@/lib/utils/hebrew";

export function ClientDetailActions({ clientId }: { clientId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
    if (res.ok) {
      toast("הלקוח נמחק בהצלחה");
      router.push("/clients");
      router.refresh();
    } else {
      toast("שגיאה במחיקת הלקוח", "error");
    }
    setDeleting(false);
  }

  return (
    <>
      <div className="flex gap-2">
        <Link href={`/clients/${clientId}/edit`}>
          <Button variant="secondary">{labels.edit}</Button>
        </Link>
        <Button variant="danger" onClick={() => setShowDelete(true)}>
          {labels.delete}
        </Button>
      </div>
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title={labels.confirmDelete}
        message="האם אתה בטוח שברצונך למחוק לקוח זה? כל הנתונים הקשורים ימחקו."
        loading={deleting}
      />
    </>
  );
}
