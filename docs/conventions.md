# Conventions

## Code Style

- Use TypeScript with `strict` mode.
- Prefer explicit shared types from `lib/types.ts` and `lib/source/types.ts`.
- Use the `@/` path alias for repository imports.
- Keep API route validation at the route boundary or in shared validation helpers.
- Keep model output untrusted until mapper functions validate and normalize it.
- Use concise comments only where they explain a non-obvious constraint.

## File Organization

- App routes live under `app/`.
- Reusable UI components live under `components/`.
- Domain logic and browser packaging helpers live under `lib/`.
- Source extraction logic lives under `lib/source/`.
- Tests live under `tests/`.
- Static H5P examples live under `h5p-examples/`.
- Agent task memory lives under `multiagent/`.

## Naming

- Branches: `agent/GH-<issue-number>-<short-title>` or `agent/TASK-<task-number>-<short-title>`.
- Components: PascalCase React component files.
- Functions: camelCase.
- Types: PascalCase.
- Tests: `*.test.ts` under `tests/`.
- API routes: follow Next.js App Router `route.ts` conventions.

## Error Handling

- Use stable extraction error codes from `lib/source/errors.ts`.
- Return clear JSON errors from API routes.
- Do not expose secrets or raw provider errors that may contain sensitive details.
- Preserve existing response shapes unless a task explicitly changes the contract.

## UI

- Use Tailwind utilities and theme tokens from `tailwind.config.ts`.
- Keep controls accessible and preserve existing interaction patterns.
- Avoid layout changes unrelated to the active task.

## Documentation

Update docs when behavior, setup, commands, architecture, limits, security assumptions, or public contracts change.
