import fs from "fs/promises";
import path from "path";
import { existsSync, createReadStream } from "fs";
import type { ReadStream } from "fs";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

export function isAllowedFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/\.\./g, "")
    .replace(/[/\\]/g, "")
    .replace(/[^\w\s.\-\u0590-\u05FF]/g, "")
    .trim();
}

export async function saveFile(
  directory: string,
  fileName: string,
  buffer: Buffer
): Promise<string> {
  const sanitized = sanitizeFileName(fileName);
  const uniqueName = `${Date.now()}-${sanitized}`;
  const filePath = path.join(directory, uniqueName);

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(filePath, buffer);

  return filePath;
}

export function readFileStream(filePath: string): ReadStream | null {
  if (!existsSync(filePath)) return null;
  return createReadStream(filePath);
}

export async function deleteFile(filePath: string): Promise<void> {
  if (existsSync(filePath)) {
    await fs.unlink(filePath);
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  return existsSync(filePath);
}
