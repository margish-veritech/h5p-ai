import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { ExtractionError } from "@/lib/source/errors";
import {
  buildExtractRouteResponse,
  extractUploadedSource
} from "@/lib/source/extractSource";
import type { UploadedSourceFile } from "@/lib/source/types";
import { MAX_SOURCE_CHARACTERS } from "@/lib/sourceLimits";
import { createDocx, createPdf, onePixelPng } from "./fixtureBuilders";

const fixture = (name: string) =>
  fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

const uploaded = (
  name: string,
  mediaType: string,
  buffer: Buffer
): UploadedSourceFile => ({ name, mediaType, sizeBytes: buffer.length, buffer });

describe("source extraction adapters", () => {
  it("extracts UTF-8 text and strict CSV into canonical editable text", async () => {
    const textBuffer = await readFile(fixture("sample.txt"));
    const csvBuffer = await readFile(fixture("sample.csv"));

    const text = await extractUploadedSource(uploaded("sample.txt", "text/plain", textBuffer));
    const csv = await extractUploadedSource(uploaded("sample.csv", "text/csv", csvBuffer));

    expect(text.text).toContain("Photosynthesis uses sunlight");
    expect(csv.text).toContain("Row 1 | country: India");
    expect(csv.rowCount).toBe(2);
  });

  it("rejects ragged CSV records with a stable code", async () => {
    await expect(
      extractUploadedSource(
        uploaded("ragged.csv", "text/csv", Buffer.from("a,b\n1,2,3\n", "utf8"))
      )
    ).rejects.toMatchObject({ code: "CSV_STRUCTURE_INVALID" });
  });

  it("extracts text-layer PDFs and rejects scan-like PDFs", async () => {
    const textPdf = await extractUploadedSource(
      uploaded(
        "lesson.pdf",
        "application/pdf",
        createPdf("Photosynthesis converts light energy into chemical energy in green plants.")
      )
    );
    expect(textPdf.text).toContain("Photosynthesis converts light energy");
    expect(textPdf.pageCount).toBe(1);

    await expect(
      extractUploadedSource(uploaded("scan.pdf", "application/pdf", createPdf("")))
    ).rejects.toMatchObject({ code: "NO_READABLE_TEXT" });
  });

  it("extracts modern DOCX and rejects protected DOCX", async () => {
    const buffer = await createDocx([
      "Plants use chlorophyll to absorb light energy.",
      "Oxygen is released during photosynthesis."
    ]);
    const docx = await extractUploadedSource(
      uploaded(
        "lesson.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer
      )
    );
    expect(docx.text).toContain("Plants use chlorophyll");

    const protectedBuffer = await createDocx(["Protected lesson content"], {
      protected: true
    });
    await expect(
      extractUploadedSource(
        uploaded(
          "protected.docx",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          protectedBuffer
        )
      )
    ).rejects.toMatchObject({ code: "ENCRYPTED_DOCUMENT" });
  });

  it("uses an injected OCR client for images and never requires a live call", async () => {
    const ocrClient = vi.fn().mockResolvedValue({
      text: "Printed image text explains that water freezes at zero degrees Celsius.",
      warnings: []
    });
    const image = await extractUploadedSource(
      uploaded("lesson.png", "image/png", onePixelPng),
      { ocrClient }
    );

    expect(ocrClient).toHaveBeenCalledOnce();
    expect(image.text).toContain("water freezes");
    expect(image.method).toBe("ocr");
  });

  it("rejects legacy Word and does not silently truncate combined source", async () => {
    await expect(
      extractUploadedSource(uploaded("legacy.doc", "application/msword", Buffer.from("legacy")))
    ).rejects.toMatchObject({ code: "UNSUPPORTED_FORMAT" });

    expect(() =>
      buildExtractRouteResponse({ pastedText: "x".repeat(MAX_SOURCE_CHARACTERS + 1) })
    ).toThrowError(ExtractionError);
    expect(() =>
      buildExtractRouteResponse({ pastedText: "x".repeat(MAX_SOURCE_CHARACTERS + 1) })
    ).toThrowError(expect.objectContaining({ code: "SOURCE_TOO_LONG" }));
  });
});

