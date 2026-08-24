# Multi-format quiz input code audit

**Audit scope:** repository state on branch `dev`, commit `4a0b10c`

**Purpose:** feasibility and implementation plan only; no application code or dependency changes are authorized before the feasibility gate is approved.

## Executive conclusion

Multi-format input is architecturally feasible without changing the existing True/False or Quiz Set output models. The safest seam is a single, server-only extraction endpoint and dispatcher that converts every supported upload into canonical plain text. The user should be able to review and edit that text before generation. Both existing generation endpoints can then continue to accept the current JSON contract, `{ text, count, difficulty }`.

This establishes a strict boundary:

```text
pasted text -------------------------------+
                                             v
uploaded file -> one extraction pipeline -> canonical editable text
                                             |
                     +-----------------------+----------------------+
                     v                                              v
          True/False generation                         Quiz Set generation
                     |                                              |
                     v                                              v
          existing review/export                         existing review/export
```

Source-specific logic must stop at canonical text. Quiz-specific logic must not know whether the text came from a textarea, image, CSV, PDF, or Word document. This prevents duplicated extraction or generation paths for each source/quiz combination.

The feasibility gate is conditional on decisions about parser/OCR providers, supported Word/PDF variants, upload and extracted-text limits, privacy, and the actual deployment platform limits. These blockers are detailed below.

## Current application map

| Area | Current responsibility | Key evidence |
| --- | --- | --- |
| Page controller | Owns all create/review, quiz type, source text, settings, results, loading, and error state | `app/page.tsx:16-32` |
| Quiz-type routing | Maps `true-false` and `question-set` to two fixed API paths | `app/page.tsx:18-21`, `lib/types.ts:3` |
| Input UI | Renders the quiz-type buttons, one textarea, count, difficulty, and submit | `components/InputForm.tsx:29-44`, `components/InputForm.tsx:121-225` |
| True/False API | Parses the JSON request, calls OpenAI, maps the model JSON, and returns an array | `app/api/generate/true-false/route.ts:14-94` |
| Quiz Set API | Parses the same JSON request, calls OpenAI, maps the model JSON, and returns a quiz object | `app/api/generate/question-set/route.ts:14-88` |
| Prompt/mapping | Contains quiz-specific prompt text and defensive model-output coercion | `lib/mapGeneratedQuestions.ts:36-137`, `lib/mapGeneratedQuestionSet.ts:38-197` |
| Review state | Allows edits to generated True/False and multiple-choice content | `components/ReviewCard.tsx:14-131`, `components/MultiChoiceReviewCard.tsx:15-142` |
| Export validation | Validates edited content immediately before export | `lib/validateContent.ts:5-67` |
| H5P packaging | Builds H5P JSON and dynamically imports JSZip in the browser | `lib/generateH5P.ts:9-44`, `lib/generateQuestionSetH5P.ts:9-44` |
| H5P schemas | Builds True/False and nested Question Set/MultiChoice payloads | `lib/h5pContent.ts:12-70`, `lib/h5pQuestionSetContent.ts:67-187` |
| OpenAI client | Creates a server-side client from `OPENAI_API_KEY` | `lib/openai.ts:1-5` |

There are no repository test/spec files, no test script, no CI configuration, and no deployment configuration. `package.json:5-27` exposes only development, build, lint, and typecheck scripts.

## Current end-to-end data flow

### 1. Input and quiz-type selection

`Home` starts with `contentType = "true-false"`, empty `text`, `count = 3`, and `difficulty = "intermediate"` (`app/page.tsx:23-32`). `H5PContentType` is a two-value union (`lib/types.ts:3`).

`InputForm` renders two button cards from `CONTENT_TYPES`: `True-false` and `Quiz set` (`components/InputForm.tsx:29-44`, `components/InputForm.tsx:128-151`). Selecting a card only changes `Home.contentType`; the selection is not sent as a request field.

The only source control is a controlled textarea bound to `Home.text` (`components/InputForm.tsx:153-166`). It has `minLength={1}` but not `required`, so the server, not the browser, is the effective empty-input guard. No source type, file, extraction metadata, maximum text length, or character/token budget is represented in state.

### 2. Client request boundary

`generateQuestions` chooses the endpoint from `GENERATE_ENDPOINTS[contentType]` and always sends JSON:

```json
{
  "text": "canonical source text",
  "count": 3,
  "difficulty": "intermediate"
}
```

Evidence: `app/page.tsx:34-45`.

