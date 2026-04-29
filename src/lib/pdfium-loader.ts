"use client";

import type { PDFiumLibrary } from "@hyzyla/pdfium";

let libraryPromise: Promise<PDFiumLibrary> | null = null;

export function getPdfiumLibrary(): Promise<PDFiumLibrary> {
  if (!libraryPromise) {
    libraryPromise = (async () => {
      const { PDFiumLibrary } = await import("@hyzyla/pdfium");
      return await PDFiumLibrary.init({ wasmUrl: "/pdfium.wasm" });
    })();
  }
  return libraryPromise;
}
