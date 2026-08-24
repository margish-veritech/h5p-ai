# Dependency Policy

Adding dependencies requires human approval unless the task explicitly authorizes it.

## Current Dependency Profile

- Runtime: Next.js, React, OpenAI, JSZip, Mammoth, PDF.js, csv-parse.
- Development: TypeScript, Vitest, ESLint, Tailwind, PostCSS.
- Package manager: npm with `package-lock.json`.

## Before Proposing A Dependency

Document:

- package name
- reason it is needed
- alternatives considered
- maintenance risk
- license concern, if any
- expected bundle/runtime impact

## Project-Specific Checks

Before adding or upgrading a package, consider:

- server/client bundle boundary in Next.js
- Node.js 20 compatibility
- whether the code runs in browser, API route, or both
- upload parsing and untrusted input risk
- effect on `.h5p` package generation
- lockfile changes

## Forbidden

Do not add dependencies for trivial helpers, formatting convenience, or avoidable wrappers.
