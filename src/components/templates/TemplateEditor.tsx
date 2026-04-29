"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFiumDocument } from "@hyzyla/pdfium";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { getPdfiumLibrary } from "@/lib/pdfium-loader";
import { labels } from "@/lib/utils/hebrew";
import { TextBox, ElementKind } from "@/components/pdf-editor/types";
import { EditorToolbar } from "@/components/pdf-editor/EditorToolbar";
import { PdfPage } from "@/components/pdf-editor/PdfPage";
import type { TemplateField } from "@/lib/template-types";

interface Props {
  templateId: string;
  templateName: string;
}

const RENDER_SCALE = 2;

function fieldsToBoxes(fields: TemplateField[]): TextBox[] {
  return fields.map((f) => ({
    id: f.id,
    pageIndex: f.pageIndex,
    x: f.x,
    y: f.y,
    fontSize: f.fontSize,
    bold: f.bold,
    text: f.label,
    dir: f.dir,
    kind: f.kind,
    color: f.color,
  }));
}

function boxesToFields(boxes: TextBox[]): TemplateField[] {
  return boxes.map((b) => ({
    id: b.id,
    label: b.text,
    pageIndex: b.pageIndex,
    x: b.x,
    y: b.y,
    fontSize: b.fontSize,
    bold: b.bold,
    dir: b.dir,
    color: b.color,
    kind: b.kind,
  }));
}

export function TemplateEditor({ templateId, templateName }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [pdfDoc, setPdfDoc] = useState<PDFiumDocument | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [mode, setMode] = useState<ElementKind>("text");
  const docRef = useRef<PDFiumDocument | null>(null);

  useEffect(() => {
    return () => {
      if (docRef.current) {
        docRef.current.destroy();
        docRef.current = null;
      }
    };
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [tplRes, pdfRes] = await Promise.all([
        fetch(`/api/templates/${templateId}`, { cache: "no-store" }),
        fetch(`/api/templates/${templateId}/pdf`, { cache: "no-store" }),
      ]);
      if (!tplRes.ok || !pdfRes.ok) throw new Error("Load failed");
      const tplData = await tplRes.json();
      const pdfBuf = new Uint8Array(await pdfRes.arrayBuffer());

      const library = await getPdfiumLibrary();
      if (docRef.current) docRef.current.destroy();
      const doc = await library.loadDocument(pdfBuf.slice(0));
      docRef.current = doc;

      setPdfDoc(doc);
      setPageCount(doc.getPageCount());
      const fields: TemplateField[] = Array.isArray(tplData.fields) ? tplData.fields : [];
      setTextBoxes(fieldsToBoxes(fields));
    } catch (err) {
      console.error(err);
      toast("שגיאה בטעינת התבנית", "error");
    } finally {
      setLoading(false);
    }
  }, [templateId, toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const keyStateRef = useRef({ selectedId, textBoxes });
  keyStateRef.current = { selectedId, textBoxes };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isInEditable = target?.tagName === "TEXTAREA" || target?.tagName === "INPUT";
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
        if (isInEditable) (target as HTMLElement).blur();
        setTextBoxes((prev) => prev.filter((b) => b.id !== selectedId));
        setSelectedId(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function addTextBox(pageIndex: number, x: number, y: number): string {
    const id = `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newBox: TextBox =
      mode === "x"
        ? { id, pageIndex, x, y, fontSize: 10, bold: true, text: "", dir: "ltr", kind: "x", color: "#000000" }
        : { id, pageIndex, x, y, fontSize: 14, bold: false, text: "", dir: "rtl", kind: "text", color: "#000000" };
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
    setSaving(true);
    try {
      const fields = boxesToFields(textBoxes);
      const res = await fetch(`/api/templates/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast("התבנית נשמרה");
      router.push("/templates");
    } catch (err) {
      console.error(err);
      toast("שגיאה בשמירה", "error");
    } finally {
      setSaving(false);
    }
  }

  const textFields = textBoxes.filter((b) => b.kind === "text");

  return (
    <div className="flex flex-col h-full">
      {pdfDoc && (
        <EditorToolbar
          fileName={templateName}
          onUploadClick={() => {}}
          hideUpload
          selected={selected}
          onUpdateSelected={(patch) => selectedId && updateTextBox(selectedId, patch)}
          onDeleteSelected={deleteSelected}
          onSave={handleSave}
          saving={saving}
          saveLabel={labels.save}
          pageInfo={{ current: currentPage + 1, total: pageCount }}
          mode={mode}
          onModeChange={setMode}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-72 border-s border-border bg-card overflow-y-auto p-4">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="font-bold text-sm">{templateName}</h3>
            <span className="text-xs text-muted-foreground">
              {textFields.length} שדות
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            לחץ על העמוד כדי להוסיף שדה, ושמור כאן את שם השדה.
          </p>
          {textFields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              אין שדות עדיין
            </p>
          ) : (
            <div className="space-y-2">
              {textFields.map((b, i) => (
                <div
                  key={b.id}
                  className={`p-2 rounded-md border ${
                    selectedId === b.id
                      ? "border-primary-500 bg-primary-500/5"
                      : "border-border-light hover:border-border"
                  }`}
                  onClick={() => setSelectedId(b.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-muted-foreground w-5">
                      {i + 1}.
                    </span>
                    <input
                      type="text"
                      value={b.text}
                      onChange={(e) => updateTextBox(b.id, { text: e.target.value })}
                      onFocus={() => setSelectedId(b.id)}
                      placeholder="שם השדה"
                      dir="rtl"
                      className="flex-1 px-2 py-1 rounded border border-input-border bg-card focus:ring-primary-500 focus:border-primary-500 outline-none focus:ring-1 text-sm"
                    />
                  </div>
                  <div className="text-[11px] text-muted-foreground ms-7">
                    עמוד {b.pageIndex + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

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
      </div>
    </div>
  );
}
