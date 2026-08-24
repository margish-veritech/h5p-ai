# H5P AI Generator

H5P AI Generator is a stateless Next.js 14 app that turns editable source text into either:

- individual H5P True/False question packages; or
- one H5P Question Set containing multiple-choice questions.

Source text can be pasted directly or extracted from one supported upload. Every upload is converted to an editable plain-text preview before the selected quiz generator runs. H5P packaging remains browser-side and does not embed the uploaded source file.

## Setup

Use Node.js 20 or newer, then install the locked dependencies:

```bash
npm install
```

Create `.env.local` and provide an OpenAI API key:

```bash
OPENAI_API_KEY=your_key_here
```

The credential is used for quiz generation and printed-text OCR of JPEG, PNG, and WebP images.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supported source inputs

The MVP accepts pasted text plus at most one upload per extraction request:

| Input | Supported profile |
| --- | --- |
| Text | Valid UTF-8 `.txt` |
| CSV | UTF-8/UTF-8-BOM `.csv`; comma, semicolon, or tab delimiter; one strict rectangular table |
| PDF | Unlocked, text-layer `.pdf`, up to 15 pages |
| Word | Unlocked, macro-free modern `.docx` |
| Image | One still JPEG, PNG, or WebP containing printed text; OCR uses OpenAI |

The app explicitly rejects legacy `.doc`, `.docm`/macro documents, protected documents, animated images, multiple files, and scanned or textless PDFs. Resave legacy Word documents as `.docx` or text-layer PDF. For a scanned page, upload one clear printed-text image instead.

## Product limits

- Total upload/request and file size: 10 MiB.
- CSV: 5 MiB, 10,000 data rows, 100 columns, 64 KiB per record.
- PDF: 15 pages, with a usable text layer on every page.
- DOCX: 1,000 ZIP entries and 50 MiB expanded content.
- Images: 20 megapixels and one still frame.
- Combined normalized source: 40,000 characters, with a warning at 30,000.
- Local extraction timeout: 10 seconds; image OCR timeout: 30 seconds.

Limits reject the request with a stable error code; content is never silently truncated.

## Data handling

- Text, CSV, PDF, and DOCX files are processed in bounded memory and are not persisted by the app.
- Image bytes are sent to OpenAI for printed-text OCR.
- After the user reviews the editable preview, its normalized text is sent to OpenAI for quiz generation.
- Raw files and source metadata are not included in downloaded H5P packages.

This repository does not include authentication, rate limiting, malware scanning, persistence, or production hosting controls. Add those controls and complete a privacy/security review before exposing upload or OCR endpoints publicly.

## Verification

```bash
npm test
npm run test:pdf-runtime -- dev
npm run typecheck
npm run lint
npm run build
npm run test:pdf-runtime -- production
```

The PDF runtime harness starts a real Next development or production server and exercises
the extraction API with Quartz, Chrome/Skia, encrypted, corrupt, and scan-only PDFs. The
tests mock OpenAI and make no paid or live model calls.

## Architecture

- `app/api/extract/route.ts` is the single Node.js multipart extraction boundary.
- `lib/source/` contains server-only detection, limits, adapters, normalization, and stable extraction errors.
- `pdfjs-dist` remains external to the Next.js server bundle so its Node-side worker resolves from the installed package in development and production.
- `app/api/generate/true-false/route.ts` and `app/api/generate/question-set/route.ts` share one source/count/difficulty validator and keep their existing response shapes.
- `lib/untrustedSource.ts` wraps source material as untrusted reference data in both quiz prompts.
- `lib/generateH5P.ts` and `lib/generateQuestionSetH5P.ts` keep JSZip and downloads in the browser.