The response is an untagged union of `TrueFalseQuestion[]`, `QuestionSetQuiz`, or `{ error?: string }` (`app/page.tsx:47-50`). The client interprets the successful response using the selected `contentType`, stores it in the corresponding state, and moves to the review screen (`app/page.tsx:52-78`).

Risks in the current client boundary:

- Input and quiz-type controls remain interactive while generation is in flight; only the submit/back/regenerate controls receive `isLoading`. A quiz-type change during an outstanding request can leave the current type and stored result out of alignment.
- There is no request cancellation, request ID, or stale-response guard.
- Generation and any future extraction cannot safely share one boolean loading flag if both can overlap.
- No client-side empty-text or maximum-length validation provides early feedback.

### 3. Server request validation

Both API routes independently implement the same request normalization:

- `request.json()` is assumed (`true-false/route.ts:23-27`; `question-set/route.ts:23-27`).
- `text` must be a string and is trimmed (`true-false/route.ts:29`; `question-set/route.ts:29`).
- Numeric `count` is rounded and clamped to 1-10, otherwise it defaults to 3 (`true-false/route.ts:30-33`; `question-set/route.ts:30-33`).
- `difficulty` must be one of three values, otherwise it defaults to `intermediate` (`true-false/route.ts:9-12,34`; `question-set/route.ts:9-12,34`).
- Empty text returns HTTP 400 (`true-false/route.ts:36-38`; `question-set/route.ts:36-38`).
- A missing API key returns HTTP 500 before the request body is read (`true-false/route.ts:15-20`; `question-set/route.ts:15-20`).

There is no request schema shared by the routes, maximum source length, token estimate, content provenance, authentication, rate limiting, or structured error code. Malformed JSON and most OpenAI/JSON parsing errors fall through to a broad catch and are returned as HTTP 500 with the caught message (`true-false/route.ts:89-94`; `question-set/route.ts:83-88`).

### 4. Model generation and response mapping

Both routes use `gpt-4o-mini`, temperature `0.4`, and JSON-object response mode (`true-false/route.ts:40-55`; `question-set/route.ts:40-55`). The supplied text is interpolated directly below a `Content:` label in each quiz-specific prompt (`lib/mapGeneratedQuestions.ts:96-137`; `lib/mapGeneratedQuestionSet.ts:160-197`). There is no delimiter escaping, prompt-injection handling, or input-size enforcement.

The type-specific mapping layers are useful and should remain separate:

- True/False accepts boolean strings, aliases two feedback field names, rejects empty questions/feedback, generates normalized summaries/titles, and truncates to the requested count (`lib/mapGeneratedQuestions.ts:4-94`).
- Quiz Set coerces answer objects, rejects fewer than two answers, duplicate answer text, and questions with no correct answer, then generates normalized question and quiz titles (`lib/mapGeneratedQuestionSet.ts:10-158`).

Each route rejects a mapped result when the valid question count differs from the requested count (`true-false/route.ts:66-85`; `question-set/route.ts:64-79`).

### 5. Review, validation, and export

Successful data is edited entirely in React state. True/False cards update one question via `Home.updateTrueFalseQuestion` (`app/page.tsx:90-99`, `components/ReviewCard.tsx:17-22`). Quiz Set cards replace the matching nested question within the quiz object (`components/MultiChoiceReviewCard.tsx:23-52`).

Validation is split by lifecycle:

- Model-output coercion protects the API response, as described above.
- Review-time validation only blocks a duplicate answer edit immediately (`components/MultiChoiceReviewCard.tsx:43-51`).
- Export-time validation rejects empty True/False questions/feedback and invalid Quiz Set questions/options (`lib/validateContent.ts:5-67`).

H5P packages are generated in the browser. JSZip is dynamically imported only when exporting, and no source file is included in the package (`lib/generateH5P.ts:16-41`; `lib/generateQuestionSetH5P.ts:16-41`). Multi-format extraction therefore should not change H5P builders or export validation unless provenance/media embedding is separately requested.

## Exact multi-format integration seam

### Recommended contract

Add one upload endpoint, separate from both generation endpoints:

```text
POST /api/extract
Content-Type: multipart/form-data
field: file=<one uploaded file>
```

Recommended successful response:

```json
{
  "text": "normalized extracted text",
  "source": {
    "kind": "pdf",
    "fileName": "lesson.pdf",
    "mediaType": "application/pdf",
    "sizeBytes": 42190
  },
  "stats": {
    "characters": 18342,
    "pages": 12
  },
  "warnings": []
}
```

