import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { saveFile, isAllowedMimeType, isAllowedFileSize } from "@/lib/file-storage";
import {
  getPersonalDir,
  getVehicleDir,
  getHomeDir,
  getBusinessDir,
  getHealthDir,
  getPensionDir,
} from "@/lib/utils/paths";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const clientId = formData.get("clientId") as string;
  const type = formData.get("type") as string; // "personal" | "vehicleInsurance" | "homeInsurance" | "businessInsurance" | "healthInsurance" | "pensionInsurance"
  const recordId = formData.get("recordId") as string | null;
  const assetId = formData.get("assetId") as string | null;
  const year = formData.get("year") as string | null;
  const category = formData.get("category") as string | null;
  const personalDocType = formData.get("personalDocType") as string | null; // "ID" | "DRIVER_LICENSE" | null

  if (!file || !clientId || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!isAllowedMimeType(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  if (!isAllowedFileSize(file.size)) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let directory: string;
  switch (type) {
    case "personal":
      directory = getPersonalDir(clientId);
      break;
    case "vehicleInsurance":
      directory = getVehicleDir(clientId, assetId!, parseInt(year!));
      break;
    case "homeInsurance":
      directory = getHomeDir(clientId, assetId!, parseInt(year!));
      break;
    case "businessInsurance":
      directory = getBusinessDir(clientId, assetId!, parseInt(year!));
      break;
    case "healthInsurance":
      directory = getHealthDir(clientId, assetId!, parseInt(year!));
      break;
    case "pensionInsurance":
      directory = getPensionDir(clientId, assetId!, parseInt(year!));
      break;
    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const storagePath = await saveFile(directory, file.name, buffer);

  const documentData: any = {
    fileName: file.name,
    storagePath,
    mimeType: file.type,
    fileSize: file.size,
    category: category || null,
  };

  // Set the appropriate FK
  switch (type) {
    case "personal":
      documentData.clientId = clientId;
      if (personalDocType) {
        documentData.personalDocType = personalDocType;
      }
      break;
    case "vehicleInsurance":
      documentData.vehicleInsuranceId = recordId;
      break;
    case "homeInsurance":
      documentData.homeInsuranceId = recordId;
      break;
    case "businessInsurance":
      documentData.businessInsuranceId = recordId;
      break;
    case "healthInsurance":
      documentData.healthInsuranceId = recordId;
      break;
    case "pensionInsurance":
      documentData.pensionInsuranceId = recordId;
      break;
  }

  const document = await prisma.document.create({ data: documentData });

  return NextResponse.json(document, { status: 201 });
}
