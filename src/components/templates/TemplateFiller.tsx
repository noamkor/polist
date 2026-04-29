"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PDFiumDocument } from "@hyzyla/pdfium";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { getPdfiumLibrary } from "@/lib/pdfium-loader";
import { labels } from "@/lib/utils/hebrew";
import { sanitizeFileNameInput } from "@/lib/utils/file-name";
import type { TemplateField } from "@/lib/template-types";
import { TemplatePreviewPage } from "./TemplatePreviewPage";
import { AttachToClientDialog } from "./AttachToClientDialog";

interface Props {
  templateId: string;
  templateName: string;
}

const RENDER_SCALE = 1.5;

export function TemplateFiller({ templateId, templateName }: Props) {
  const { toast } = useToast();
  const [pdfDoc, setPdfDoc] = useState<PDFiumDocument | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");
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
      const f: TemplateField[] = Array.isArray(tplData.fields) ? tplData.fields : [];
      setFields(f);
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

  const orderedTextFields = useMemo(() => {
    return fields
      .filter((f) => f.kind === "text")
      .sort((a, b) => {
        if (a.pageIndex !== b.pageIndex) return a.pageIndex - b.pageIndex;
        if (Math.abs(a.y - b.y) > 5) return a.y - b.y;
        return a.dir === "rtl" ? b.x - a.x : a.x - b.x;
      });
  }, [fields]);

  async function handleDownload() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/templates/${templateId}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values, fileName: saveAsName.trim() || templateName }),
      });
      if (!res.ok) throw new Error("Render failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const finalName = (saveAsName.trim() || templateName).replace(/\.pdf$/i, "") + ".pdf";
      a.download = finalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast(labels.pdfSaved);
      setShowSaveAs(false);
    } catch (err) {
      console.error(err);
      toast(labels.pdfSaveError, "error");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (!pdfDoc) {
    return <div className="text-center text-muted-foreground py-12">לא ניתן לטעון את התבנית</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-card border-b border-border sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
        <span className="font-bold">{templateName}</span>
        <span className="text-muted-foreground text-sm">·</span>
        <span className="text-sm text-muted-foreground">{orderedTextFields.length} שדות</span>
        <div className="flex-1" />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAttach(true)}
          disabled={generating}
        >
          {labels.saveAndAttach}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setSaveAsName(templateName);
            setShowSaveAs(true);
          }}
          disabled={generating}
        >
          {labels.generatePdf}
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-s border-border bg-card overflow-y-auto p-4 space-y-3">
          {orderedTextFields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {labels.templateNoFields}
            </p>
          ) : (
            orderedTextFields.map((f, idx) => (
              <div key={f.id}>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {f.label || `שדה ${idx + 1}`}
                </label>
                <input
                  type="text"
                  value={values[f.id] || ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
                  dir={f.dir}
                  className="w-full px-3 py-2 rounded-lg border border-input-border bg-card focus:ring-primary-500 focus:border-primary-500 outline-none focus:ring-2 text-sm"
                />
              </div>
            ))
          )}
        </aside>

        <div className="flex-1 overflow-auto bg-muted/30 p-4">
          {Array.from({ length: pageCount }).map((_, i) => (
            <TemplatePreviewPage
              key={i}
              pdfDoc={pdfDoc}
              pageIndex={i}
              scale={RENDER_SCALE}
              fields={fields}
              values={values}
            />
          ))}
        </div>
      </div>

      <Modal
        open={showSaveAs}
        onClose={() => setShowSaveAs(false)}
        title={labels.saveAsTitle}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleDownload();
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
            <Button type="button" variant="secondary" onClick={() => setShowSaveAs(false)}>
              {labels.cancel}
            </Button>
            <Button type="submit" loading={generating}>
              {labels.download}
            </Button>
          </div>
        </form>
      </Modal>

      <AttachToClientDialog
        open={showAttach}
        onClose={() => setShowAttach(false)}
        templateId={templateId}
        templateName={templateName}
        values={values}
      />
    </div>
  );
}
