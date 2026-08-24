export type SourceFormat = "text" | "csv" | "pdf" | "docx" | "image";

export type ExtractionMethod =
  | "plain"
  | "structured-csv"
  | "native-pdf"
  | "docx-raw"
  | "ocr";

export type ExtractionErrorCode =
  | "SOURCE_REQUIRED"
  | "MULTIPLE_FILES"
  | "FILE_EMPTY"
  | "FILE_TOO_LARGE"
  | "SOURCE_TOO_LONG"
  | "UNSUPPORTED_FORMAT"
  | "TYPE_MISMATCH"
  | "CSV_STRUCTURE_INVALID"
  | "NO_READABLE_TEXT"
  | "ENCRYPTED_DOCUMENT"
  | "CORRUPT_DOCUMENT"
  | "TOO_MANY_PAGES"
  | "IMAGE_TOO_LARGE"
  | "PDF_PROCESSING_UNAVAILABLE"
  | "OCR_UNAVAILABLE"
  | "EXTRACTION_TIMEOUT"
  | "INVALID_REQUEST";

export type DetectedSource = {
  format: SourceFormat;
  mediaType: string;
  extension: string;
};

export type UploadedSourceFile = {
  name: string;
  mediaType: string;
  sizeBytes: number;
  buffer: Buffer;
};

export type ExtractedSource = {
  text: string;
  format: SourceFormat;
  method: ExtractionMethod;
  filename?: string;
  mediaType?: string;
  sizeBytes?: number;
  pageCount?: number;
  rowCount?: number;
  warnings: string[];
};

export type ExtractRouteResponse = {
  text: string;
  source: {
    kind: SourceFormat | "mixed";
    fileName?: string;
    mediaType?: string;
    sizeBytes?: number;
    method: ExtractionMethod | "combined";
  };
  stats: {
    characters: number;
    pages?: number;
    rows?: number;
  };
  warnings: string[];
};

export type OcrClient = (input: {
  buffer: Buffer;
  filename: string;
  mediaType: string;
}) => Promise<{
  text: string;
  warnings?: string[];
}>;
