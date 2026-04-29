import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import fs from "fs/promises";
import { applyTextBoxesToPdf, PdfTextBox } from "@/lib/pdf-editor";
import { sanitizeFields, TemplateField } from "@/lib/template-types";
import { saveFile } from "@/lib/file-storage";
import {
  getPersonalDir,
  getVehicleDir,
  getHomeDir,
  getBusinessDir,
  getHealthDir,
  getPensionDir,
} from "@/lib/utils/paths";

interface RenderBody {
  values?: Record<string, string>;
  download?: boolean;
  fileName?: string;
  attach?: {
    clientId: string;
    type: "personal" | "vehicleInsurance" | "homeInsurance" | "businessInsurance" | "healthInsurance" | "pensionInsurance";
    recordId?: string;
    assetId?: string;
    year?: number;
    category?: string;
    personalDocType?: string;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { templateId } = await params;
  const tpl = await prisma.template.findUnique({ where: { id: templateId } });
  if (!tpl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json()) as RenderBody;
  const values = body.values || {};
  const fields = sanitizeFields(tpl.fields);

  const pdfBoxes: PdfTextBox[] = fields.map((f: TemplateField) => {
    const value = (values[f.id] ?? "").toString();
    return {
      pageIndex: f.pageIndex,
      x: f.x,
      y: f.y,
      fontSize: f.fontSize,
      bold: f.bold,
      text: f.kind === "x" ? "" : value,
      dir: f.dir,
      kind: f.kind,
      color: f.color,
    };
  }).filter((b) => b.kind === "x" || b.text.trim().length > 0);

  let originalBytes: Uint8Array;
  try {
    const buf = await fs.readFile(tpl.storagePath);
    originalBytes = new Uint8Array(buf);
  } catch {
    return NextResponse.json({ error: "Template PDF missing" }, { status: 404 });
  }

  let outputBytes: Uint8Array;
  try {
    outputBytes = await applyTextBoxesToPdf(originalBytes, pdfBoxes);
  } catch (err) {
    console.error("Template render error:", err);
    return NextResponse.json({ error: "Render failed" }, { status: 500 });
  }

  const requestedName = (body.fileName || tpl.name || "template").trim();
  const finalName = requestedName.toLowerCase().endsWith(".pdf")
    ? requestedName
    : requestedName + ".pdf";

  if (body.attach) {
    const a = body.attach;
    let directory: string;
    switch (a.type) {
      case "personal":
        directory = getPersonalDir(a.clientId);
        break;
      case "vehicleInsurance":
        directory = getVehicleDir(a.clientId, a.assetId!, Number(a.year));
        break;
      case "homeInsurance":
        directory = getHomeDir(a.clientId, a.assetId!, Number(a.year));
        break;
      case "businessInsurance":
        directory = getBusinessDir(a.clientId, a.assetId!, Number(a.year));
        break;
      case "healthInsurance":
        directory = getHealthDir(a.clientId, a.assetId!, Number(a.year));
        break;
      case "pensionInsurance":
        directory = getPensionDir(a.clientId, a.assetId!, Number(a.year));
        break;
      default:
        return NextResponse.json({ error: "Invalid attach type" }, { status: 400 });
    }

    const buffer = Buffer.from(outputBytes);
    const storagePath = await saveFile(directory, finalName, buffer);

    // Also save the BLANK template as originalStoragePath so the user
    // can later edit values (the "filled" boxes appear as editable text).
    const blankBaseName = finalName.replace(/\.pdf$/i, "") + ".original.pdf";
    const blankBuffer = Buffer.from(originalBytes);
    const originalStoragePath = await saveFile(directory, blankBaseName, blankBuffer);

    const documentData: Record<string, unknown> = {
      fileName: finalName,
      storagePath,
      originalStoragePath,
      editBoxes: JSON.parse(JSON.stringify(pdfBoxes)),
      mimeType: "application/pdf",
      fileSize: outputBytes.byteLength,
      category: a.category || null,
    };

    switch (a.type) {
      case "personal":
        documentData.clientId = a.clientId;
        if (a.personalDocType) documentData.personalDocType = a.personalDocType;
        break;
      case "vehicleInsurance":
        documentData.vehicleInsuranceId = a.recordId;
        break;
      case "homeInsurance":
        documentData.homeInsuranceId = a.recordId;
        break;
      case "businessInsurance":
        documentData.businessInsuranceId = a.recordId;
        break;
      case "healthInsurance":
        documentData.healthInsuranceId = a.recordId;
        break;
      case "pensionInsurance":
        documentData.pensionInsuranceId = a.recordId;
        break;
    }

    const document = await prisma.document.create({ data: documentData as never });
    return NextResponse.json({ success: true, documentId: document.id });
  }

  return new NextResponse(Buffer.from(outputBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(finalName)}"`,
    },
  });
}
