export const MAX_MULTIPART_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_CSV_BYTES = 5 * 1024 * 1024;
export const MAX_CSV_ROWS = 10_000;
export const MAX_CSV_COLUMNS = 100;
export const MAX_CSV_RECORD_BYTES = 64 * 1024;
export const MAX_PDF_PAGES = 15;
export const MAX_DOCX_ENTRIES = 1_000;
export const MAX_DOCX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 20_000_000;
export const MAX_SOURCE_CHARACTERS = 40_000;
export const SOURCE_WARNING_CHARACTERS = 30_000;
export const MIN_READABLE_CHARACTERS = 25;
export const LOCAL_EXTRACTION_TIMEOUT_MS = 10_000;
export const OCR_TIMEOUT_MS = 30_000;

export const SOURCE_FILE_ACCEPT =
  ".txt,.csv,.pdf,.docx,image/jpeg,image/png,image/webp";

export const SOURCE_FILE_HELP =
  "UTF-8 text or CSV, text-layer PDF, Word (.docx), JPEG, PNG, or WebP";
