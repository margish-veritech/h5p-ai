import { LOCAL_EXTRACTION_TIMEOUT_MS, OCR_TIMEOUT_MS } from "../sourceLimits";
import { detectSource } from "./detectSource";
import { ExtractionError } from "./errors";
import { validateNormalizedSource } from "./normalizeText";
import { withExtractionTimeout } from "./timeout";
import { extractCsvFile } from "./adapters/csv";
import { extractDocxFile } from "./adapters/docx";
import { extractImageFile } from "./adapters/image";
import { extractPdfFile } from "./adapters/pdf";
import { extractTextFile } from "./adapters/text";
import type {
  ExtractedSource,
  ExtractRouteResponse,
  OcrClient,
  UploadedSourceFile
} from "./types";

export type ExtractOptions = {
  ocrClient?: OcrClient;
};

const section = (label: string, text: string) => `--- ${label} ---\n${text}`;

export const extractUploadedSource = async (
  file: UploadedSourceFile,
  options: ExtractOptions = {}
): Promise<ExtractedSource> => {
  const detected = detectSource(file);
  const work = async () => {
    switch (detected.format) {
      case "text":
        return extractTextFile(file);
      case "csv":
        return extractCsvFile(file);
      case "pdf":
        return extractPdfFile(file);
      case "docx":
        return extractDocxFile(file);
      case "image":
        return extractImageFile(file, detected, options.ocrClient);
      default:
        throw new ExtractionError(
          "UNSUPPORTED_FORMAT",
          "Unsupported file format. Upload UTF-8 text, CSV, text-layer PDF, .docx, JPEG, PNG, or WebP."
        );
    }
  };

  return withExtractionTimeout(
    work(),
    detected.format === "image" ? OCR_TIMEOUT_MS : LOCAL_EXTRACTION_TIMEOUT_MS
  );
};

export const buildExtractRouteResponse = (input: {
  pastedText?: string;
  uploaded?: ExtractedSource;
}): ExtractRouteResponse => {
  const warnings: string[] = [];
  const sections: string[] = [];

  if (input.pastedText?.trim()) {
    const normalized = validateNormalizedSource(input.pastedText, {
      requireReadableText: false
    });
    sections.push(section("PASTED TEXT", normalized.text));
    warnings.push(...normalized.warnings);
  }

  if (input.uploaded) {
    const label = input.uploaded.filename
      ? `FILE: ${input.uploaded.filename}`
      : `FILE: ${input.uploaded.format}`;
    sections.push(section(label, input.uploaded.text));
    warnings.push(...input.uploaded.warnings);
  }

  if (sections.length === 0) {
    throw new ExtractionError(
      "SOURCE_REQUIRED",
      "Paste text or choose one supported file."
    );
  }

  const combined = validateNormalizedSource(sections.join("\n\n"));
  const uploaded = input.uploaded;

  return {
    text: combined.text,
    source: {
      kind: input.pastedText?.trim() && uploaded ? "mixed" : uploaded?.format ?? "text",
      fileName: uploaded?.filename,
      mediaType: uploaded?.mediaType,
      sizeBytes: uploaded?.sizeBytes,
      method: input.pastedText?.trim() && uploaded ? "combined" : uploaded?.method ?? "plain"
    },
    stats: {
      characters: combined.text.length,
      pages: uploaded?.pageCount,
      rows: uploaded?.rowCount
    },
    warnings: [...warnings, ...combined.warnings]
  };
};
