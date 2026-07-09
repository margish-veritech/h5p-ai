import { mkdir } from "node:fs/promises";
import path from "node:path";

export const UPLOAD_DIR = path.join(process.cwd(), "user-upload");

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const extensionForMime = (mime: string) => {
  if (mime === "image/jpeg") {
    return ".jpg";
  }

  if (mime === "image/png") {
    return ".png";
  }

  if (mime === "image/webp") {
    return ".webp";
  }

  return "";
};

export const ensureUploadDir = async () => {
  await mkdir(UPLOAD_DIR, { recursive: true });
};

export const uploadFilePath = (id: string, mime: string) =>
  path.join(UPLOAD_DIR, `${id}${extensionForMime(mime)}`);

export const buildH5pImagePath = (id: string, mime: string) =>
  `images/file-${id}${extensionForMime(mime)}`;
