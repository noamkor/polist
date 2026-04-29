"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { labels } from "@/lib/utils/hebrew";

export function NewTemplateForm() {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !name.trim()) {
      toast("יש לבחור קובץ ולתת שם", "error");
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", name.trim());
    if (description.trim()) fd.append("description", description.trim());

    const res = await fetch("/api/templates", { method: "POST", body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast(err.error || "שגיאה ביצירת התבנית", "error");
      setSubmitting(false);
      return;
    }
    const created = await res.json();
    router.push(`/templates/${created.id}/edit`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label={labels.templateName}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        label={labels.templateDescription}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          קובץ PDF
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-muted-foreground file:me-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-600 file:text-white hover:file:bg-primary-700 file:cursor-pointer"
        />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="submit" loading={submitting} disabled={!file || !name.trim()}>
          {labels.create} →
        </Button>
      </div>
    </form>
  );
}
