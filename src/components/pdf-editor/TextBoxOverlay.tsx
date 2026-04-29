"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TextBox } from "./types";

interface Props {
  box: TextBox;
  scale: number;
  selected: boolean;
  pdfPageWidth: number;
  pdfPageHeight: number;
  onChange: (patch: Partial<TextBox>) => void;
  onSelect: () => void;
  onCommit: () => void;
}

const HEBREW_RANGE = /[\u0590-\u05FF]/;
const LATIN_OR_DIGIT = /[A-Za-z0-9]/;

function detectDir(text: string, current: "ltr" | "rtl"): "ltr" | "rtl" {
  if (!text) return current;
  if (HEBREW_RANGE.test(text)) return "rtl";
  if (LATIN_OR_DIGIT.test(text)) return "ltr";
  return current;
}

export function TextBoxOverlay({
  box,
  scale,
  selected,
  pdfPageWidth,
  pdfPageHeight,
  onChange,
  onSelect,
  onCommit,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; boxX: number; boxY: number } | null>(null);

  const isXMark = box.kind === "x";

  useEffect(() => {
    if (selected && !isXMark) {
      textareaRef.current?.focus();
    }
  }, [selected, isXMark]);

  useLayoutEffect(() => {
    if (isXMark) return;
    if (!textareaRef.current || !measureRef.current) return;
    const lines = box.text.split("\n");
    let maxLineWidth = 0;
    for (const line of lines) {
      measureRef.current.textContent = line || " ";
      if (measureRef.current.offsetWidth > maxLineWidth) {
        maxLineWidth = measureRef.current.offsetWidth;
      }
    }
    const minWidth = box.fontSize * scale * 0.4;
    textareaRef.current.style.width = `${Math.max(maxLineWidth + 1, minWidth)}px`;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [box.text, box.fontSize, box.bold, scale, isXMark]);

  useEffect(() => {
    if (isXMark) return;
    const newDir = detectDir(box.text, box.dir);
    if (newDir !== box.dir) {
      onChange({ dir: newDir });
    }
  }, [box.text, box.dir, onChange, isXMark]);

  function startDrag(clientX: number, clientY: number) {
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      boxX: box.x,
      boxY: box.y,
    };
    setDragging(true);
  }

  function handleContainerMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    onSelect();
    if (!isXMark && e.target === textareaRef.current) return;
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  }

  useEffect(() => {
    if (!dragging) return;

    function onMouseMove(e: MouseEvent) {
      if (!dragStartRef.current) return;
      const dx = (e.clientX - dragStartRef.current.mouseX) / scale;
      const dy = (e.clientY - dragStartRef.current.mouseY) / scale;
      let newX = dragStartRef.current.boxX + dx;
      let newY = dragStartRef.current.boxY + dy;

      if (containerRef.current) {
        const boxW = containerRef.current.offsetWidth / scale;
        const boxH = containerRef.current.offsetHeight / scale;
        const isRtlBox = box.dir === "rtl" && box.kind !== "x";
        const minX = isRtlBox ? boxW : 0;
        const maxX = isRtlBox ? pdfPageWidth : pdfPageWidth - boxW;
        const minY = 0;
        const maxY = pdfPageHeight - boxH;
        newX = Math.min(Math.max(newX, minX), Math.max(maxX, minX));
        newY = Math.min(Math.max(newY, minY), Math.max(maxY, minY));
      }

      onChange({ x: newX, y: newY });
    }

    function onMouseUp() {
      setDragging(false);
      dragStartRef.current = null;
      onCommit();
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, scale, onChange, onCommit, box.dir, box.kind, pdfPageWidth, pdfPageHeight]);

  const dragHandle = selected ? (
    <button
      type="button"
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        startDrag(e.clientX, e.clientY);
      }}
      className="absolute -left-6 top-0 bottom-0 w-5 bg-primary-600 text-white rounded-l-md flex items-center justify-center shadow-md hover:bg-primary-700 z-10"
      style={{ cursor: dragging ? "grabbing" : "grab" }}
      title="גרור"
    >
      <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
        <circle cx="2.5" cy="3" r="1.2" />
        <circle cx="7.5" cy="3" r="1.2" />
        <circle cx="2.5" cy="7" r="1.2" />
        <circle cx="7.5" cy="7" r="1.2" />
        <circle cx="2.5" cy="11" r="1.2" />
        <circle cx="7.5" cy="11" r="1.2" />
      </svg>
    </button>
  ) : null;

  if (isXMark) {
    const padding = 2;
    const sizePx = box.fontSize * scale;
    const strokeWidth = Math.max(2, sizePx / 8);
    return (
      <div
        ref={containerRef}
        data-box-id={box.id}
        onMouseDown={handleContainerMouseDown}
        className={`absolute rounded ${
          selected
            ? "border-2 border-primary-600 bg-primary-500/5"
            : "border border-primary-500/50 hover:border-2 hover:border-primary-600 hover:bg-primary-500/5"
        }`}
        style={{
          left: box.x * scale - padding,
          top: box.y * scale - padding,
          width: sizePx + padding * 2,
          height: sizePx + padding * 2,
          padding: `${padding}px`,
          cursor: dragging ? "grabbing" : "grab",
        }}
      >
        {dragHandle}
        <svg
          width={sizePx}
          height={sizePx}
          viewBox="0 0 100 100"
          style={{ display: "block", pointerEvents: "none" }}
        >
          <line
            x1="10"
            y1="10"
            x2="90"
            y2="90"
            stroke={box.color}
            strokeWidth={strokeWidth * (100 / sizePx)}
            strokeLinecap="round"
          />
          <line
            x1="90"
            y1="10"
            x2="10"
            y2="90"
            stroke={box.color}
            strokeWidth={strokeWidth * (100 / sizePx)}
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  const displayFontSize = box.fontSize * scale;
  const padding = 2;
  const fontStyles = {
    fontSize: `${displayFontSize}px`,
    fontWeight: box.bold ? 700 : 400,
    fontFamily: "var(--font-heebo, sans-serif)",
    lineHeight: 1.2,
  } as const;

  const isRtl = box.dir === "rtl";
  const cssLeft = isRtl
    ? box.x * scale + padding
    : box.x * scale - padding;

  return (
    <div
      ref={containerRef}
      data-box-id={box.id}
      onMouseDown={handleContainerMouseDown}
      className={`absolute rounded ${
        selected
          ? "border-2 border-primary-600 bg-primary-500/5"
          : "border border-primary-500/50 hover:border-2 hover:border-primary-600 hover:bg-primary-500/5"
      }`}
      style={{
        left: cssLeft,
        top: box.y * scale - padding,
        padding: `${padding}px`,
        cursor: dragging ? "grabbing" : "grab",
        transform: isRtl ? "translateX(-100%)" : undefined,
      }}
    >
      {dragHandle}
      <span
        ref={measureRef}
        aria-hidden
        style={{
          position: "absolute",
          visibility: "hidden",
          whiteSpace: "pre",
          pointerEvents: "none",
          top: 0,
          left: 0,
          padding: 0,
          margin: 0,
          ...fontStyles,
        }}
      />
      <textarea
        ref={textareaRef}
        dir={box.dir}
        value={box.text}
        onChange={(e) => onChange({ text: e.target.value })}
        rows={1}
        spellCheck={false}
        className="resize-none overflow-hidden bg-transparent outline-none whitespace-pre block"
        style={{
          ...fontStyles,
          padding: 0,
          margin: 0,
          color: box.color,
          cursor: "text",
          border: "none",
          textAlign: isRtl ? "right" : "left",
        }}
      />
    </div>
  );
}