The endpoint should return structured, stable failures such as `INVALID_REQUEST` (400), `FILE_TOO_LARGE` (413), `UNSUPPORTED_MEDIA_TYPE` (415), `EXTRACTION_EMPTY` or `DOCUMENT_UNREADABLE` (422), and `EXTRACTION_PROVIDER_FAILED` (502). The UI can display the human-readable `error` while logging or testing against `code`.

After extraction, the response `text` becomes the value of the existing editable source textarea. Generation continues through the current endpoints and request JSON. Do not upload the same file again to a generation route and do not add format-specific branches to either quiz route.

### Recommended module boundary

Names are illustrative but specify the intended ownership:

```text
components/SourceInput.tsx
  Owns paste/upload controls and file selection UI only.

app/page.tsx
  Owns source draft, extraction lifecycle, and generation lifecycle.

app/api/extract/route.ts
  Parses multipart input, applies transport limits, calls extraction service,
  and maps typed extraction errors to HTTP responses.

lib/source/types.ts
  Defines SourceKind, ExtractedSource, ExtractionWarning, and error codes.

lib/source/detectSource.ts
  Validates filename/MIME/magic bytes and selects one kind.

lib/source/extractSource.ts
  The only dispatcher from SourceKind to an extraction adapter.

lib/source/adapters/{text,csv,pdf,docx,image}.ts
  Converts one source kind to text plus format-specific stats/warnings.

lib/source/normalizeText.ts
  Applies shared BOM, newline, control-character, whitespace, and size policy.

lib/generation/parseGenerationRequest.ts
  Shares the current text/count/difficulty validation across both quiz routes.
```

`app/api/extract/route.ts` and all parser/OCR imports must remain server-only. `components/SourceInput.tsx`, `InputForm`, and `app/page.tsx` may use the browser `File` and `FormData` APIs, but must not import document parsers. This is important because `app/page.tsx:1` and `components/InputForm.tsx:1` are client modules.

### Format adapter responsibilities

| Source | Extraction behavior | Required edge cases |
| --- | --- | --- |
| Pasted text | Use the existing textarea path; apply the same final normalization/limit policy before generation | whitespace-only input, excessive characters, control characters |
| Text file | Decode an approved encoding (at minimum UTF-8), remove BOM, normalize newlines | invalid encoding, binary masquerading as text, empty file |
| CSV | Parse deterministically; preserve header/row order; serialize cells as labelled or tabular text without evaluating formulas | delimiter/quoting, embedded newlines, encoding, empty rows, row/cell/character limits |
| PDF | Extract page text with page boundaries and page count | encrypted/corrupt files, textless/scanned pages, mixed text/image PDFs, page limit |
| Word | Parse the approved Word variant and preserve paragraphs, headings, lists, and useful table text in reading order | `.docx` versus legacy `.doc`, corrupt/password-protected files, embedded images, tables |
| Image | OCR or vision extraction returning text and an explicit low-confidence/empty warning | orientation, resolution, supported languages, handwriting, multiple images, provider failure |

All adapters must return the same contract. They must not call a quiz prompt or construct H5P data. The dispatcher must apply shared output normalization and the final character/token budget once, after adapter extraction.

## State and UI changes required

Preserve `Home.text` as the canonical generation input to minimize migration. Add state with explicit roles rather than overloading it:

- `sourceMode: "paste" | "upload"`
- `sourceFile: { name, mediaType, sizeBytes, kind } | null` (metadata only after extraction; retaining the browser `File` is optional)
- `extractionStatus: "idle" | "extracting" | "ready" | "error"`
- `extractionError: string | null`
- `extractionWarnings: ExtractionWarning[]`
- `isGenerating` in place of the current ambiguous `isLoading`
- an active request ID or `AbortController` for extraction and generation

Recommended user flow:

1. Choose Paste or Upload independently from the existing True/False/Quiz Set choice.
2. For upload, select exactly one supported file and show its name, type, and size.
3. Upload to `/api/extract`; disable replacement/generation while that extraction is active, or cancel the old request before starting a new one.
4. Put successful extracted text into the existing textarea and label it as an editable preview.
5. Show warnings (for example, skipped scanned pages) before generation.
6. Generate only from the displayed text. Capture the requested quiz type at request start and ignore stale responses.
7. Back/regenerate must reuse the edited canonical text, not silently re-extract the original file.

