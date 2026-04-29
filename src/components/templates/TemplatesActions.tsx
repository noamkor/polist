"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { TrashIcon } from "@/components/ui/icons";
import { labels } from "@/lib/utils/hebrew";

export function TemplatesActions({ templateId }: { templateId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/templates/${templateId}`, { method: "DELETE" });
    if (res.ok) {
      toast("התבנית נמחקה");
      router.refresh();
    } else {
      toast("שגיאה במחיקת התבנית", "error");
    }
    setDeleting(false);
    setShowDelete(false);
  }

  return (
    <>
      <button
        onClick={() => setShowDelete(true)}
        title={labels.delete}
        aria-label={labels.delete}
        className="px-3 py-2 rounded-md text-danger-600 hover:bg-accent"
      >
        <TrashIcon size={16} />
      </button>
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title={labels.confirmDelete}
        message="האם למחוק את התבנית?"
        loading={deleting}
      />
    </>
  );
}
