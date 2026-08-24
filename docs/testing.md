# Testing

## Test Commands

```bash
# all Vitest tests
npm test

# PDF runtime checks against a dev server
npm run test:pdf-runtime -- dev

# TypeScript check
npm run typecheck

# lint
npm run lint

# production build
npm run build

# PDF runtime checks against production build
npm run test:pdf-runtime -- production
```

## When To Run What

- Small isolated change: run the relevant Vitest file or `npm test`.
- API change: run `npm test` and add/update route tests.
- UI change: run `npm run typecheck`; use manual browser verification when interaction changed.
- Source extraction change: run `npm test` and the relevant PDF runtime check when PDF behavior is involved.
- H5P packaging change: run `npm test`, especially `tests/h5pRegression.test.ts`.
- Shared logic change: run `npm test` and `npm run typecheck`.
- Dependency/config change: run `npm test`, `npm run typecheck`, and `npm run build`.

## Required Evidence

Agents must record test evidence in the active task file.

At minimum, include:

- command run
- pass/fail result
- relevant failure summary
- skipped checks and reason
- manual verification notes, when applicable

## Current Coverage Map

- `tests/generationRequest.test.ts`: generation request validation.
- `tests/generationRoutes.test.ts`: OpenAI-backed route response shape and validation regressions.
- `tests/prompts.test.ts`: prompt construction and untrusted source handling.
- `tests/extractRoute.test.ts`: multipart extraction route behavior.
- `tests/extractSource.test.ts`: source extraction behavior.
- `tests/pdfRuntimeRegression.test.ts`: PDF runtime assumptions.
- `tests/h5pRegression.test.ts`: generated H5P package regressions.
- `tests/pdfServerRuntime.mjs`: real server PDF runtime harness.
