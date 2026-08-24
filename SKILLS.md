# Project Skills

This file describes the project-specific knowledge and capabilities agents should develop while working here.

## Required Project Knowledge

Agents working on this repo should understand:

- Next.js 14 App Router conventions
- React client component state and browser download behavior
- TypeScript strict mode
- Tailwind CSS utility styling and the local theme in `tailwind.config.ts`
- OpenAI API usage through `lib/openai.ts`
- H5P True/False and Question Set content shapes
- JSZip-based browser packaging for `.h5p` downloads
- source extraction for text, CSV, PDF, DOCX, and image OCR
- local setup and required `OPENAI_API_KEY`
- Vitest test commands and PDF runtime harness
- GitHub Issue workflow and task handoff protocol
- Requirement triage and decomposition protocol

## Common Work Types

### Feature Work

Expected agent behavior:

- read related files first
- implement only scoped behavior
- add or update tests
- update docs if behavior changes
- preserve existing API response shapes unless the task explicitly says otherwise
- provide done evidence

### Bug Fixes

Expected agent behavior:

- reproduce or reason about the bug
- identify root cause
- add regression test where practical
- keep fix minimal
- document changed behavior

### Refactors

Expected agent behavior:

- refactor only inside task scope
- preserve behavior
- run broad enough tests
- avoid mixed feature/refactor commits

### Documentation

Expected agent behavior:

- keep docs factual and current
- avoid speculative claims
- link to relevant files when possible

### Requirement Triage And Decomposition

Expected agent behavior:

- read the full requirement carefully before coding
- identify ambiguity, missing acceptance criteria, and conflicting constraints
- estimate issue points, where 1 issue point = 1 hour of expected implementation, verification, and documentation work
- decide whether the task fits one focused PR and stays at 8 issue points or less
- split requirements over 8 issue points into smaller GitHub issues when work is separable
- give each sub-issue a clear goal, acceptance criteria, dependencies, suggested labels, issue point estimate, verification expectations, and sequence
- sequence dependent work so foundational changes come before UI, integration, or rollout work
- ask for human input when product behavior, data handling, security, payment, or scope boundaries are unclear
- avoid coding until the issue is classified as ready

## Project-Specific Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run PDF runtime checks against a dev server
npm run test:pdf-runtime -- dev

# Run type checking
npm run typecheck

# Run lint
npm run lint

# Run production build
npm run build

# Run PDF runtime checks against production build
npm run test:pdf-runtime -- production
```

## Dangerous Areas

Agents need extra care around:

- authentication: not implemented; adding it requires approval and security review
- authorization: not implemented; adding it requires approval and security review
- database: not present; adding persistence requires approval
- migrations: not present; adding schema changes requires approval
- payment/billing: not present; adding it requires approval
- deployment: no production deployment config is checked in
- generated files: `.next/`, `next-env.d.ts`, `*.tsbuildinfo`, downloaded `.h5p` packages, and local caches should not be committed unless explicitly required
- external integrations: OpenAI is used for quiz generation and image OCR
- uploads: source extraction must preserve size limits, format restrictions, timeout behavior, and non-persistence guarantees
- API contracts: generation route response shapes are covered by tests and should not change silently

## Preferred Patterns

- Use shared request validation in `lib/generationRequest.ts`.
- Keep source file limits in `lib/sourceLimits.ts`.
- Route extraction through `lib/source/extractSource.ts` and adapter modules under `lib/source/adapters/`.
- Wrap user-provided source through `lib/untrustedSource.ts` before prompt construction.
- Keep OpenAI access behind `lib/openai.ts`.
- Map model output through dedicated mapper functions before returning or packaging it.
- Add focused Vitest regression coverage for changed behavior.

## Avoided Patterns

- Do not duplicate source limits in UI or API code when `lib/sourceLimits.ts` can be reused.
- Do not persist uploaded source files.
- Do not include raw source files or source metadata inside generated H5P packages.
- Do not call OpenAI from tests without explicit test design and human approval.
- Do not bypass H5P mapper/validation helpers.
- Do not loosen upload restrictions without documenting the privacy and security impact.
