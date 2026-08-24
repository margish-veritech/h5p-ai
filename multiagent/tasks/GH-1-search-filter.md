---
id: GH-1
source: github
github_issue: 1
title: "After question generation: add Search filter so user can find question related to a searched query"
status: done
priority: P1
sequence: 001
issue_points: 2
depends_on: []
claimed_by: Codex
branch: agent/GH-1-search-filter
pr: https://github.com/margish-veritech/h5p-ai/pull/2
created_at: 2026-08-24
updated_at: 2026-08-24
---

# GH-1: Search Generated Questions

## Goal

Let users search generated questions after AI generation succeeds so they can find whether a word or sentence exists in the generated results.

## Acceptance Criteria

- [x] Search query can be a word or sentence.
- [x] Only matching generated results are shown on screen while a search query is active.
- [x] A clear button clears the search query.

## Context

GitHub issue: users currently cannot filter generated questions after AI generation.

Classification: ready to implement. The scope is narrow, user-facing UI work with clear acceptance criteria and no unresolved product decision.

## Affected Areas

- `app/page.tsx`
- `components/GeneratedQuestionSearch.tsx`
- `components/QuestionSetReview.tsx`
- `lib/generatedQuestionSearch.ts`
- `tests/`

## Issue Points

Estimate total implementation, verification, and documentation work.

```text
1 issue point = 1 hour
```

- Estimate: 2 issue points
- Over 8 issue points:
  - [ ] yes, split before implementation
  - [x] no

## Policy Notes

This task touches:

- [ ] authentication/authorization
- [ ] database/migrations
- [ ] dependencies
- [ ] public API
- [ ] deployment/config
- [ ] security/privacy
- [ ] generated files

Required approval:

- [ ] yes
- [x] no

Reason: UI-only filtering of already-generated client state. No API, data flow, dependency, upload, prompt, or H5P package contract changes expected.

## Implementation Notes

- 2026-08-24: Claimed issue #1 on branch `agent/GH-1-search-filter`.
- 2026-08-24: Working tree before code changes had pre-existing untracked `.h5p-library-cache/`; leaving it untouched.
- 2026-08-24: Added a shared generated-question search matcher that normalizes case and whitespace and preserves original indexes for edits while filtered.
- 2026-08-24: Added one search control on generated review screens for both true-false and question-set results, with an explicit clear button and empty-result message.
- 2026-08-24: Opened PR #2 for review.
- 2026-08-24: PR #2 merged into `dev` at `319b11362cc1f64b3b21c4556748fe7383458d20`; issue #1 closed and labeled `agent:done`.

## Test Requirements

Expected checks:

- [x] unit tests
- [ ] integration tests
- [ ] e2e tests
- [x] lint
- [ ] build
- [x] manual verification

Project-specific checks to consider:

- [ ] route response shape
- [ ] source extraction limits
- [ ] prompt/model output mapping
- [x] H5P package regression
- [ ] PDF runtime harness

## Done Evidence

Fill before review/done:

- Changed files:
  - `app/page.tsx`
  - `components/GeneratedQuestionSearch.tsx`
  - `components/QuestionSetReview.tsx`
  - `lib/generatedQuestionSearch.ts`
  - `tests/generatedQuestionSearch.test.ts`
  - `multiagent/tasks/GH-1-search-filter.md`
  - `multiagent/logs/2026-08.md`
- Commands run:
  - `gh issue list --label agent:ready --state open --json number,title,labels,createdAt,url --limit 20`
  - `git pull --ff-only`
  - `gh issue view 1 --json number,title,body,labels,comments,assignees,state,url`
  - `git switch -c agent/GH-1-search-filter`
  - `gh issue edit 1 --remove-label agent:ready --add-label agent:in-progress`
  - `gh issue comment 1 --body "Claiming this for implementation. Branch: agent/GH-1-search-filter."`
  - `npm test -- generatedQuestionSearch`
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
  - `npm run dev`
  - `curl -I http://localhost:3000`
- Test results:
  - `npm test -- generatedQuestionSearch`: passed, 1 file / 4 tests.
  - `npm run typecheck`: passed.
  - `npm run lint`: passed with no warnings or errors.
  - `npm test`: passed, 8 files / 25 tests.
  - `curl -I http://localhost:3000`: returned HTTP 200 against the running Next dev server.
- Behavior verified:
  - Search matcher accepts single words and multi-word sentence fragments.
  - Search matcher is case-insensitive and whitespace-normalized.
  - True-false review filters generated cards while preserving original indexes for edits.
  - Question-set review filters multiple-choice cards while preserving original indexes for edits.
  - Clear button resets the query to show all generated results.
- Known limitations:
  - Browser interaction was not driven through a live OpenAI generation request; filtering logic is covered by unit tests and the app was verified to serve locally.

## Handoff Notes

Use this if incomplete or risky.

## Links

- GitHub Issue: https://github.com/margish-veritech/h5p-ai/issues/1
- PR: https://github.com/margish-veritech/h5p-ai/pull/2
- Related ADR:
