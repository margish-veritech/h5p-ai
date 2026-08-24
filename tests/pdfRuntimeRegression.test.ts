import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/extract/route";
import { classifyPdfError } from "@/lib/source/adapters/pdf";
import { createPdf } from "./fixtureBuilders";

const fixture = (name: string) =>
  fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

const pdfRequest = (buffer: Buffer, name: string) => {
  const formData = new FormData();
  formData.append(
    "file",
    new File([new Uint8Array(buffer)], name, { type: "application/pdf" })
  );
  return new Request("http://localhost/api/extract", {
    method: "POST",
    body: formData
  });
};

const namedError = (name: string) => Object.assign(new Error("internal detail"), { name });

describe("PDF server-runtime regressions", () => {
  it.each([
    ["quartz-text.pdf", "Photosynthesis"],
    ["chrome-text.pdf", "Evaporation"]
  ])("extracts a text-layer PDF produced by %s", async (name, expectedText) => {
    const response = await POST(pdfRequest(await readFile(fixture(name)), name));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.text).toContain(expectedText);
    expect(payload.source).toMatchObject({ kind: "pdf", method: "native-pdf" });
    expect(payload.stats.pages).toBe(1);
  });

  it("keeps encrypted, corrupt, and scan-only PDFs on distinct safe contracts", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const encrypted = await POST(
      pdfRequest(await readFile(fixture("encrypted-attachment.pdf")), "encrypted.pdf")
    );
    expect(encrypted.status).toBe(422);
    expect(await encrypted.json()).toMatchObject({ code: "ENCRYPTED_DOCUMENT" });

    const corrupt = await POST(
      pdfRequest(Buffer.from("%PDF-1.4\nnot a valid PDF\n", "ascii"), "corrupt.pdf")
    );
    expect(corrupt.status).toBe(422);
    expect(await corrupt.json()).toMatchObject({ code: "CORRUPT_DOCUMENT" });

    const scanOnly = await POST(pdfRequest(createPdf(""), "scan-only.pdf"));
    expect(scanOnly.status).toBe(422);
    expect(await scanOnly.json()).toMatchObject({ code: "NO_READABLE_TEXT" });
  });

  it("classifies encrypted, invalid, and parser-runtime failures without leaking details", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(classifyPdfError(namedError("PasswordException"))).toMatchObject({
      code: "ENCRYPTED_DOCUMENT",
      status: 422
    });
    expect(classifyPdfError(namedError("InvalidPDFException"))).toMatchObject({
      code: "CORRUPT_DOCUMENT",
      status: 422
    });

    const unavailable = classifyPdfError(new Error("fake worker internal path"));
    expect(unavailable).toMatchObject({
      code: "PDF_PROCESSING_UNAVAILABLE",
      status: 503
    });
    expect(unavailable.message).not.toContain("fake worker");
    expect(log).toHaveBeenCalledWith(
      "[pdf-extraction] PDF.js failure",
      expect.objectContaining({ category: "runtime", message: "fake worker internal path" })
    );
  });

  it("keeps PDF.js external to the Next server bundle so its worker resolves", async () => {
    const config = await readFile(
      fileURLToPath(new URL("../next.config.mjs", import.meta.url)),
      "utf8"
    );

    expect(config).toContain('serverComponentsExternalPackages: ["pdfjs-dist"]');
  });
});
