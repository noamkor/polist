"use client";

import { useState } from "react";
import { FileUpload } from "@/components/ui/FileUpload";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { labels } from "@/lib/utils/hebrew";

interface Document {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

interface Props {
  clientId: string;
  assetId: string;
  recordId: string;
  year: number;
  insuranceType: string;
  category: string;
  documents: Document[];
  onDocumentsChange: () => void;
}

export function DocumentUploadPanel({
  clientId,
  assetId,
  recordId,
  year,
  insuranceType,
  category,
  documents,
  onDocumentsChange,
}: Props) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleUpload(files: File[]) {
    setUploading(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("clientId", clientId);
      formData.append("type", insuranceType);
      formData.append("recordId", recordId);
      formData.append("assetId", assetId);
      formData.append("year", String(year));
      formData.append("category", category);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast(`${file.name} הועלה בהצלחה`);
      } else {
        toast(`שגיאה בהעלאת ${file.name}`, "error");
      }
    }
    setUploading(false);
    onDocumentsChange();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/documents/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast("המסמך נמחק");
      onDocumentsChange();
    } else {
      toast("שגיאה במחיקת המסמך", "error");
    }
    setDeleting(false);
    setDeleteId(null);
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getFileIcon(mimeType: string) {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType === "application/pdf") return "📄";
    return "📎";
  }

  return (
    <div className="mt-3">
      <h4 className="text-sm font-medium text-foreground mb-2">{labels.documents}</h4>

      {documents.length > 0 && (
        <div className="space-y-1 mb-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span>{getFileIcon(doc.mimeType)}</span>
                <span className="text-sm truncate">{doc.fileName}</span>
                <span className="text-sm text-secondary-foreground">{formatFileSize(doc.fileSize)}</span>
              </div>
              <div className="flex gap-1">
                <a
                  href={`/api/documents/${doc.id}/preview`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:underline px-2 py-1"
                >
                  {labels.preview}
                </a>
                <a
                  href={`/api/documents/${doc.id}`}
                  download
                  className="text-sm text-primary-600 hover:underline px-2 py-1"
                >
                  {labels.download}
                </a>
                <button
                  onClick={() => setDeleteId(doc.id)}
                  className="text-sm text-danger-600 hover:underline px-2 py-1"
                >
                  {labels.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FileUpload onUpload={handleUpload} />
      {uploading && (
        <p className="text-sm text-primary-600 mt-2">מעלה קבצים...</p>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={labels.confirmDelete}
        message="האם למחוק מסמך זה?"
        loading={deleting}
      />
    </div>
  );
}