Changing a file or switching back to paste should explicitly confirm or clearly replace the current preview. A failed new extraction should not silently generate from stale text belonging to an older file.

## Shared generation boundary and duplication policy

The two routes currently duplicate API-key checks, difficulty guards, request parsing/defaults, OpenAI request settings, raw-response checks, and catch handling. Multi-format work should not copy that block into another route.

Minimum refactor during implementation:

1. Extract a shared `parseGenerationRequest` that returns either canonical `{ text, count, difficulty }` or a typed HTTP error.
2. Optionally extract the common JSON completion call/model settings if the team wants model configuration in one place.
3. Keep `buildGenerationPrompt`/`mapGeneratedQuestions` and `buildQuestionSetPrompt`/`mapGeneratedQuestionSet` separate because their schemas and correctness checks genuinely differ.
4. Keep the existing public generation URLs and success response shapes for a backward-compatible first release.

Invariants for review:

- There is one upload/extraction endpoint, not one per quiz type.
- There is one source-kind dispatcher, not `if PDF` branches in UI and both generation routes.
- Both quiz routes consume the same canonical generation request parser.
- No adapter imports OpenAI quiz generation, H5P builders, or React code.
- No quiz prompt or mapper imports upload/parser/OCR code.
- Existing H5P generation functions remain unchanged unless a separate requirement adds source media to output.

## Validation and security requirements

Client-side `accept` attributes and filename extensions are hints only. The extraction endpoint must enforce all of the following before expensive parsing/provider calls:

- exactly one file and a non-empty body;
- an approved extension plus media type, with magic-byte/content checks where practical;
- maximum compressed/upload bytes;
- format-specific maximum pages, rows/cells, pixels, and decompressed content to resist zip/decompression bombs;
- a maximum normalized character or estimated-token budget before calling the quiz model;
- timeouts/abort behavior for parsers and remote OCR;
- no use of user filenames as filesystem paths;
- no persistent storage by default and no raw document content in logs;
- safe treatment of CSV formula cells as text, never executable content;
- source text delimited and described as untrusted data in prompts so instructions inside a document do not override the quiz-generation task.

The existing application also needs a defined policy for errors. Avoid returning arbitrary parser/provider exception messages to clients; map them to stable codes and safe messages. Preserve detailed causes in server-side observability only, with document text redacted.

## Build and runtime constraints

- The project is a single Next.js App Router application on Next `14.2.35`, React `18.3.1`, and TypeScript (`package.json:11-27`).
- Route handlers do not declare `runtime`; the current runtime choice is implicit. The extraction route should explicitly use the Node.js runtime if selected parsers require `Buffer`, streams, filesystem-backed temporary files, native modules, or Node-only APIs.
- `next.config.mjs:1-6` only enables React strict mode. It does not configure body limits, external server packages, output mode, or deployment behavior.
- `tsconfig.json:3-24` is strict, uses bundler module resolution and isolated modules, and targets ES5 while including modern DOM/ESNext libraries. New server/client types must remain separated enough for this configuration.
- Current runtime dependencies are only Next/React, OpenAI, and JSZip. There is no MIME-sniffing, CSV, PDF, Word, image metadata, or OCR dependency (`package.json:11-17`). Parser/provider selection therefore changes the dependency and possibly deployment footprint and requires gate approval.
- JSZip is deliberately loaded in browser export functions (`lib/generateH5P.ts:16-31`, `lib/generateQuestionSetH5P.ts:16-31`). Do not reuse client JSZip as a general upload parser or pull server parsers into that bundle.
- The repository does not declare a Node engine. The inspected machine runs Node `v24.18.0`, while `@types/node` is version 20.x. The deployment Node version must be made explicit and tested against chosen parsers.
- No `vercel.json`, Dockerfile, CI workflow, or other deployment manifest exists. Upload body size, memory, timeout, ephemeral disk, native-binary support, and serverless concurrency are currently unknown.
- The app describes itself as stateless (`README.md:3`). A stateless, in-memory request flow fits the proposed design, but larger parsers may require bounded temporary files. Any persistence or background job architecture is a separate scope decision.

Do not rely on a Next.js or hosting default for upload limits. Define an application limit lower than the verified platform limit and return HTTP 413 before extraction work where possible.

## Proposed implementation slices and acceptance criteria

### Slice 0 — Approve the feasibility contract

Decide the items in the blocker list below and record the supported format/limit matrix.

