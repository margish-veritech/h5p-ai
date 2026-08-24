import JSZip from "jszip";
import {
  MAX_DOCX_ENTRIES,
  MAX_DOCX_UNCOMPRESSED_BYTES
} from "../../sourceLimits";
import { ExtractionError } from "../errors";
import { validateNormalizedSource } from "../normalizeText";
import type { ExtractedSource, UploadedSourceFile } from "../types";

type ZipObjectWithSize = JSZip.JSZipObject & {
  _data?: {
    uncompressedSize?: number;
  };
};

export const extractDocxFile = async (file: UploadedSourceFile): Promise<ExtractedSource> => {
  let zip: JSZip;

  try {
    zip = await JSZip.loadAsync(file.buffer);
  } catch {
    throw new ExtractionError(
      "CORRUPT_DOCUMENT",
      "The .docx package could not be opened. Re-export it and try again."
    );
  }

  const entries = Object.values(zip.files) as ZipObjectWithSize[];

  if (entries.length > MAX_DOCX_ENTRIES) {
    throw new ExtractionError(
      "FILE_TOO_LARGE",
      `DOCX files are limited to ${MAX_DOCX_ENTRIES.toLocaleString()} internal entries.`
    );
  }

  const totalUncompressed = entries.reduce(
    (total, entry) => total + (entry._data?.uncompressedSize ?? 0),
    0
  );

  if (totalUncompressed > MAX_DOCX_UNCOMPRESSED_BYTES) {
    throw new ExtractionError(
      "FILE_TOO_LARGE",
      "The DOCX expands beyond the 50 MiB safety limit."
    );
  }

  if (!zip.file("[Content_Types].xml") || !zip.file("word/document.xml")) {
    throw new ExtractionError(
      "CORRUPT_DOCUMENT",
      "The file is not a valid modern .docx document."
    );
  }

  const hasMacros = entries.some((entry) => /(^|\/)vbaProject\.bin$/i.test(entry.name));

  const [contentTypes, settings] = await Promise.all([
    zip.file("[Content_Types].xml")?.async("string") ?? "",
    zip.file("word/settings.xml")?.async("string") ?? ""
  ]);

  if (hasMacros || /macroenabled/i.test(contentTypes)) {
    throw new ExtractionError(
      "UNSUPPORTED_FORMAT",
      "Macro-enabled Word documents are not supported. Upload a non-macro .docx file."
    );
  }

  if (/<w:documentProtection\b/i.test(settings)) {
    throw new ExtractionError(
      "ENCRYPTED_DOCUMENT",
      "Protected Word documents cannot be processed. Remove document protection and upload an unlocked .docx file."
    );
  }

  const warnings: string[] = [];
  const hasEmbeddedMedia = entries.some((entry) => /^word\/media\//i.test(entry.name));

  if (hasEmbeddedMedia) {
    warnings.push("Embedded DOCX images were ignored. Paste or upload image text separately.");
  }

  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    const normalized = validateNormalizedSource(result.value);

    return {
      text: normalized.text,
      format: "docx",
      method: "docx-raw",
      filename: file.name,
      mediaType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: file.sizeBytes,
      warnings: [...warnings, ...result.messages.map((message) => message.message), ...normalized.warnings]
    };
  } catch (error) {
    if (error instanceof ExtractionError) {
      throw error;
    }

    throw new ExtractionError(
      "CORRUPT_DOCUMENT",
      "The .docx text could not be extracted. Re-export it and try again."
    );
  }
};
