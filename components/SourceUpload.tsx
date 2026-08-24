"use client";

import { useRef, useState } from "react";
import { SOURCE_FILE_ACCEPT, SOURCE_FILE_HELP } from "@/lib/sourceLimits";
import type { ExtractRouteResponse } from "@/lib/source/types";

type SourceUploadProps = {
  disabled: boolean;
  isExtracting: boolean;
  progress: number;
  pendingFilename: string | null;
  source: ExtractRouteResponse["source"] | null;
  stats: ExtractRouteResponse["stats"] | null;
  warnings: string[];
  error: string | null;
  onFilesSelected: (files: File[]) => void;
  onCancel: () => void;
};

const METHOD_LABELS: Record<ExtractRouteResponse["source"]["method"], string> = {
  plain: "plain text",
  "structured-csv": "structured CSV",
  "native-pdf": "native PDF text",
  "docx-raw": "Word text",
  ocr: "OpenAI image OCR",
  combined: "pasted text + uploaded file"
};

const formatBytes = (bytes?: number) => {
  if (typeof bytes !== "number") {
    return null;
  }

  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MiB`
    : `${Math.max(1, Math.round(bytes / 1024))} KiB`;
};

export function SourceUpload({
  disabled,
  isExtracting,
  progress,
  pendingFilename,
  source,
  stats,
  warnings,
  error,
  onFilesSelected,
  onCancel
}: SourceUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const chooseFiles = (files: File[]) => {
    onFilesSelected(files);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="panel-muted" aria-labelledby="upload-source-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="upload-source-title" className="font-semibold text-ink">
            Add one source file
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Optional: {SOURCE_FILE_HELP}. The extracted text remains editable above.
          </p>
        </div>
        <span className="badge-ocean shrink-0">10 MiB max</span>
      </div>

      <div
        className={`mt-4 rounded-xl border border-dashed p-5 text-center transition ${
          isDragging ? "border-ocean bg-ocean-soft" : "border-stone-300 bg-white"
        } ${disabled || isExtracting ? "opacity-60" : "hover:border-ocean"}`}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled && !isExtracting) {
            setIsDragging(true);
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!disabled && !isExtracting) {
            chooseFiles(Array.from(event.dataTransfer.files));
          }
        }}
      >
        <input
          ref={inputRef}
          id="source-file"
          className="sr-only"
          type="file"
          accept={SOURCE_FILE_ACCEPT}
          disabled={disabled || isExtracting}
          onChange={(event) => chooseFiles(Array.from(event.target.files ?? []))}
        />
        <p className="text-sm text-muted">Drop one file here, or</p>
        <label
          htmlFor="source-file"
          className={`btn-secondary mt-3 inline-flex ${
            disabled || isExtracting ? "pointer-events-none opacity-60" : ""
          }`}
        >
          Choose file
        </label>
        <p className="mt-3 text-xs text-muted">
          Legacy .doc, macro/protected files, scanned PDFs, and animated images are rejected.
        </p>
      </div>

      {isExtracting ? (
        <div className="mt-4" aria-live="polite">
          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="truncate font-medium text-ink">
              {progress < 100 ? "Uploading" : "Extracting"} {pendingFilename ?? "source"}
            </p>
            <button type="button" className="text-ocean underline" onClick={onCancel}>
              Cancel
            </button>
          </div>
          <progress
            className="mt-2 h-2 w-full overflow-hidden rounded-full accent-ocean"
            max={100}
            value={progress}
            aria-label="Source upload progress"
          >
            {progress}%
          </progress>
          <p className="mt-1 text-xs text-muted">
            {progress < 100 ? `${progress}% uploaded` : "Upload complete; extracting text…"}
          </p>
        </div>
      ) : null}

      {source ? (
        <div className="mt-4 rounded-xl border border-pine/20 bg-pine-soft/50 px-4 py-3 text-sm">
          <p className="font-semibold text-pine-dark">
            Extracted {source.fileName ?? "source"}
          </p>
          <p className="mt-1 text-muted">
            {METHOD_LABELS[source.method]}
            {formatBytes(source.sizeBytes) ? ` · ${formatBytes(source.sizeBytes)}` : ""}
            {stats?.pages ? ` · ${stats.pages} page${stats.pages === 1 ? "" : "s"}` : ""}
            {stats?.rows ? ` · ${stats.rows.toLocaleString()} data rows` : ""}
            {stats ? ` · ${stats.characters.toLocaleString()} characters` : ""}
          </p>
          <p className="mt-2 text-xs text-muted">
            Choosing another file rebuilds the preview and replaces the previous upload.
          </p>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Review before generating</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <p className="mt-4 text-xs leading-5 text-muted">
        Images are sent to OpenAI for printed-text OCR. Other files are processed in memory;
        files are not added to the H5P export.
      </p>
    </div>
  );
}

