"use client";

import { Button } from "@/components/ui/Button";
import { labels } from "@/lib/utils/hebrew";
import { TextBox, ElementKind } from "./types";

interface Props {
  fileName: string | null;
  onUploadClick: () => void;
  hideUpload?: boolean;
  selected: TextBox | null;
  onUpdateSelected: (patch: Partial<TextBox>) => void;
  onDeleteSelected: () => void;
  onSave: () => void;
  saving: boolean;
  saveLabel: string;
  pageInfo?: { current: number; total: number };
  mode: ElementKind;
  onModeChange: (mode: ElementKind) => void;
}

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

export function EditorToolbar({
  fileName,
  onUploadClick,
  hideUpload,
  selected,
  onUpdateSelected,
  onDeleteSelected,
  onSave,
  saving,
  saveLabel,
  pageInfo,
  mode,
  onModeChange,
}: Props) {
  const sizeLabel =
    selected?.kind === "x" ? labels.size : labels.fontSize;

  return (
    <div className="bg-card border-b border-border sticky top-0 z-10">
      <div className="px-4 py-3 flex flex-wrap items-center gap-3">
        {!hideUpload && (
          <>
            <Button variant="secondary" size="sm" onClick={onUploadClick}>
              {labels.uploadPdf}
            </Button>
            <div className="h-6 w-px bg-border" />
          </>
        )}

        <div className="flex rounded-md overflow-hidden border border-input-border">
          <button
            type="button"
            onClick={() => onModeChange("text")}
            className={`px-3 py-1 text-sm font-medium transition-colors ${
              mode === "text"
                ? "bg-primary-600 text-white"
                : "bg-card text-foreground hover:bg-accent"
            }`}
          >
            {labels.textMode}
          </button>
          <button
            type="button"
            onClick={() => onModeChange("x")}
            className={`px-3 py-1 text-sm font-bold transition-colors border-s border-input-border ${
              mode === "x"
                ? "bg-primary-600 text-white"
                : "bg-card text-foreground hover:bg-accent"
            }`}
            title={labels.xMark}
          >
            ✕
          </button>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">{sizeLabel}</label>
          <select
            disabled={!selected}
            value={selected?.fontSize ?? 14}
            onChange={(e) => onUpdateSelected({ fontSize: parseInt(e.target.value) })}
            className="rounded-md border border-input-border bg-card px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          disabled={!selected || selected.kind === "x"}
          onClick={() => onUpdateSelected({ bold: !selected?.bold })}
          className={`px-3 py-1 rounded-md text-sm font-bold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            selected?.bold
              ? "bg-primary-600 text-white border-primary-600"
              : "bg-card text-foreground border-input-border hover:bg-accent"
          }`}
          title={labels.bold}
        >
          B
        </button>

        <label
          className={`flex items-center gap-1 px-2 py-1 rounded-md border border-input-border bg-card text-sm transition-colors ${
            selected ? "hover:bg-accent cursor-pointer" : "opacity-50 cursor-not-allowed"
          }`}
          title={labels.color}
        >
          <span className="text-muted-foreground">{labels.color}</span>
          <input
            type="color"
            disabled={!selected}
            value={selected?.color ?? "#000000"}
            onChange={(e) => onUpdateSelected({ color: e.target.value })}
            className="w-6 h-6 p-0 border-none cursor-pointer disabled:cursor-not-allowed bg-transparent"
            style={{ appearance: "none" }}
          />
        </label>

        <button
          type="button"
          disabled={!selected}
          onClick={onDeleteSelected}
          className="px-3 py-1 rounded-md text-sm border border-input-border bg-card text-danger-600 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {labels.deleteTextBox}
        </button>

        <div className="flex-1" />

        {pageInfo && (
          <span className="text-sm text-muted-foreground">
            {labels.page} {pageInfo.current} {labels.of} {pageInfo.total}
          </span>
        )}

        <Button
          variant="primary"
          size="sm"
          onClick={onSave}
          loading={saving}
          disabled={!fileName}
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
