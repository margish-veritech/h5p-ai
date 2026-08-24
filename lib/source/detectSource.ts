import { MAX_UPLOAD_BYTES } from "../sourceLimits";
import { ExtractionError } from "./errors";
import type { DetectedSource, SourceFormat, UploadedSourceFile } from "./types";

const MIME_ALLOWLIST: Record<SourceFormat, string[]> = {
  text: ["", "text/plain"],
  csv: ["", "text/csv", "application/csv", "application/vnd.ms-excel", "text/plain"],
  pdf: ["", "application/pdf"],
  docx: [
    "",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip"
  ],
  image: ["image/jpeg", "image/png", "image/webp"]
};

const extensionFor = (name: string) => {
  const match = /\.([a-z0-9]+)$/i.exec(name);
  return match ? match[1].toLowerCase() : "";
};

const hasPdfSignature = (buffer: Buffer) => buffer.subarray(0, 5).toString() === "%PDF-";
const hasZipSignature = (buffer: Buffer) =>
  buffer.length >= 4 &&
  buffer[0] === 0x50 &&
  buffer[1] === 0x4b &&
  [0x03, 0x05, 0x07].includes(buffer[2]) &&
  [0x04, 0x06, 0x08].includes(buffer[3]);
const hasOleSignature = (buffer: Buffer) =>
  buffer.length >= 8 &&
  buffer[0] === 0xd0 &&
  buffer[1] === 0xcf &&
  buffer[2] === 0x11 &&
  buffer[3] === 0xe0 &&
  buffer[4] === 0xa1 &&
  buffer[5] === 0xb1 &&
  buffer[6] === 0x1a &&
  buffer[7] === 0xe1;
const hasPngSignature = (buffer: Buffer) =>
  buffer.length >= 8 &&
  buffer[0] === 0x89 &&
  buffer[1] === 0x50 &&
  buffer[2] === 0x4e &&
  buffer[3] === 0x47 &&
  buffer[4] === 0x0d &&
  buffer[5] === 0x0a &&
  buffer[6] === 0x1a &&
  buffer[7] === 0x0a;
const hasJpegSignature = (buffer: Buffer) =>
  buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
const hasWebpSignature = (buffer: Buffer) =>
  buffer.length >= 12 &&
  buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
  buffer.subarray(8, 12).toString("ascii") === "WEBP";

const matchesMime = (format: SourceFormat, mediaType: string) =>
  MIME_ALLOWLIST[format].includes(mediaType.toLowerCase());

export const detectSource = (file: UploadedSourceFile): DetectedSource => {
  const extension = extensionFor(file.name);
  const mediaType = file.mediaType.toLowerCase();

  if (file.sizeBytes <= 0) {
    throw new ExtractionError("FILE_EMPTY", "Choose a non-empty file.");
  }

  if (file.sizeBytes > MAX_UPLOAD_BYTES) {
    throw new ExtractionError(
      "FILE_TOO_LARGE",
      `The selected file is ${(file.sizeBytes / 1024 / 1024).toFixed(1)} MiB. The upload limit is 10 MiB.`
    );
  }

  if (extension === "doc") {
    throw new ExtractionError(
      "UNSUPPORTED_FORMAT",
      "Legacy .doc files are not supported. Resave the document as .docx or PDF."
    );
  }

  if (extension === "docm") {
    throw new ExtractionError(
      "UNSUPPORTED_FORMAT",
      "Macro-enabled Word documents are not supported. Upload a non-macro .docx file."
    );
  }

  if (["gif", "svg", "heic", "heif"].includes(extension)) {
    throw new ExtractionError(
      "UNSUPPORTED_FORMAT",
      "Unsupported image format. Upload JPEG, PNG, or WebP."
    );
  }

  if (extension === "txt") {
    if (!matchesMime("text", mediaType)) {
      throw new ExtractionError("TYPE_MISMATCH", "The file type does not match a UTF-8 text file.");
    }

    return { format: "text", mediaType: mediaType || "text/plain", extension };
  }

  if (extension === "csv") {
    if (!matchesMime("csv", mediaType)) {
      throw new ExtractionError("TYPE_MISMATCH", "The file type does not match a CSV file.");
    }

    return { format: "csv", mediaType: mediaType || "text/csv", extension };
  }

  if (extension === "pdf") {
    if (!matchesMime("pdf", mediaType) || !hasPdfSignature(file.buffer)) {
      throw new ExtractionError("TYPE_MISMATCH", "The file type does not match a PDF document.");
    }

    return { format: "pdf", mediaType: "application/pdf", extension };
  }

  if (extension === "docx") {
    if (hasOleSignature(file.buffer)) {
      throw new ExtractionError(
        "ENCRYPTED_DOCUMENT",
        "Password-protected Word files cannot be processed. Upload an unlocked .docx file."
      );
    }

    if (!matchesMime("docx", mediaType) || !hasZipSignature(file.buffer)) {
      throw new ExtractionError("TYPE_MISMATCH", "The file type does not match a .docx document.");
    }

    return {
      format: "docx",
      mediaType:
        mediaType || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extension
    };
  }

  if (["jpg", "jpeg"].includes(extension)) {
    if (!matchesMime("image", mediaType) || !hasJpegSignature(file.buffer)) {
      throw new ExtractionError("TYPE_MISMATCH", "The file type does not match a JPEG image.");
    }

    return { format: "image", mediaType: "image/jpeg", extension };
  }

  if (extension === "png") {
    if (!matchesMime("image", mediaType) || !hasPngSignature(file.buffer)) {
      throw new ExtractionError("TYPE_MISMATCH", "The file type does not match a PNG image.");
    }

    return { format: "image", mediaType: "image/png", extension };
  }

  if (extension === "webp") {
    if (!matchesMime("image", mediaType) || !hasWebpSignature(file.buffer)) {
      throw new ExtractionError("TYPE_MISMATCH", "The file type does not match a WebP image.");
    }

    return { format: "image", mediaType: "image/webp", extension };
  }

  throw new ExtractionError(
    "UNSUPPORTED_FORMAT",
    "Unsupported file format. Upload UTF-8 text, CSV, text-layer PDF, .docx, JPEG, PNG, or WebP."
  );
};
