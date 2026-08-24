# Multi-format quiz input feasibility

**Status:** Implementation recommendation  
**Research date:** 2026-08-20  
**Scope:** Pasted text plus one optional image, CSV, PDF, or Word file feeding the existing selected True/False or multiple-choice generator. No application code or dependencies were changed for this research.

## Decision

**Conditional go.** The app can support the requested inputs reliably if “supported” is defined as the profiles below and file ingestion is a separate, server-side extraction step that returns editable normalized text. The existing quiz request shape and both H5P export paths can remain unchanged.

- **Go for the MVP:** pasted text; UTF-8 CSV; modern `.docx`; text-layer PDFs; and printed text in JPEG, PNG, or WebP images.
- **Go with managed OCR:** scanned and mixed PDFs, and image inputs, should use synchronous Google Cloud Document AI Enterprise OCR behind an adapter. A local Tesseract option is useful for offline deployments but is not the reliability baseline.
- **No-go for the MVP:** legacy binary `.doc`, password-protected/encrypted documents, macro-enabled Word files, handwriting guarantees, semantic interpretation of diagrams/charts, and more than one uploaded file per request.
- **Do not claim universal “Word” or “PDF” support.** Label the control “Word (.docx)” and tell `.doc` users to resave as `.docx` or PDF.

This boundary has no unresolved architecture choice. The only product/deployment prerequisite is approval and configuration of the managed OCR vendor. If third-party OCR is prohibited, image and scanned-PDF support must be marked experimental or removed from the reliability claim.

## Repository constraints found

