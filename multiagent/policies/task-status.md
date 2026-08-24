# Task Status Policy

## Statuses

`backlog`

Task exists but is not ready.

`ready`

Task has enough context and acceptance criteria.

`in_progress`

Task is claimed and actively being worked.

`blocked`

Task cannot continue without input or external fix.

`review`

Implementation is complete and ready for review.

`done`

Task is merged, accepted, or explicitly completed.

## GitHub Triage Labels

`agent:needs-triage`

Issue exists but has not been classified for readiness.

`agent:needs-clarification`

Issue needs human input before implementation.

`agent:needs-breakdown`

Issue is too large, vague, or separable and should be decomposed.

`agent:split`

Parent issue has been decomposed into child issues and tracks overall progress.

`agent:ready`

Issue is clear, scoped, and ready for implementation.

`agent:blocked`

Issue cannot proceed because of an external dependency, missing access, or unresolved blocker.

## Issue Point Labels

Use issue points instead of size labels.

```text
1 issue point = 1 hour
```

Recommended labels:

- `issue-points:1`
- `issue-points:2`
- `issue-points:3`
- `issue-points:4`
- `issue-points:5`
- `issue-points:6`
- `issue-points:7`
- `issue-points:8`
- `issue-points:over-8`

Issues labeled `issue-points:over-8` should also be labeled `agent:needs-breakdown` unless a human explicitly approves keeping the work atomic.

## Priority Labels

- `priority:P0`: urgent priority; handle before P1/P2/P3.
- `priority:P1`: high priority; handle after P0 and before P2/P3.
- `priority:P2`: medium priority; handle after P0/P1 and before P3.
- `priority:P3`: low priority; handle after P0/P1/P2.

## Type Labels

- `type:feature`: new user-facing or product capability.
- `type:bug`: bug fix or regression work.
- `type:research`: research, investigation, or discovery work.
- `type:refactor`: internal code improvement that should preserve behavior.
- `type:docs`: documentation-only work.
- `type:test`: test coverage, test tooling, or verification work.
- `type:chore`: maintenance, housekeeping, or non-product task.

## Status Rules

Only one active agent should claim a task.

Do not move a task to `review` unless:

- code is complete
- tests/checks are recorded
- done evidence is written
- PR exists when code changed

Do not move a task to `done` unless:

- PR is merged, or
- human explicitly accepts completion

## Project-Specific Evidence

For this repo, task evidence should mention affected areas such as:

- UI workflow
- API route behavior
- source extraction behavior
- OpenAI prompt/model behavior
- H5P package output
- test/runtime/build status
