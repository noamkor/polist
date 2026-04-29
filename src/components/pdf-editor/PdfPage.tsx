"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFiumDocument } from "@hyzyla/pdfium";
import { TextBox, ElementKind } from "./types";
import { TextBoxOverlay } from "./TextBoxOverlay";

interface Props {
  pdfDoc: PDFiumDocument;
  pageIndex: number;
  scale: number;
  textBoxes: TextBox[];
  selectedId: string | null;
  mode: ElementKind;
  onAddTextBox: (pageIndex: number, x: number, y: number) => string;
  onSelectTextBox: (id: string | null) => void;
  onChangeTextBox: (id: string, patch: Partial<TextBox>) => void;
  onCommitTextBox: () => void;
  onPageVisible?: (pageIndex: number) => void;
}

export function PdfPage({
  pdfDoc,
  pageIndex,
  scale,
  textBoxes,
  selectedId,
  mode,
  onAddTextBox,
  onSelectTextBox,
  onChangeTextBox,
  onCommitTextBox,
  onPageVisible,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number; pdfWidth: number; pdfHeight: number } | null>(null);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      setRendering(true);
      try {
        const page = pdfDoc.getPage(pageIndex);
        const { originalWidth, originalHeight } = page.getOriginalSize();

        const result = await page.render({ scale });
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = result.width;
        canvas.height = result.height;
        canvas.style.width = `${result.width}px`;
        canvas.style.height = `${result.height}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

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
        console.error(`Render error on page ${pageIndex}:`, err);
      } finally {
        if (!cancelled) setRendering(false);
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageIndex, scale]);

  useEffect(() => {
    if (!wrapperRef.current || !onPageVisible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onPageVisible(pageIndex);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [pageIndex, onPageVisible]);

  function handleMouseDown(e: React.MouseEvent) {
    if (!wrapperRef.current || !size) return;
    if (e.button !== 0) return;
    if (e.target !== wrapperRef.current && e.target !== canvasRef.current) return;

    if (selectedId) {
      onSelectTextBox(null);
      return;
    }

    const rect = wrapperRef.current.getBoundingClientRect();
    const displayScale = size.width / size.pdfWidth;
    const pixelX = e.clientX - rect.left;
    const pixelY = e.clientY - rect.top;
    const clickPdfX = pixelX / displayScale;
    const clickPdfY = pixelY / displayScale;
    const id = onAddTextBox(pageIndex, clickPdfX, clickPdfY);

    e.preventDefault();
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    let anchorX = clickPdfX;
    let anchorY = clickPdfY;

    requestAnimationFrame(() => {
      const boxEl = wrapperRef.current?.querySelector(
        `[data-box-id="${id}"]`
      ) as HTMLElement | null;
      if (boxEl) {
        const w = boxEl.offsetWidth / displayScale;
        const h = boxEl.offsetHeight / displayScale;
        anchorX = mode === "x" ? clickPdfX - w / 2 : clickPdfX + w / 2;
        anchorY = clickPdfY - h / 2;
        onChangeTextBox(id, { x: anchorX, y: anchorY });
      }
    });

    function onMove(ev: MouseEvent) {
      const dx = (ev.clientX - startMouseX) / displayScale;
      const dy = (ev.clientY - startMouseY) / displayScale;
      let newX = anchorX + dx;
      let newY = anchorY + dy;
      if (size) {
        const boxEl = wrapperRef.current?.querySelector(
          `[data-box-id="${id}"]`
        ) as HTMLElement | null;
        if (boxEl) {
          const boxW = boxEl.offsetWidth / displayScale;
          const boxH = boxEl.offsetHeight / displayScale;
          const isRtlBox = mode !== "x";
          const minX = isRtlBox ? boxW : 0;
          const maxX = isRtlBox ? size.pdfWidth : size.pdfWidth - boxW;
          const minY = 0;
          const maxY = size.pdfHeight - boxH;
          newX = Math.min(Math.max(newX, minX), Math.max(maxX, minX));
          newY = Math.min(Math.max(newY, minY), Math.max(maxY, minY));
        }
      }
      onChangeTextBox(id, { x: newX, y: newY });
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      onCommitTextBox();
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const displayScale = size ? size.width / size.pdfWidth : 1;

  return (
    <div className="flex justify-center mb-4">
      <div
        ref={wrapperRef}
        className="relative shadow-lg bg-white"
        onMouseDown={handleMouseDown}
        style={{
          width: size?.width,
          height: size?.height,
          minHeight: rendering && !size ? 400 : undefined,
          cursor: size ? (selectedId ? "default" : "crosshair") : undefined,
        }}
      >
        <canvas ref={canvasRef} className="block" />
        {size &&
          textBoxes.map((box) => (
            <TextBoxOverlay
              key={box.id}
              box={box}
              scale={displayScale}
              selected={box.id === selectedId}
              pdfPageWidth={size.pdfWidth}
              pdfPageHeight={size.pdfHeight}
              onSelect={() => onSelectTextBox(box.id)}
              onChange={(patch) => onChangeTextBox(box.id, patch)}
              onCommit={onCommitTextBox}
            />
          ))}
      </div>
    </div>
  );
}
