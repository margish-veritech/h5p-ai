# Security Policy

## Secrets

Never commit:

- `.env`
- `.env.local`
- API keys
- tokens
- private keys
- credentials
- production config values

## Sensitive Areas

Human approval is required before changing:

- authentication
- authorization
- session handling
- password logic
- token handling
- billing/payment logic
- data deletion
- personally identifiable information handling

## Project-Specific Security Notes

- Text, CSV, PDF, and DOCX extraction should remain local, bounded, and non-persistent.
- Image OCR sends image bytes to OpenAI; user-facing copy and docs should remain clear about that.
- Raw source files and source metadata should not be embedded in downloaded H5P packages.
- Uploaded files must remain limited to one file per request unless a task explicitly changes the product and security model.
- Keep upload size, page count, row count, ZIP entry, expanded DOCX, image pixel, source character, and timeout limits centralized in `lib/sourceLimits.ts`.
- Keep user-provided source wrapped as untrusted reference material before prompt construction.

## Required For Security-Sensitive Tasks

Record in the task file:

- threat or risk considered
- changed behavior
- tests run
- remaining risk