1. The repository is a small, stateless Next.js 14 App Router application. The lockfile resolves Next `14.2.35`, React `18.3.1`, OpenAI SDK `4.104.0`, JSZip `3.10.1`, and TypeScript `5.9.3`; the direct dependency ranges are in [`package.json`](../package.json#L11-L27).
2. The source UI is currently a single controlled `<textarea>` with no file input or upload state ([`components/InputForm.tsx`](../components/InputForm.tsx#L153-L165)). It already lets the user choose True/False or quiz set before generation ([`components/InputForm.tsx`](../components/InputForm.tsx#L29-L44)).
3. The client maps that selection to one of two routes and sends JSON `{ text, count, difficulty }` ([`app/page.tsx`](../app/page.tsx#L18-L45)). This is the seam to preserve: extraction should end by setting the existing `text` state.
4. Both API routes accept only JSON, trim `text`, clamp question count to 1–10, and reject only empty content. Neither route imposes a text-length limit ([True/False route](../app/api/generate/true-false/route.ts#L22-L43), [question-set route](../app/api/generate/question-set/route.ts#L22-L43)). Both call `gpt-4o-mini` through Chat Completions with JSON mode.
5. Source content is interpolated directly after a plain `Content:` label in both prompts ([True/False prompt](../lib/mapGeneratedQuestions.ts#L96-L124), [multiple-choice prompt](../lib/mapGeneratedQuestionSet.ts#L160-L197)). Uploaded content therefore adds a prompt-injection surface; the implementation should delimit source data and explicitly treat instructions inside it as untrusted.
6. The README describes the app as stateless and says JSZip runs in the browser ([`README.md`](../README.md#L1-L3), [`README.md`](../README.md#L27-L30)). Both H5P builders confirm that packaging and downloading happen only when `window` exists ([True/False export](../lib/generateH5P.ts#L16-L40), [question-set export](../lib/generateQuestionSetH5P.ts#L16-L40)). Extraction does not need to modify H5P generation.
7. `next.config.mjs` only enables React strict mode; it declares no deployment, request-size, or runtime settings ([`next.config.mjs`](../next.config.mjs#L1-L6)). Hosting limits must therefore be confirmed and configured outside and inside the application.
8. There are no project test scripts or first-party test files: the only scripts are dev, build, lint, and typecheck ([`package.json`](../package.json#L5-L9)). The feature must add a fixture-driven test harness before release.
9. There is no authentication, rate limiter, upload scanner, persistent storage layer, or background-job infrastructure in the repository. A public OCR endpoint would otherwise be an unbounded cost and denial-of-service surface.

## Feasibility matrix

| Input | Reliable supported profile | Extraction path | MVP decision | Important limits and loss modes |
|---|---|---|---|---|
| Pasted text | Non-empty Unicode plain text | Normalize line endings/whitespace on the server or client; combine with an optional extracted file section | **Go** | No current length limit. Add a 40,000-character combined-source cap and never truncate silently. Formatting beyond plain text is intentionally lost. |
| CSV | UTF-8 or UTF-8-BOM, one table, consistent record width, comma/semicolon/tab delimiter confirmed in preview | Strict server parse with `csv-parse`; preserve strings; normalize headers and rows into labeled text | **Go** | CSV has no intrinsic schema. Header choice, duplicate/blank headers, delimiter, and ragged rows must be surfaced. Do not auto-cast IDs, dates, or numbers. Formula-like cells stay inert text. |
| PDF with text layer | Unencrypted PDF, at most 15 pages, coherent extractable text | `pdfjs-dist` per-page `getTextContent()`, reconstruct lines, preserve page markers | **Go with preview** | Reading order can be wrong in columns/tables; fonts or malformed PDFs can fail. Embedded diagrams are not semantically interpreted. |
| Scanned or mixed PDF | Printed text, unencrypted PDF, at most 15 pages | Try native extraction page by page, then send low-text pages/the document to managed OCR | **Go with managed OCR** | OCR is probabilistic; low resolution, skew, handwriting, equations, and complex tables reduce quality. Tesseract.js does not read PDFs directly. |
| Image | JPEG, PNG, or WebP containing printed document text; one image; orientation recoverable | Managed OCR, return plain text plus quality warnings | **Go with managed OCR** | Reject SVG, HEIC, animated formats, screenshots with too little text, and images over pixel/byte limits. Do not promise handwriting or chart understanding. |
| Modern Word | Valid non-macro `.docx` with useful textual paragraphs | `mammoth.extractRawText({buffer})`; external file access stays disabled; ignore embedded media | **Go with preview** | Raw-text mode discards layout/formatting. Complex tables, text boxes, and content stored only in images may lose semantics. Reject `.docm`, encrypted, corrupt, and image-only files. |
| Legacy Word | Word 97–2003 binary `.doc` | Optional isolated Apache Tika service in a later phase | **No-go in MVP** | `.doc` is an OLE binary format, not OOXML. Mammoth is a `.docx` converter. Supporting it introduces a Java sidecar and a much larger parser/security surface. |

The Microsoft format reference distinguishes `.doc` as the Word 97–2003 binary format and `.docx` as the default XML-based format. A `.docx` is an Open XML ZIP package, which is why ZIP expansion limits are required ([Microsoft file-format reference](https://learn.microsoft.com/en-us/office/compatibility/office-file-format-reference), [Open XML package structure](https://learn.microsoft.com/en-us/office/open-xml/about-the-open-xml-sdk)).

## Recommended MVP architecture

```text
textarea + optional one file
          |
          v
POST /api/extract (multipart/form-data, Node runtime)
  -> byte/shape/type limits
  -> signature + internal-format validation
  -> CSV | PDF | DOCX | OCR adapter
  -> normalize and combine labeled source sections
          |
          v
editable textarea preview + warnings + metadata
          |
          v
existing /api/generate/true-false OR /api/generate/question-set
          |
          v
existing review and browser-side H5P export
```

Next.js 14 Route Handlers use the Web Request API and support `request.formData()`, so a new App Router endpoint fits the current stack ([Next.js 14 Route Handler documentation](https://nextjs.org/docs/14/app/building-your-application/routing/route-handlers#request-body-formdata)). Declare the extraction route as the Node.js runtime so document libraries are never bundled for an Edge runtime.

### Client responsibilities

- Keep the existing textarea. Add a single-file picker and drag/drop target; allow pasted text, one file, or both.
- Use `accept=".csv,.pdf,.docx,image/jpeg,image/png,image/webp"` only as a chooser hint. MDN explicitly notes that `accept` does not validate a selected file, so the server remains authoritative ([MDN `accept`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/accept)).
- Preflight byte size for fast feedback, upload with progress/cancel, then replace or append to the existing controlled `text` value using clearly labeled sections such as `--- PASTED TEXT ---` and `--- FILE: lesson.pdf, PAGE 1 ---`.
- Require the user to review editable extracted text before “Generate questions.” Show method (`native text`, `OCR`, `CSV`, `DOCX`), page/row count, warnings, and OCR quality.
- Do not evaluate HTML, links, spreadsheet formulas, macros, or embedded media.

### Server responsibilities

Create one `POST /api/extract` route and parser modules behind a shared interface. It should accept one optional `File` plus optional `pastedText`, and return:

```ts
type ExtractedSource = {
  text: string;
  format: "text" | "csv" | "pdf" | "image" | "docx";
  method: "plain" | "structured-csv" | "native-pdf" | "ocr" | "docx-raw";
  filename?: string;       // display only; never a filesystem path
  pageCount?: number;
  rowCount?: number;
  warnings: string[];
};
```

Processing order must be: request limit -> extension/MIME allowlist -> binary signature -> internal structure -> parser-specific limits -> extraction with timeout -> normalization -> combined-length check -> response. `file-type` can provide a best-effort magic-number check but its documentation warns that detection is not a validity or safety guarantee; PDF and OOXML still need structural parsing ([`file-type`](https://www.npmjs.com/package/file-type)).

Keep files in bounded memory only and drop buffers immediately after the response. Do not create public URLs, persist raw files, include source text in logs, or send raw documents to OpenAI. Only the normalized, user-reviewed text goes through the existing quiz routes.

### Parser behavior

**CSV**

- Decode only UTF-8/UTF-8-BOM using fatal decoding; reject other encodings with conversion guidance.
- Use `csv-parse` with `bom: true`, `skip_empty_lines: true`, `cast: false`, a bounded `max_record_size`, and strict equal-width records. Its official option set supports these controls, and inconsistent column counts fail by default ([CSV Parse options](https://csv.js.org/parse/options/), [column-count behavior](https://csv.js.org/parse/options/relax_column_count/)).
- Detect comma, semicolon, or tab from a bounded sample, show the choice, and let the user override before generation. Treat the first non-empty row as headers by default.
- Preserve every cell as a string. Canonicalize blank headers to `column_N` and duplicate headers to `name_2`, while warning the user.
- Normalize rows with explicit header/value association, not a bare comma-joined blob. Example: `Row 4 | country: India | population: 1.4 billion`. Formula prefixes such as `=`, `+`, `-`, and `@` remain inert text; protect them if a future feature ever re-exports CSV. OWASP documents spreadsheet formula injection when untrusted cells are opened by spreadsheet software ([OWASP CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection)).

**PDF**

- Use Mozilla `pdfjs-dist` for native text. PDF.js supports loading a document and exposes individual pages and text content; its examples include Node usage ([PDF.js examples](https://mozilla.github.io/pdf.js/examples/), [`getDocument` API](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html)).
- Extract each page separately, group text items into lines using their coordinates/line endings, and include page boundaries. Do not silently sort the entire document as one stream.
- Classify a page as “low text” when it contains fewer than 25 letters/digits after normalization. If any substantive page is low-text, use the OCR adapter for those pages or the complete document. This is a product heuristic, not a PDF standard; tune it against the golden corpus.
- Reject encrypted/password-protected, malformed, over-page-limit, or effectively empty PDFs. Warn that columns/tables may need manual correction.

**Image and scanned-PDF OCR**

- Recommended reliability path: synchronous Google Cloud Document AI Enterprise Document OCR through `@google-cloud/documentai`. It accepts PDF, JPEG, PNG, WebP and other documented image formats; Google recommends at least 200 DPI and generally 300 DPI or higher for best OCR ([supported files](https://docs.cloud.google.com/document-ai/docs/file-types)).
- The service limit is currently 40 MB and 15 synchronous pages for Enterprise OCR, but this app should use the stricter limits below ([Document AI limits](https://docs.cloud.google.com/document-ai/limits)). Enable native PDF parsing and image-quality scores where applicable ([OCR process options](https://docs.cloud.google.com/document-ai/docs/reference/rest/v1/ProcessOptions)).
- Return confidence/quality warnings. Initial release gates: fail when fewer than 25 letters/digits are recovered; require explicit user confirmation when mean token confidence is below `0.80`; always show the text preview. Tune the confidence threshold from real fixtures before GA.
- Local-only alternative: Tesseract.js is Apache-2.0, runs in browser or Node, and supports many printed-text languages, but its own FAQ says it does not support PDFs and does not support handwriting. PDF pages must first be rendered to images, and Tesseract performs best near 300 DPI ([Tesseract.js FAQ](https://github.com/naptha/tesseract.js/blob/master/docs/faq.md), [quality guidance](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html)). That extra rendering/worker/memory path is not recommended for this app's first reliable release.

**DOCX**

- Use `mammoth.extractRawText({ buffer })` rather than rendering Mammoth HTML into the page. The API accepts a Node buffer and emits raw text with paragraph boundaries ([Mammoth usage](https://github.com/mwilliamson/mammoth.js#extract-raw-text)).
- Keep `externalFileAccess` disabled, never execute macros, and ignore embedded images in the MVP. Validate the OOXML ZIP contains `[Content_Types].xml` and `word/document.xml`; reject packages containing macro parts or exceeding ZIP limits.
- Mammoth warns that it performs no sanitization, source documents may reference external files, and pathological documents can consume excessive CPU/memory. Run extraction in an isolated worker with a timeout even when using raw-text mode ([Mammoth security notes](https://github.com/mwilliamson/mammoth.js#security)).
- If `.doc` later becomes mandatory, deploy current stable Apache Tika as a separately sandboxed service, not inside the Next.js process. Tika's Office parser supports OLE2 and OOXML; its broad parser set and Java runtime materially increase patching and isolation duties ([Tika supported formats](https://tika.apache.org/3.2.2/formats.html), [Tika project](https://tika.apache.org/)).

### Generator handoff and prompt hardening

After preview approval, pass the resulting `text` to the already selected endpoint with the existing `count` and `difficulty`. Do not add file parsing to both generator routes.

Before launch, make a small shared prompt hardening change: wrap source in unique start/end delimiters and tell the model that the delimited material is untrusted reference data, not instructions. Also apply the 40,000-character limit in a shared server validator used by both generator routes; client-side limits are only convenience checks. The current model has a 128,000-token context window, but a substantially smaller product cap controls cost, latency, adversarial inputs, and question quality ([official GPT-4o mini model page](https://developers.openai.com/api/docs/models/gpt-4o-mini)).

## Product limits for the MVP

These are application limits, intentionally below vendor maxima:

| Limit | Value | Enforcement |
|---|---:|---|
| Uploaded files | 1 per extraction request | Client and server |
| Total multipart body | 10 MiB | Reverse proxy/platform and route before parsing where possible |
| Image formats | JPEG, PNG, WebP | Extension, reported MIME, magic bytes, decoder |
| Image dimensions | 20 megapixels; one frame | Header/decoder before OCR |
| PDF | 15 pages; unencrypted | PDF parser before OCR |
| DOCX | 10 MiB compressed; 1,000 ZIP entries; 50 MiB total uncompressed | OOXML ZIP inspection before Mammoth |
| CSV | 5 MiB; 10,000 rows; 100 columns; 64 KiB per record | Decoder/parser |
| Combined normalized source | 40,000 Unicode characters; warning at 30,000 | Extraction route and both generator routes |
| Local extraction wall time | 10 seconds | Abort/worker termination |
| OCR wall time | 30 seconds | Abort provider request and map timeout error |
| Concurrency | Per-user/IP rate limit plus global OCR concurrency cap | Gateway/application |

Do not silently truncate pages, rows, cells, or normalized text. A rejected limit should name the limit and suggest splitting or shortening the source.

## Security and privacy

1. **Untrusted upload handling:** OWASP recommends extension allowlists, server-side type/signature checks, generated storage names, size limits, authorization, malware scanning, storage outside the webroot, and defense in depth. It specifically calls out parser exploits and ZIP/XML bombs ([OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)). Apply the relevant controls even though this design avoids persistence.
2. **Isolation:** run PDF/DOCX parsing in a worker process/thread with CPU, memory, and wall-clock limits. For a public deployment, add malware scanning/CDR before parsing PDFs and Office documents. Keep parser dependencies pinned and patched.
3. **Type confusion:** never trust the filename, browser MIME, or `accept`. Check all three plus magic bytes and internal structures. Reject mismatches rather than guessing.
4. **No active content:** reject SVG and macro-enabled Office files; never render extracted HTML; escape filename/warning text; keep formula-looking CSV cells as text.
5. **Prompt injection and data poisoning:** uploaded text may say “ignore previous instructions.” Delimit it as data, preserve the existing “use only facts” rule, cap it, and keep human review. No prompt can make model output a verified fact; the review screen remains a required control.
6. **Abuse/cost:** the repository has no authentication or rate limit. Require authentication for public use, rate-limit extraction and generation, meter OCR pages, cap concurrency, and return `429` with retry guidance.
7. **Retention:** process local files in memory and do not log names or contents. Google states synchronous Document AI input is encrypted in flight, processed in memory, and not persisted to disk; it also states customer content is not used to train Document AI models ([Document AI security](https://docs.cloud.google.com/document-ai/docs/security)). Confirm region, DPA, access-control, and institutional policy before enabling it.
8. **Existing OpenAI transfer:** normalized source is already sent to OpenAI Chat Completions. OpenAI states API data is not used for training unless the customer opts in, while default abuse-monitoring logs may retain customer content for up to 30 days; eligible customers can request retention controls ([OpenAI API data controls](https://developers.openai.com/api/docs/guides/your-data#default-usage-policies-by-endpoint)). The UI/privacy notice must disclose both OpenAI and the OCR vendor and must not invite regulated or confidential uploads unless the deployment's contracts/configuration permit them.
9. **Secrets:** keep `OPENAI_API_KEY` and Google credentials server-only. Use workload identity/service accounts with least privilege; do not add credential JSON to the repository.

## Validation and error UX

Use stable machine-readable error codes plus user-facing text. Do not expose parser stack traces.

| HTTP | Code | User-facing behavior |
|---:|---|---|
| 400 | `SOURCE_REQUIRED` | “Paste text or choose one supported file.” |
| 413 | `FILE_TOO_LARGE` / `SOURCE_TOO_LONG` / `TOO_MANY_PAGES` | State the actual and allowed limit; suggest split/trim. |
| 415 | `UNSUPPORTED_FORMAT` / `TYPE_MISMATCH` | List accepted formats; for `.doc`, say “Resave as .docx or PDF.” |
| 422 | `ENCRYPTED_DOCUMENT` | “Password-protected files cannot be processed. Upload an unlocked copy.” |
| 422 | `CSV_STRUCTURE_INVALID` | Include record number and expected/actual column counts; offer delimiter/header correction. |
| 422 | `NO_READABLE_TEXT` | Suggest a clearer 300-DPI scan or paste the text; do not proceed to generation. |
| 422 | `LOW_OCR_CONFIDENCE` | Show editable extraction and require confirmation rather than claiming success. |
| 422 | `CORRUPT_DOCUMENT` | Ask for re-export; do not reveal library internals. |
| 429 | `RATE_LIMITED` | Preserve the textarea/file selection and state when retry is allowed. |
| 502/504 | `OCR_UNAVAILABLE` / `EXTRACTION_TIMEOUT` | Preserve input state; offer retry and pasted-text fallback. |

Success UX should say, for example, “Extracted 6 pages with native PDF text” or “OCR extracted 2 pages; review highlighted low-confidence text.” Generation remains disabled until extraction succeeds and the combined preview is non-empty and within limits.

## Dependencies, services, and licensing

No dependency should be added without pinning an exact reviewed version in the lockfile and running a production license/vulnerability scan.

| Component | Purpose and placement | License/service note |
|---|---|---|
| [`csv-parse`](https://csv.js.org/parse/) | Strict server-side CSV parser | MIT; no external dependencies; streaming API available. |
| [`pdfjs-dist`](https://mozilla.github.io/pdf.js/) | Server-side native PDF text extraction | Apache-2.0; can be bundle/worker/font-data heavy, so verify Next.js Node bundling and pin the worker/API versions together. |
| [`mammoth`](https://github.com/mwilliamson/mammoth.js) | Server-side `.docx` raw-text extraction | BSD-2-Clause; security warnings require timeout/isolation and external-file access disabled. |
| [`file-type`](https://www.npmjs.com/package/file-type) | Best-effort binary signature detection | MIT; ESM-only in current releases; not a parser or security proof and does not identify text CSV. |
| [`@google-cloud/documentai`](https://www.npmjs.com/package/@google-cloud/documentai) | Server-side managed OCR adapter | Client library Apache-2.0; commercial Google Cloud service. Current published OCR pricing is page-based and should be budget-alerted ([pricing](https://cloud.google.com/products/document-ai/pricing)). |
| [Tesseract.js](https://github.com/naptha/tesseract.js) | Optional offline image OCR, not default | Apache-2.0 including language data; WebAssembly/worker and language-model assets add cold-start, memory, and deployment complexity. |
| [Apache Tika](https://tika.apache.org/) | Optional phase-2 `.doc` sidecar | Apache-2.0 core with bundled-component notices; requires a maintained Java container and sandbox. |
| [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) | Unit/integration and browser tests | Development-only; include their licenses and browser redistribution notices in dependency review. |

Avoid AGPL PDF renderers such as MuPDF unless the project deliberately accepts that license or buys a commercial license. PDF.js plus managed OCR avoids that issue.

## Test strategy and release gates

### Fixture corpus

Commit only synthetic or redistributable fixtures with expected normalized output:

- Text: empty/whitespace, CRLF, Unicode, right-to-left, 30k warning, 40k boundary, prompt-injection phrases.
- CSV: RFC-style quoted commas/newlines/escaped quotes, UTF-8 BOM, semicolon/tab, blank and duplicate headers, leading zeros, dates, formulas, ragged rows, huge cell, invalid UTF-8, max row/column boundaries.
- PDF: simple text, multi-page, two-column, table, ligatures, mixed text/scan, scan-only, rotated scan, encrypted, malformed, zero-page/empty, page-limit, and parser timeout/bomb fixture.
- DOCX: paragraphs, headings/lists, tables, text boxes, Unicode, embedded images, external relationships, image-only, `.docm`, renamed ZIP, missing required OOXML parts, corrupt ZIP, ZIP bomb, and legacy `.doc` rejection.
- Images: clean 300-DPI, 200-DPI, low resolution, skew/rotation, noise, multilingual printed text, handwriting rejection/warning, huge dimensions, corrupted bytes, spoofed MIME, SVG/GIF/HEIC rejection.

### Automated layers

1. **Unit:** type detection, each parser, delimiter/header normalization, combined-source formatting, caps, error mapping, and prompt delimiters. Mock OCR responses.
2. **Contract/integration:** multipart `/api/extract`, both existing generation routes with mocked OpenAI, cancellation/timeouts, no raw content in logs, and the same normalized text reaching either selected generator.
3. **Browser:** paste-only; file-only; paste-plus-file; drag/drop; preview edit; warnings; back/regenerate; both content types; H5P download regression.
4. **Security:** spoofed types, polyglots, traversal filenames, ZIP/XML bombs, oversized pixels/pages/records, parser hangs, repeated OCR calls, prompt injection, active links/macros, and EICAR in the malware-scanning environment.
5. **Dependency/deployment:** `npm run typecheck`, lint/build, software-composition analysis, cold-start/memory tests in the actual Node hosting target, and credential/egress checks.

### Measurable acceptance gates

- `100%` cell fidelity for valid CSV fixtures after normalization; invalid record width always rejected with its record number.
- At least `99.5%` normalized character agreement for text-layer PDF and DOCX golden fixtures, excluding explicitly documented layout loss.
- At least `98%` character accuracy on clean 300-DPI printed English OCR fixtures and at least `90%` on the agreed degraded-photo set; handwriting is excluded. Add representative production languages before advertising them.
- No silent truncation and no accepted file outside the allowlist/limits.
- P95 local extraction under 5 seconds and P95 synchronous OCR under 30 seconds at the stated limits in the actual deployment.
- Raw files and source text absent from application logs, analytics, error reports, and persistent storage.
- For a fixed evaluation set, every generated question is reviewed as supported by the normalized preview; ship only when unsupported-fact rate is `0` in the release gate set for both True/False and multiple choice.

## Implementation sequence

1. Add shared source limits/normalization and prompt delimiters to both generator routes.
2. Add the Node `/api/extract` contract, upload security controls, stable errors, and text/CSV support.
3. Add DOCX raw-text and native PDF extraction in isolated workers.
4. Add the managed OCR adapter, quality metadata, budget/rate controls, and scan/mixed-PDF fallback.
5. Add UI upload/progress/preview/warnings while retaining the textarea as the single source of truth.
6. Build the golden corpus and all release gates; enable formats one at a time behind feature flags.
7. Complete privacy/DPA, malware scanning, production-host limits, and operational alerts before public launch.

## Explicit go/no-go recommendation

**Approve implementation** for the scoped MVP and architecture above. It is a modest extension because all successful inputs converge to the existing editable `text` state and generator routes.

**Do not approve a blanket claim** that the app supports every image, PDF, CSV, or Word document. Public launch is a no-go until the managed OCR vendor, authentication/rate limiting, parser isolation, malware controls, and fixture gates are in place. Legacy `.doc` remains a no-go unless a separately operated Apache Tika service is explicitly accepted as phase 2.