Acceptance criteria:

- Product and engineering agree on exact extensions/MIME types, including whether Word means `.docx` only.
- Maximum bytes, pages, image dimensions, CSV rows/cells, normalized characters/tokens, and extraction duration are explicit.
- OCR/provider, privacy, retention, and deployment-runtime decisions are approved.
- Preview-before-generation is accepted or deliberately rejected with an alternative contract.

### Slice 1 — Add canonical source types and shared generation request parsing

Introduce source/extraction types and consolidate the duplicated `{ text, count, difficulty }` validation without changing public generation behavior.

Acceptance criteria:

- Both existing endpoints return the same success shapes and status behavior for valid requests.
- Both use one request parser and the same count/difficulty/text rules.
- Unit tests cover empty/whitespace text, count defaults/clamping/rounding, and accepted/rejected difficulty values.
- No parser/OCR package is imported into a client bundle.

### Slice 2 — Implement the extraction service and adapters

Build `detectSource`, `extractSource`, shared normalization, and one adapter per approved source kind. Keep provider/library decisions behind adapter interfaces.

Acceptance criteria:

- Every adapter returns the same `ExtractedSource` shape.
- Format detection rejects extension/MIME/content mismatches according to policy.
- Shared output limits apply after normalization, and format-specific resource limits apply before/during parsing.
- Text, CSV, PDF, Word, and image fixtures exercise successful, empty, corrupt, oversized, and format-specific edge cases.
- No adapter calls a quiz generator or H5P builder.

### Slice 3 — Add `POST /api/extract`

Expose the extraction service through one multipart route with typed errors and explicit runtime configuration.

Acceptance criteria:

- The route accepts one `file` part and rejects missing, multiple, empty, unsupported, or oversized input with the agreed status/code.
- Successful output contains canonical text, safe metadata, stats, and warnings; it never echoes raw bytes.
- Parser/provider failures are sanitized and observable without logging document content.
- Route integration tests cover representative multipart requests and timeout/provider-failure mapping.

### Slice 4 — Add paste/upload UI and extraction state

Extract source controls from `InputForm` if necessary, preserve quiz-type selection, and add editable extraction preview.

Acceptance criteria:

- Existing pasted-text generation remains behaviorally unchanged.
- Upload supports exactly the approved types and displays file metadata, progress/status, errors, and warnings.
- Generation is disabled until non-empty canonical text is ready and within limits.
- Users can edit extracted text; generate/regenerate sends exactly the displayed text.
- Replacing a file, switching modes, navigating back, and concurrent/stale requests cannot silently mix sources or quiz types.
- Keyboard and screen-reader users can identify selected source mode, selected quiz type, extraction status, and errors.

### Slice 5 — Regression coverage for both quiz pipelines

Add a test runner and CI only after tool/dependency approval. Mock OpenAI and OCR/provider calls; do not make live paid calls in routine tests.

Acceptance criteria:

- For each source kind, one extraction result can feed both generation endpoints without source-specific route code.
- True/False mapping still rejects invalid count/shape and returns `TrueFalseQuestion[]`.
- Quiz Set mapping still enforces answer constraints and returns `QuestionSetQuiz`.
- Existing review editing and H5P JSON/package construction have regression tests.
- An end-to-end browser test covers upload -> preview/edit -> generate -> review for each quiz type, with APIs mocked at deterministic boundaries.

### Slice 6 — Operational hardening and documentation

Document local/deployment prerequisites, limits, privacy behavior, and failure modes; add metrics that do not contain source content.

Acceptance criteria:

- README documents supported formats/limits and required credentials/providers.
- Deployment configuration verifies body, time, memory, Node/runtime, and native/package constraints.
- Metrics include format, byte/character/page counts, duration, warning/error code, and outcome, but never filenames or extracted content unless explicitly approved.
- Rate limiting/authentication policy is in place before exposing expensive OCR/model operations publicly.

## Test inventory to create

No tests exist today, so the first implementation change must establish the framework and fixtures. Recommended coverage:

