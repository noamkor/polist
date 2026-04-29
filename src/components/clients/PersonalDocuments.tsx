"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FileUpload } from "@/components/ui/FileUpload";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DocumentsSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { TrashIcon } from "@/components/ui/icons";
import { labels } from "@/lib/utils/hebrew";

interface Document {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  personalDocType: string | null;
  updatedAt: string;
}

interface Props {
  clientId: string;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentRow({
  doc,
  clientId,
  onDelete,
  onReplace,
}: {
  doc: Document;
  clientId: string;
  onDelete: (id: string) => void;
  onReplace?: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm truncate">{doc.fileName}</span>
        <span className="text-sm text-secondary-foreground">{formatFileSize(doc.fileSize)}</span>
      </div>
      <div className="flex gap-1">
        {onReplace && (
          <button
            onClick={onReplace}
            className="text-sm text-primary-600 hover:underline px-2 py-1"
          >
            {labels.replaceFile}
          </button>
        )}
        <a
          href={`/api/documents/${doc.id}/preview?t=${new Date(doc.updatedAt).getTime()}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary-600 hover:underline px-2 py-1"
        >
          {labels.preview}
        </a>
        <a
          href={`/api/documents/${doc.id}?t=${new Date(doc.updatedAt).getTime()}`}
          download
          className="text-sm text-primary-600 hover:underline px-2 py-1"
        >
          {labels.download}
        </a>
        {doc.mimeType === "application/pdf" && (
          <a
            href={`/pdf-editor?documentId=${doc.id}&redirect=/clients/${clientId}&t=${new Date(doc.updatedAt).getTime()}`}
            className="text-sm text-primary-600 hover:underline px-2 py-1"
          >
            {labels.editPdf}
          </a>
        )}
        <button
          onClick={() => onDelete(doc.id)}
          title={labels.delete}
          aria-label={labels.delete}
          className="text-danger-600 hover:bg-accent rounded-md p-1.5 transition-colors"
        >
          <TrashIcon size={16} />
        </button>
      </div>
    </div>
  );
}

function SingleFileSlot({
  label,
  doc,
  clientId,
  onUpload,
  onDelete,
  uploading,
}: {
  label: string;
  doc: Document | null;
  clientId: string;
  onUpload: (file: File) => void;
  onDelete: (id: string) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onUpload(file);
  }

  return (
    <div
      className="border border-border rounded-lg p-4"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <h4 className="text-sm font-bold text-foreground mb-2 -mx-4 -mt-4 px-4 py-2 rounded-t-lg bg-[#f8fafc] dark:bg-foreground/5">{label}</h4>
      {doc ? (
        <DocumentRow doc={doc} clientId={clientId} onDelete={onDelete} onReplace={() => inputRef.current?.click()} />
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-primary-500 bg-[#f8fafc]"
              : "border-input-border hover:border-primary-400 hover:bg-accent"
          }`}
        >
          <p className="text-sm text-muted-foreground">גרור קובץ לכאן או לחץ להעלאה</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
        className="hidden"
      />
      {uploading && <p className="text-sm text-primary-600 mt-2">מעלה...</p>}
    </div>
  );
}

export function PersonalDocuments({ clientId }: Props) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [uploadingOther, setUploadingOther] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/clients/${clientId}`);
    if (res.ok) {
      const data = await res.json();
      setDocuments(data.documents || []);
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const idDoc = documents.find((d) => d.personalDocType === "ID") || null;
  const licenseDoc = documents.find((d) => d.personalDocType === "DRIVER_LICENSE") || null;
  const otherDocs = documents.filter(
    (d) => d.personalDocType !== "ID" && d.personalDocType !== "DRIVER_LICENSE"
  );

  async function uploadFile(file: File, personalDocType: string | null, existingDoc: Document | null) {
    // If replacing, delete existing first
    if (existingDoc) {
      await fetch(`/api/documents/${existingDoc.id}`, { method: "DELETE" });
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("clientId", clientId);
    formData.append("type", "personal");
    if (personalDocType) {
      formData.append("personalDocType", personalDocType);
    }

    const res = await fetch("/api/documents/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      toast(`${file.name} הועלה בהצלחה`);
    } else {
      toast(`שגיאה בהעלאת ${file.name}`, "error");
    }

    fetchDocuments();
  }

  async function handleUploadId(file: File) {
    setUploadingId(true);
    await uploadFile(file, "ID", idDoc);
    setUploadingId(false);
  }

  async function handleUploadLicense(file: File) {
    setUploadingLicense(true);
    await uploadFile(file, "DRIVER_LICENSE", licenseDoc);
    setUploadingLicense(false);
  }

  async function handleUploadOther(files: File[]) {
    setUploadingOther(true);
    for (const file of files) {
      await uploadFile(file, null, null);
    }
    setUploadingOther(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/documents/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast("המסמך נמחק");
      fetchDocuments();
    } else {
      toast("שגיאה במחיקת המסמך", "error");
    }
    setDeleting(false);
    setDeleteId(null);
  }

  if (loading) return <DocumentsSkeleton />;

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border-light">
      <h3 className="font-bold mb-4">{labels.personalDocuments}</h3>

      {/* ID & Driver License - single file each */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <SingleFileSlot
          label={labels.idDocument}
          doc={idDoc}
          clientId={clientId}
          onUpload={handleUploadId}
          onDelete={setDeleteId}
          uploading={uploadingId}
        />
        <SingleFileSlot
          label={labels.driverLicense}
          doc={licenseDoc}
          clientId={clientId}
          onUpload={handleUploadLicense}
          onDelete={setDeleteId}
          uploading={uploadingLicense}
        />
      </div>

      {/* Other personal documents - unlimited */}
      <div className="border border-border rounded-lg p-4">
        <h4 className="text-sm font-bold text-foreground mb-2 -mx-4 -mt-4 px-4 py-2 rounded-t-lg bg-[#f8fafc] dark:bg-foreground/5">{labels.otherDocuments}</h4>

        {otherDocs.length > 0 && (
          <div className="space-y-2 mb-4">
            {otherDocs.map((doc) => (
              <DocumentRow key={doc.id} doc={doc} clientId={clientId} onDelete={setDeleteId} />
            ))}
          </div>
        )}

        <FileUpload onUpload={handleUploadOther} />
        {uploadingOther && <p className="text-sm text-primary-600 mt-2">מעלה קבצים...</p>}
      </div>

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
