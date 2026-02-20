"use client";

import { useRef, useState, DragEvent } from "react";
import { labels } from "@/lib/utils/hebrew";

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
}

export function FileUpload({
  onUpload,
  accept = ".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx",
  multiple = true,
  maxSizeMB = 50,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const valid = Array.from(files).filter(
      (f) => f.size <= maxSizeMB * 1024 * 1024
    );
    if (valid.length > 0) onUpload(valid);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        dragOver
          ? "border-primary-500 bg-primary-500/10"
          : "border-input-border hover:border-primary-400 hover:bg-accent"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <svg
        className="mx-auto h-10 w-10 text-secondary-foreground mb-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>
      <p className="text-sm text-muted-foreground">
        גרור קבצים לכאן או לחץ {labels.upload}
      </p>
      <p className="text-sm text-secondary-foreground mt-1">
        PDF, תמונות, Word, Excel (עד {maxSizeMB}MB)
      </p>
    </div>
  );
}
