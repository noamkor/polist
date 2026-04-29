export interface TemplateField {
  id: string;
  label: string;
  pageIndex: number;
  x: number;
  y: number;
  fontSize: number;
  bold: boolean;
  dir: "ltr" | "rtl";
  color: string;
  kind: "text" | "x";
}

export function isValidField(v: unknown): v is TemplateField {
  if (!v || typeof v !== "object") return false;
  const f = v as Record<string, unknown>;
  return (
    typeof f.id === "string" &&
    typeof f.label === "string" &&
    typeof f.pageIndex === "number" &&
    typeof f.x === "number" &&
    typeof f.y === "number" &&
    typeof f.fontSize === "number" &&
    typeof f.bold === "boolean" &&
    (f.dir === "ltr" || f.dir === "rtl") &&
    typeof f.color === "string" &&
    (f.kind === "text" || f.kind === "x")
  );
}

export function sanitizeFields(input: unknown): TemplateField[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((b: unknown) => {
      if (!b || typeof b !== "object") return null;
      const o = b as Record<string, unknown>;
      const field: TemplateField = {
        id: typeof o.id === "string" ? o.id : String(Math.random()),
        label: typeof o.label === "string" ? o.label : "",
        pageIndex: Number(o.pageIndex) || 0,
        x: Number(o.x) || 0,
        y: Number(o.y) || 0,
        fontSize: Number(o.fontSize) || 14,
        bold: Boolean(o.bold),
        dir: o.dir === "ltr" ? "ltr" : "rtl",
        color: typeof o.color === "string" && /^#[0-9a-fA-F]{6}$/.test(o.color) ? o.color : "#000000",
        kind: o.kind === "x" ? "x" : "text",
      };
      return field;
    })
    .filter((f): f is TemplateField => f !== null);
}
