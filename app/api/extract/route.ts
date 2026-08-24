import { NextResponse } from "next/server";
import { MAX_MULTIPART_BYTES } from "@/lib/sourceLimits";
import { ExtractionError, toExtractionError } from "@/lib/source/errors";
import {
  buildExtractRouteResponse,
  extractUploadedSource
} from "@/lib/source/extractSource";
import type { UploadedSourceFile } from "@/lib/source/types";

export const runtime = "nodejs";

const isFile = (value: FormDataEntryValue): value is File =>
  typeof File !== "undefined" && value instanceof File;

const parseContentLength = (request: Request) => {
  const raw = request.headers.get("content-length");

  if (!raw) {
    return null;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

const toUploadedSourceFile = async (file: File): Promise<UploadedSourceFile> => ({
  name: file.name,
  mediaType: file.type,
  sizeBytes: file.size,
  buffer: Buffer.from(await file.arrayBuffer())
});

export async function POST(request: Request) {
  try {
    const contentLength = parseContentLength(request);

    if (contentLength !== null && contentLength > MAX_MULTIPART_BYTES) {
      throw new ExtractionError(
        "FILE_TOO_LARGE",
        "Uploads are limited to 10 MiB."
      );
    }

    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      throw new ExtractionError(
        "INVALID_REQUEST",
        "Extraction requests must use multipart/form-data."
      );
    }

    const formData = await request.formData();
    const allFileEntries = Array.from(formData.values()).filter(isFile);
    const fileEntries = formData.getAll("file").filter(isFile);
    const pastedValue = formData.get("pastedText");
    const pastedText = typeof pastedValue === "string" ? pastedValue : "";

    if (allFileEntries.length > 1) {
      throw new ExtractionError("MULTIPLE_FILES", "Upload only one file at a time.");
    }

    if (allFileEntries.length === 1 && fileEntries.length !== 1) {
      throw new ExtractionError("INVALID_REQUEST", "Upload the source using the file field.");
    }

    if (fileEntries.length === 0 && !pastedText.trim()) {
      throw new ExtractionError(
        "SOURCE_REQUIRED",
        "Paste text or choose one supported file."
      );
    }

    const uploaded = fileEntries[0]
      ? await extractUploadedSource(await toUploadedSourceFile(fileEntries[0]))
      : undefined;
    const response = buildExtractRouteResponse({ pastedText, uploaded });

    return NextResponse.json(response);
  } catch (error) {
    const extractionError = toExtractionError(error);

    return NextResponse.json(
      {
        error: extractionError.message,
        code: extractionError.code
      },
      { status: extractionError.status }
    );
  }
}
