"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFiumDocument } from "@hyzyla/pdfium";
import type { TemplateField } from "@/lib/template-types";

interface Props {
  pdfDoc: PDFiumDocument;
  pageIndex: number;
  scale: number;
  fields: TemplateField[];
  values: Record<string, string>;
}

export function TemplatePreviewPage({
  pdfDoc,
  pageIndex,
  scale,
  fields,
  values,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<{ width: number; height: number; pdfWidth: number; pdfHeight: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const page = pdfDoc.getPage(pageIndex);
        const { originalWidth, originalHeight } = page.getOriginalSize();
        const result = await page.render({ scale });
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = result.width;
        canvas.height = result.height;
        canvas.style.width = `${result.width}px`;
        canvas.style.height = `${result.height}px`;

        const imageData = ctx.createImageData(result.width, result.height);
        const src = result.data;
        const dst = imageData.data;
        for (let i = 0; i < src.length; i += 4) {
          dst[i] = src[i + 2];
          dst[i + 1] = src[i + 1];
          dst[i + 2] = src[i];
          dst[i + 3] = src[i + 3];
        }
        ctx.putImageData(imageData, 0, 0);

        setSize({
          width: result.width,
          height: result.height,
          pdfWidth: originalWidth,
          pdfHeight: originalHeight,
        });
      } catch (err) {
        console.error(err);
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageIndex, scale]);

  const displayScale = size ? size.width / size.pdfWidth : 1;
  const pageFields = fields.filter((f) => f.pageIndex === pageIndex);

  return (
    <div className="flex justify-center mb-4">
      <div
        className="relative shadow-lg bg-white"
        style={{ width: size?.width, height: size?.height, minHeight: !size ? 400 : undefined }}
      >
        <canvas ref={canvasRef} className="block" />
        {size &&
          pageFields.map((f) => {
            const value = values[f.id] || "";
            if (f.kind === "x") {
              const sizePx = f.fontSize * displayScale;
              const strokeWidth = Math.max(2, sizePx / 8);
              return (
                <svg
                  key={f.id}
                  width={sizePx}
                  height={sizePx}
                  viewBox="0 0 100 100"
                  className="absolute pointer-events-none"
                  style={{
                    left: f.x * displayScale,
                    top: f.y * displayScale,
                  }}
                >
                  <line x1="10" y1="10" x2="90" y2="90" stroke={f.color} strokeWidth={strokeWidth * (100 / sizePx)} strokeLinecap="round" />
                  <line x1="90" y1="10" x2="10" y2="90" stroke={f.color} strokeWidth={strokeWidth * (100 / sizePx)} strokeLinecap="round" />
                </svg>
              );
            }
            const isRtl = f.dir === "rtl";
            const displayFontSize = f.fontSize * displayScale;
            return (
              <div
                key={f.id}
                className="absolute pointer-events-none"
                style={{
                  left: isRtl ? undefined : f.x * displayScale,
                  right: isRtl ? size.width - f.x * displayScale : undefined,
                  top: f.y * displayScale,
                  fontSize: `${displayFontSize}px`,
                  fontWeight: f.bold ? 700 : 400,
                  fontFamily: "var(--font-heebo, sans-serif)",
                  lineHeight: 1.2,
                  color: f.color,
                  whiteSpace: "pre",
                  direction: f.dir,
                  textAlign: isRtl ? "right" : "left",
                }}
              >
                {value || (
                  <span style={{ opacity: 0.25, fontStyle: "italic" }}>{f.label}</span>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
