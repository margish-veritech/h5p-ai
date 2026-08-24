import { MAX_PDF_PAGES, MIN_READABLE_CHARACTERS } from "../../sourceLimits";
import { ExtractionError } from "../errors";
import { countReadableCharacters, validateNormalizedSource } from "../normalizeText";
import type { ExtractedSource, UploadedSourceFile } from "../types";

type PdfTextItem = {
  str?: string;
  hasEOL?: boolean;
};

type PdfDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<unknown>;
  destroy?: () => void | Promise<void>;
};

type PdfLoadingTask = {
  promise: Promise<PdfDocument>;
  destroy?: () => void | Promise<void>;
};

type PdfJsFailure = {
  name?: unknown;
  message?: unknown;
  details?: unknown;
  stack?: unknown;
};

const pdfJsFailure = (error: unknown): PdfJsFailure =>
  typeof error === "object" && error !== null ? error : {};

const errorField = (value: unknown) => (typeof value === "string" ? value : "");

const logPdfFailure = (category: "invalid" | "runtime", error: unknown) => {
  const failure = pdfJsFailure(error);

  // Never log a file name or source content. These parser details are enough to
  // diagnose deployment/worker failures without exposing uploaded material.
  console.error("[pdf-extraction] PDF.js failure", {
    category,
    name: errorField(failure.name) || typeof error,
    message: errorField(failure.message) || "Unknown PDF.js failure",
    details: errorField(failure.details) || undefined,
    stack: errorField(failure.stack) || undefined
  });
};

export const classifyPdfError = (error: unknown) => {
  if (error instanceof ExtractionError) {
    return error;
  }

  const failure = pdfJsFailure(error);
  const name = errorField(failure.name);
  const message = errorField(failure.message);
  const details = errorField(failure.details);

  if (/password/i.test(name)) {
    return new ExtractionError(
      "ENCRYPTED_DOCUMENT",
      "Password-protected PDFs cannot be processed. Upload an unlocked text-layer PDF."
    );
  }

  if (
    ["InvalidPDFException", "FormatError", "MissingPDFException"].includes(name) ||
    details.startsWith("FormatError:") ||
    /invalid pdf|xref/i.test(message)
  ) {
    logPdfFailure("invalid", error);
    return new ExtractionError(
      "CORRUPT_DOCUMENT",
      "The PDF is invalid or damaged. Re-export it as a text-layer PDF and try again."
    );
  }

  logPdfFailure("runtime", error);
  return new ExtractionError(
    "PDF_PROCESSING_UNAVAILABLE",
    "PDF extraction is temporarily unavailable. Try again or paste the text instead."
  );
};

export const extractPdfFile = async (file: UploadedSourceFile): Promise<ExtractedSource> => {
  let pdf: PdfDocument | undefined;
  let loadingTask: PdfLoadingTask | undefined;

  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    loadingTask = pdfjs.getDocument({
      data: new Uint8Array(file.buffer),
      disableFontFace: true,
      isEvalSupported: false,
      useSystemFonts: true,
      verbosity: 0
    });
    pdf = await loadingTask.promise;

    if (pdf.numPages > MAX_PDF_PAGES) {
      throw new ExtractionError(
        "TOO_MANY_PAGES",
        `PDF files are limited to ${MAX_PDF_PAGES} pages. This PDF has ${pdf.numPages} pages.`
      );
    }

    const pageTexts: string[] = [];
    const lowTextPages: number[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = (await pdf.getPage(pageNumber)) as {
        getTextContent: () => Promise<{ items: PdfTextItem[] }>;
      };
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => {
          const value = item.str ?? "";
          return item.hasEOL ? `${value}\n` : value;
        })
        .join(" ")
        .replace(/[ \t]+\n/g, "\n");

      if (countReadableCharacters(pageText) < MIN_READABLE_CHARACTERS) {
        lowTextPages.push(pageNumber);
      }

      pageTexts.push(`--- PAGE ${pageNumber} ---\n${pageText}`);
    }

    if (lowTextPages.length === pdf.numPages) {
      throw new ExtractionError(
        "NO_READABLE_TEXT",
        "This PDF does not contain a readable text layer. Upload a text-layer PDF or paste the text."
      );
    }

    if (lowTextPages.length > 0) {
      throw new ExtractionError(
        "NO_READABLE_TEXT",
        `This PDF has scanned or textless pages (${lowTextPages.join(", ")}). The MVP supports text-layer PDFs only.`
      );
    }

    const normalized = validateNormalizedSource(pageTexts.join("\n\n"));

    return {
      text: normalized.text,
      format: "pdf",
      method: "native-pdf",
      filename: file.name,
      mediaType: "application/pdf",
      sizeBytes: file.sizeBytes,
      pageCount: pdf.numPages,
      warnings: [
        "PDF reading order can be imperfect for columns, tables, and complex layouts.",
        ...normalized.warnings
      ]
    };
  } catch (error) {
    throw classifyPdfError(error);
  } finally {
    try {
      if (pdf) {
        await pdf.destroy?.();
      } else {
        await loadingTask?.destroy?.();
      }
    } catch {
      // Cleanup failures must not replace the extraction result or its safe error.
    }
  }
};
