import type { ExtractionErrorCode } from "./types";

const DEFAULT_STATUS: Record<ExtractionErrorCode, number> = {
  SOURCE_REQUIRED: 400,
  MULTIPLE_FILES: 400,
  FILE_EMPTY: 400,
  FILE_TOO_LARGE: 413,
  SOURCE_TOO_LONG: 413,
  UNSUPPORTED_FORMAT: 415,
  TYPE_MISMATCH: 415,
  CSV_STRUCTURE_INVALID: 422,
  NO_READABLE_TEXT: 422,
  ENCRYPTED_DOCUMENT: 422,
  CORRUPT_DOCUMENT: 422,
  TOO_MANY_PAGES: 413,
  IMAGE_TOO_LARGE: 413,
  PDF_PROCESSING_UNAVAILABLE: 503,
  OCR_UNAVAILABLE: 502,
  EXTRACTION_TIMEOUT: 504,
  INVALID_REQUEST: 400
};

export class ExtractionError extends Error {
  readonly code: ExtractionErrorCode;
  readonly status: number;

  constructor(code: ExtractionErrorCode, message: string, status = DEFAULT_STATUS[code]) {
    super(message);
    this.name = "ExtractionError";
    this.code = code;
    this.status = status;
  }
}

export const toExtractionError = (error: unknown) => {
  if (error instanceof ExtractionError) {
    return error;
  }

  return new ExtractionError(
    "CORRUPT_DOCUMENT",
    "The file could not be processed. Re-export it and try again."
  );
};
