# Testing Policy

## Required

Agents must run tests relevant to changed behavior.

At minimum, record:

- command run
- result
- failures
- skipped checks
- reason if a check could not be run

## Test Selection

Use the narrowest meaningful check first, then broader checks when risk is higher.

Examples:

- small utility change: unit test
- API behavior change: unit/integration test
- UI workflow change: component/e2e/manual verification
- shared abstraction change: broader test suite
- config/build change: build command
- source extraction change: extraction tests and relevant runtime harness
- H5P packaging change: H5P regression tests

## Project Commands

```bash
npm test
npm run test:pdf-runtime -- dev
npm run typecheck
npm run lint
npm run build
npm run test:pdf-runtime -- production
```

## Done Evidence

A task cannot move to `review` without test evidence.

If tests cannot be run, explain why and mark residual risk.
