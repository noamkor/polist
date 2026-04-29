export type ElementKind = "text" | "x";

export interface TextBox {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  fontSize: number;
  bold: boolean;
  text: string;
  dir: "ltr" | "rtl";
  kind: ElementKind;
  color: string;
}
