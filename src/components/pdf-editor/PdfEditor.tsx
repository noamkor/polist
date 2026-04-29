"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFiumDocument } from "@hyzyla/pdfium";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { labels } from "@/lib/utils/hebrew";
import { sanitizeFileNameInput } from "@/lib/utils/file-name";
import { getPdfiumLibrary } from "@/lib/pdfium-loader";
import { TextBox, ElementKind } from "./types";
import { EditorToolbar } from "./EditorToolbar";
import { PdfPage } from "./PdfPage";

interface Props {
  initialDocumentId?: string;
  redirectAfterSave?: string;
}

const RENDER_SCALE = 2;

export function PdfEditor({ initialDocumentId, redirectAfterSave }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFiumDocument | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [mode, setMode] = useState<ElementKind>("text");
  const [showSavedDialog, setShowSavedDialog] = useState(false);
  const [saveAsBlob, setSaveAsBlob] = useState<Blob | null>(null);
  const [saveAsName, setSaveAsName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<PDFiumDocument | null>(null);

  const loadPdfFromBytes = useCallback(async (bytes: Uint8Array, name: string, initialBoxes: TextBox[] = []) => {
    setLoading(true);
    try {
      const library = await getPdfiumLibrary();

      if (docRef.current) {
        docRef.current.destroy();
        docRef.current = null;
      }

      const doc = await library.loadDocument(bytes.slice(0));
      docRef.current = doc;

      setPdfBytes(bytes);
      setPdfDoc(doc);
      setPageCount(doc.getPageCount());
      setFileName(name);
      setTextBoxes(initialBoxes);
      setSelectedId(null);
      setCurrentPage(0);
    } catch (err) {
      console.error(err);
      toast("שגיאה בטעינת קובץ ה-PDF", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    return () => {
      if (docRef.current) {
        docRef.current.destroy();
        docRef.current = null;
      }
    };
  }, []);

  const keyStateRef = useRef({ selectedId, textBoxes });
  keyStateRef.current = { selectedId, textBoxes };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isInEditable =
        target?.tagName === "TEXTAREA" || target?.tagName === "INPUT";

      if (e.key === "Escape") {
        if (isInEditable) {
          (target as HTMLElement).blur();
          e.preventDefault();
        } else if (keyStateRef.current.selectedId) {
          setSelectedId(null);
          e.preventDefault();
        }
        return;
      }

      if (e.key === "Delete") {
        const { selectedId } = keyStateRef.current;
        if (!selectedId) return;

        e.preventDefault();
        if (isInEditable) {
          (target as HTMLElement).blur();
        }
        setTextBoxes((prev) => prev.filter((b) => b.id !== selectedId));
        setSelectedId(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!initialDocumentId) return;

    async function loadExisting() {
      setLoading(true);
      try {
        const [editDataRes, pdfRes] = await Promise.all([
          fetch(`/api/documents/${initialDocumentId}/edit-data?t=${Date.now()}`, {
            cache: "no-store",
          }),
          fetch(`/api/documents/${initialDocumentId}/preview?original=1&t=${Date.now()}`, {
            cache: "no-store",
          }),
        ]);
        if (!pdfRes.ok) throw new Error("Failed to fetch document");
        const editData = editDataRes.ok ? await editDataRes.json() : { boxes: [], fileName: "document.pdf" };
        const blob = await pdfRes.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const rawBoxes: Partial<TextBox>[] = Array.isArray(editData.boxes) ? editData.boxes : [];
        const savedBoxes: TextBox[] = rawBoxes.map((b, i) => ({
          id: b.id || `tb-loaded-${Date.now()}-${i}`,
          pageIndex: b.pageIndex ?? 0,
          x: b.x ?? 0,
          y: b.y ?? 0,
          fontSize: b.fontSize ?? 14,
          bold: !!b.bold,
          text: b.text ?? "",
          dir: b.dir === "ltr" ? "ltr" : "rtl",
          kind: b.kind === "x" ? "x" : "text",
          color: b.color || "#000000",
        }));
        await loadPdfFromBytes(new Uint8Array(arrayBuffer), editData.fileName || "document.pdf", savedBoxes);
      } catch (err) {
        console.error(err);
        toast("שגיאה בטעינת המסמך", "error");
        setLoading(false);
      }
    }

    loadExisting();
  }, [initialDocumentId, loadPdfFromBytes, toast]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast("יש לבחור קובץ PDF", "error");
      return;
    }
    file.arrayBuffer().then((buf) => {
      loadPdfFromBytes(new Uint8Array(buf), file.name);
    });
  }

  function addTextBox(pageIndex: number, x: number, y: number): string {
    const id = `tb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newBox: TextBox =
      mode === "x"
        ? {
            id,
            pageIndex,
            x,
            y,
            fontSize: 10,
            bold: true,
            text: "",
            dir: "ltr",
            kind: "x",
            color: "#000000",
          }
        : {
            id,
            pageIndex,
            x,
            y,
            fontSize: 14,
            bold: false,
            text: "",
            dir: "rtl",
            kind: "text",
            color: "#000000",
          };
    setTextBoxes((prev) => [...prev, newBox]);
    setSelectedId(id);
    return id;
  }

  function updateTextBox(id: string, patch: Partial<TextBox>) {
    setTextBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function deleteSelected() {
    if (!selectedId) return;
    setTextBoxes((prev) => prev.filter((b) => b.id !== selectedId));
    setSelectedId(null);
  }

  const selected = textBoxes.find((b) => b.id === selectedId) || null;

  async function handleSave() {
    if (!pdfBytes) return;
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("pdf", new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" }), fileName || "document.pdf");
      formData.append("textBoxes", JSON.stringify(textBoxes));
      formData.append("fileName", fileName || "document.pdf");
      if (initialDocumentId) {
        formData.append("documentId", initialDocumentId);
      }

      const res = await fetch("/api/pdf-editor/save", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Save failed");
      }

      if (initialDocumentId) {
        const result = await res.json().catch(() => ({}));
        const count = result.boxesSaved;
        toast(
          typeof count === "number"
            ? `${labels.pdfSaved} (${count} שדות)`
            : labels.pdfSaved
        );
        if (redirectAfterSave) {
          setShowSavedDialog(true);
        } else {
          router.refresh();
        }
      } else {
        const blob = await res.blob();
        const defaultName = fileName
          ? fileName.replace(/\.pdf$/i, "") + "-edited"
          : "edited";
        setSaveAsBlob(blob);
        setSaveAsName(defaultName);
      }
    } catch (err) {
      console.error(err);
      toast(labels.pdfSaveError, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {pdfDoc && (
        <EditorToolbar
          fileName={fileName}
          onUploadClick={() => fileInputRef.current?.click()}
          hideUpload
          selected={selected}
          onUpdateSelected={(patch) => selectedId && updateTextBox(selectedId, patch)}
          onDeleteSelected={deleteSelected}
          onSave={handleSave}
          saving={saving}
          saveLabel={initialDocumentId ? labels.replaceOriginal : labels.downloadPdf}
          pageInfo={{ current: currentPage + 1, total: pageCount }}
          mode={mode}
          onModeChange={setMode}
        />
      )}

      <div
        className="flex-1 overflow-auto bg-muted/30 p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setSelectedId(null);
        }}
      >
        {loading && (
          <div className="flex items-center justify-center h-64">
            <Spinner />
          </div>
        )}

        {!loading && !pdfDoc && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-muted-foreground mb-4">{labels.selectPdfFile}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {labels.uploadPdf}
            </button>
          </div>
        )}

        {!loading && pdfDoc && (
          <div>
            {Array.from({ length: pageCount }).map((_, i) => (
              <PdfPage
                key={i}
                pdfDoc={pdfDoc}
                pageIndex={i}
                scale={RENDER_SCALE}
                textBoxes={textBoxes.filter((b) => b.pageIndex === i)}
                selectedId={selectedId}
                mode={mode}
                onAddTextBox={addTextBox}
                onSelectTextBox={setSelectedId}
                onChangeTextBox={updateTextBox}
                onCommitTextBox={() => {}}
                onPageVisible={setCurrentPage}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showSavedDialog}
        onClose={() => setShowSavedDialog(false)}
        title={labels.pdfSavedTitle}
      >
        <p className="text-sm text-muted-foreground mb-6">
          {labels.pdfSavedQuestion}
        </p>
        <div className="flex gap-2 justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              setShowSavedDialog(false);
              router.refresh();
            }}
          >
            {labels.keepEditing}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowSavedDialog(false);
              if (redirectAfterSave) {
                router.push(redirectAfterSave);
                router.refresh();
              }
            }}
          >
            {labels.returnToClient}
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!saveAsBlob}
        onClose={() => setSaveAsBlob(null)}
        title={labels.saveAsTitle}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!saveAsBlob) return;
            const trimmed = saveAsName.trim() || "edited";
            const finalName = trimmed.toLowerCase().endsWith(".pdf")
              ? trimmed
              : trimmed + ".pdf";
            const url = URL.createObjectURL(saveAsBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = finalName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setSaveAsBlob(null);
            toast(labels.pdfSaved);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {labels.saveAsLabel}
            </label>
            <div className="flex items-center gap-2">
              <span dir="ltr" className="text-sm text-muted-foreground">.pdf</span>
              <input
                type="text"
                value={saveAsName}
                onChange={(e) => setSaveAsName(sanitizeFileNameInput(e.target.value))}
                autoFocus
                dir="ltr"
                className="flex-1 px-3 py-2 rounded-lg border border-input-border bg-card focus:ring-primary-500 focus:border-primary-500 outline-none focus:ring-2 text-left"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSaveAsBlob(null)}
            >
              {labels.cancel}
            </Button>
            <Button type="submit" variant="primary">
              {labels.download}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
