import { decodeUtf8Strict, validateNormalizedSource } from "../normalizeText";
import type { ExtractedSource, UploadedSourceFile } from "../types";

export const extractTextFile = (file: UploadedSourceFile): ExtractedSource => {
  const decoded = decodeUtf8Strict(
    file.buffer,
    "Text files must be valid UTF-8. Save the file as UTF-8 and try again."
  );
  const normalized = validateNormalizedSource(decoded);

  return {
    text: normalized.text,
    format: "text",
    method: "plain",
    filename: file.name,
    mediaType: "text/plain",
    sizeBytes: file.sizeBytes,
    warnings: normalized.warnings
  };
};