| Layer | Cases |
| --- | --- |
| Pure unit | text normalization, source detection, limits, generation request parsing, each adapter's deterministic transforms |
| Adapter fixtures | UTF-8/BOM text, quoted/multiline CSV, text/scanned/encrypted/corrupt PDF, paragraphs/tables/corrupt DOCX, rotated/blank/low-resolution image |
| Route integration | multipart parsing, missing/multiple files, MIME mismatch, 413/415/422/502 mapping, abort/timeout, safe response metadata |
| Generation regression | both routes with mocked model JSON; current mappers' valid/invalid/count behavior |
| UI/component | paste/upload selection, accessible state, preview edit, stale-response suppression, warning/error rendering |
| End-to-end | every approved source kind reaches both quiz types through the same canonical-text request, with external services mocked |
| H5P regression | known questions still produce the expected manifest/content shape; source metadata does not leak into packages |

Fixtures should be tiny, synthetic, non-sensitive, and licensed for the repository. Scanned/OCR fixtures require tolerance-based assertions on normalized output rather than brittle byte-for-byte provider responses.

## Migration and compatibility concerns

- Keep the two existing generation URLs and their success response shapes in the first release. Existing pasted-text clients then remain compatible.
- Treat `/api/extract` as additive. Do not change generation endpoints to multipart unless a later API version deliberately combines extraction and generation.
- Preserve `Home.text` as canonical text so review/regenerate semantics remain familiar. Add source metadata alongside it rather than replacing the field with a deeply coupled file union.
- Refactoring shared request parsing may expose accidental current behavior, especially malformed JSON returning 500 and invalid count/difficulty silently defaulting. Decide whether fixes are backward-compatible or versioned; test the chosen contract.
- Extraction can greatly increase model input size/cost/latency. Reject or deliberately chunk/summarize oversized text; silent truncation risks unsupported or biased quiz questions.
- A scanned PDF may require both PDF parsing and image OCR. Define whether partial text is acceptable and how page-level warnings are surfaced.
- Legacy `.doc` usually requires a different parser/conversion path from `.docx`; do not advertise generic “Word” until this is settled.
- DOCX/PDF embedded images need an explicit rule: ignore with warning, OCR, or reject when no usable text exists.
- CSV conversion must preserve enough row/column context for grounded questions while avoiding enormous repetitive prompts.
- OCR/vision output is nondeterministic and language-dependent. Users need a preview and warnings rather than an assumption of perfect extraction.
- Uploaded educational material may be sensitive or copyrighted. The final text is sent to OpenAI by the existing routes, and image OCR may add another provider. Consent, retention, data-region, and logging policies must be visible.
- In-memory parsing fits the current stateless design only within strict bounds. Large files, native parsers, asynchronous jobs, or persistent uploads would materially change operations and require a new architecture review.

## Feasibility-gate blockers and decisions needed

1. **Supported format matrix:** Are `.txt`, `.csv`, `.pdf`, `.docx`, `.png`, `.jpg/.jpeg`, and `.webp` sufficient? Is legacy `.doc` required?
2. **PDF policy:** Must scanned and mixed PDFs be OCRed page by page, or may the first release support text PDFs only with a clear warning/error?
3. **Word policy:** Are embedded images, headers/footers, footnotes, and tables required, and in what reading order?
4. **Image OCR/provider:** Local OCR, OpenAI vision, or another provider; supported languages/handwriting; expected confidence and cost.
5. **Limits:** Maximum upload bytes, pages, pixels, rows/cells, normalized characters/tokens, extraction time, and model cost per request.
6. **Oversize behavior:** Reject, truncate with confirmation, chunk, or summarize. Silent truncation should not be approved.
7. **Deployment target:** Hosting platform, Node version, request-body cap, timeout, memory, ephemeral disk, native dependency support, and concurrency.
8. **Privacy/security:** Retention, temporary files, provider data handling, content logging/redaction, user consent, authentication, and rate limiting.
9. **UX contract:** Confirm the recommended editable preview and whether users can combine pasted text with extracted text.
10. **CSV semantics:** Header detection, delimiter/encoding support, row serialization, and whether users can choose columns/sheets (CSV itself has one table; spreadsheet formats are out of current scope).
11. **Dependency/test choices:** Parser/OCR packages, licensing, maintenance posture, test runner, and browser-test framework.

None of these blockers changes the recommended integration seam. They determine which adapters can be approved and whether synchronous serverless extraction is operationally viable.

## Definition of done for implementation

Implementation is complete only when one canonical extraction pipeline accepts every approved source kind, exposes an editable normalized-text preview, and feeds both existing quiz generators through the shared JSON request contract. No source-specific branch may be duplicated across True/False and Quiz Set routes, pasted text must continue to work, limits and privacy behavior must be explicit, external calls must be mocked in routine tests, and both H5P export paths must pass regression coverage.
