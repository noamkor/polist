import path from "path";

const uploadsDir = process.env.UPLOADS_DIR || "./uploads";

export function getUploadsDir(): string {
  return path.resolve(uploadsDir);
}

export function getClientDir(clientId: string): string {
  return path.join(getUploadsDir(), "clients", clientId);
}

export function getPersonalDir(clientId: string): string {
  return path.join(getClientDir(clientId), "personal");
}

export function getVehicleDir(clientId: string, vehicleId: string, year: number): string {
  return path.join(getClientDir(clientId), "vehicles", vehicleId, String(year));
}

export function getHomeDir(clientId: string, homeId: string, year: number): string {
  return path.join(getClientDir(clientId), "homes", homeId, String(year));
}

export function getBusinessDir(clientId: string, businessId: string, year: number): string {
  return path.join(getClientDir(clientId), "businesses", businessId, String(year));
}

export function getHealthDir(clientId: string, policyId: string, year: number): string {
  return path.join(getClientDir(clientId), "health", policyId, String(year));
}

export function getPensionDir(clientId: string, policyId: string, year: number): string {
  return path.join(getClientDir(clientId), "pension", policyId, String(year));
}

export function getTemplateDir(templateId: string): string {
  return path.join(getUploadsDir(), "templates", templateId);
}
