import { parse } from "csv-parse/sync";
import {
  MAX_CSV_BYTES,
  MAX_CSV_COLUMNS,
  MAX_CSV_RECORD_BYTES,
  MAX_CSV_ROWS
} from "../../sourceLimits";
import { ExtractionError } from "../errors";
import { decodeUtf8Strict, validateNormalizedSource } from "../normalizeText";
import type { ExtractedSource, UploadedSourceFile } from "../types";

const DELIMITERS = [",", ";", "\t"] as const;

const detectDelimiter = (sample: string) => {
  const firstLines = sample.split(/\r\n?|\n/).slice(0, 10).join("\n");
  const scores = DELIMITERS.map((delimiter) => ({
    delimiter,
    count: firstLines.split(delimiter).length - 1
  }));

  scores.sort((left, right) => right.count - left.count);
  return scores[0]?.count ? scores[0].delimiter : ",";
};

const normalizeHeaders = (headers: string[], warnings: string[]) => {
  const seen = new Map<string, number>();

  return headers.map((header, index) => {
    const base = header.trim() || `column_${index + 1}`;

    if (!header.trim()) {
      warnings.push(`Blank CSV header at column ${index + 1} was labeled ${base}.`);
    }

    const key = base.toLowerCase();
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);

    if (count > 0) {
      const renamed = `${base}_${count + 1}`;
      warnings.push(`Duplicate CSV header "${base}" was labeled ${renamed}.`);
      return renamed;
    }

    return base;
  });
};

export const extractCsvFile = (file: UploadedSourceFile): ExtractedSource => {
  if (file.sizeBytes > MAX_CSV_BYTES) {
    throw new ExtractionError(
      "FILE_TOO_LARGE",
      `CSV files are limited to ${(MAX_CSV_BYTES / 1024 / 1024).toFixed(0)} MiB.`
    );
  }

  const decoded = decodeUtf8Strict(
    file.buffer,
    "CSV files must be valid UTF-8. Save the file as UTF-8 CSV and try again."
  );
  const delimiter = detectDelimiter(decoded.slice(0, 64 * 1024));
  const warnings: string[] = [`Detected "${delimiter === "\t" ? "tab" : delimiter}" as the CSV delimiter.`];

  let records: string[][];

  try {
    records = parse(decoded, {
      bom: true,
      cast: false,
      delimiter,
      max_record_size: MAX_CSV_RECORD_BYTES,
      skip_empty_lines: true
    });
  } catch (error) {
    const record =
      typeof error === "object" && error !== null && "records" in error
        ? Number((error as { records?: unknown }).records) + 1
        : null;
    throw new ExtractionError(
      "CSV_STRUCTURE_INVALID",
      record && Number.isFinite(record)
        ? `CSV record ${record} has invalid quoting, an oversized value, or an inconsistent column count.`
        : "The CSV has invalid quoting, an oversized value, or inconsistent column counts."
    );
  }

  if (records.length < 2) {
    throw new ExtractionError(
      "NO_READABLE_TEXT",
      "The CSV must include a header row and at least one data row."
    );
  }

  if (records.length - 1 > MAX_CSV_ROWS) {
    throw new ExtractionError(
      "FILE_TOO_LARGE",
      `CSV files are limited to ${MAX_CSV_ROWS.toLocaleString()} data rows.`
    );
  }

  const headers = normalizeHeaders(records[0] ?? [], warnings);

  if (headers.length > MAX_CSV_COLUMNS) {
    throw new ExtractionError(
      "FILE_TOO_LARGE",
      `CSV files are limited to ${MAX_CSV_COLUMNS.toLocaleString()} columns.`
    );
  }

  const formulaCellCount = records
    .slice(1)
    .flat()
    .filter((cell) => /^[=+\-@]/.test(cell.trim())).length;

  if (formulaCellCount > 0) {
    warnings.push("Formula-looking CSV cells were preserved as inert text.");
  }

  const rows = records.slice(1).map((record, index) => {
    const cells = headers.map((header, cellIndex) => `${header}: ${record[cellIndex] ?? ""}`);
    return `Row ${index + 1} | ${cells.join(" | ")}`;
  });

  const normalized = validateNormalizedSource(
    [`CSV file: ${file.name}`, `Columns: ${headers.join(", ")}`, ...rows].join("\n")
  );

  return {
    text: normalized.text,
    format: "csv",
    method: "structured-csv",
    filename: file.name,
    mediaType: "text/csv",
    sizeBytes: file.sizeBytes,
    rowCount: records.length - 1,
    warnings: [...warnings, ...normalized.warnings]
  };
};
