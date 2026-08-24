# Architecture

## High-Level Flow

```text
User input or upload
  -> app/page.tsx client workflow
  -> /api/extract for uploaded source normalization
  -> editable source preview
  -> /api/generate/true-false or /api/generate/question-set
  -> review UI
  -> browser-side H5P package generation
```

## Application Layers

### App Router

- `app/page.tsx` is the main client component. It manages input, upload extraction, generation requests, review state, errors, and H5P download actions.
- `app/layout.tsx` defines the app shell metadata and fonts.
- `app/globals.css` contains global Tailwind styles.

### UI Components

- `components/AppShell.tsx` frames the app.
- `components/PageHeader.tsx` renders page-level presentation.
- `components/InputForm.tsx` manages source text, generation settings, and submission controls.
- `components/SourceUpload.tsx` manages file selection and upload affordances.
- `components/ReviewCard.tsx` and `components/MultiChoiceReviewCard.tsx` render generated question review cards.
- `components/QuestionSetReview.tsx` renders multi-question set review.

### API Routes

- `app/api/extract/route.ts` is a Node.js runtime multipart endpoint. It accepts pasted text plus at most one file, enforces request limits, delegates file extraction, and returns normalized text with source metadata and warnings.
- `app/api/generate/true-false/route.ts` validates generation requests, calls OpenAI with a JSON-only prompt, maps model output to H5P True/False content, and returns an array of questions.
- `app/api/generate/question-set/route.ts` validates generation requests, calls OpenAI with a JSON-only prompt, maps model output to a Question Set quiz, and returns the quiz object.

### Domain Libraries

- `lib/generationRequest.ts` validates shared generation inputs such as source text, count, and difficulty.
- `lib/mapGeneratedQuestions.ts` and `lib/mapGeneratedQuestionSet.ts` build prompts and map model responses into trusted application shapes.
- `lib/untrustedSource.ts` wraps user source material as untrusted reference data before prompt construction.
- `lib/types.ts` defines shared app and H5P-facing types.
- `lib/h5pContent.ts` and `lib/h5pQuestionSetContent.ts` define H5P content payload construction.
- `lib/generateH5P.ts` and `lib/generateQuestionSetH5P.ts` use JSZip in the browser to create downloadable `.h5p` files.

### Source Extraction

- `lib/source/detectSource.ts` identifies supported source formats.
- `lib/source/extractSource.ts` coordinates extraction, mixed pasted/uploaded source output, and response construction.
- `lib/source/adapters/` contains format-specific extraction for text, CSV, PDF, DOCX, and images.
- `lib/source/normalizeText.ts` canonicalizes extracted text.
- `lib/source/errors.ts` defines stable extraction error codes and HTTP statuses.
- `lib/source/timeout.ts` enforces extraction timeouts.
- `lib/sourceLimits.ts` centralizes upload, extraction, and source length limits.

## Important Runtime Details

- Node.js 20 or newer is required.
- `OPENAI_API_KEY` is required for quiz generation and image OCR.
- Text, CSV, PDF, and DOCX extraction is local and bounded.
- Image OCR sends image bytes to OpenAI.
- Uploaded source files are not persisted by the application.
- H5P package generation happens in the browser.
- `pdfjs-dist` is listed as a server external package in `next.config.mjs` so its Node-side worker can resolve correctly in development and production.

## Testing Architecture

- Vitest runs Node-environment unit and route tests from `tests/**/*.test.ts`.
- OpenAI calls are mocked in generation route tests.
- `tests/pdfServerRuntime.mjs` starts real Next development or production servers and exercises PDF extraction behavior.
- H5P regression tests check package/content compatibility.
