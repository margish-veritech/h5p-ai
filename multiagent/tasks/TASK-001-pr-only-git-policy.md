---
id: TASK-001
source: local
github_issue:
title: "Require PR-only agent changes"
status: review
priority: P2
sequence: 001
issue_points: 1
depends_on: []
claimed_by: Codex
branch: agent/TASK-001-pr-only-git-policy
pr:
created_at: 2026-08-24
updated_at: 2026-08-24
---

# TASK-001: Require PR-Only Agent Changes

## Goal

Update agent rules so agents commit only to task/feature branches and all repository changes land through pull requests.

## Acceptance Criteria

- [x] Top-level agent instructions prohibit direct commits to target branches.
- [x] Git policy allows commits only on task/feature branches.
- [x] Workflow/status docs require PRs for any repository change, not only source code changes.
- [x] Task evidence records changed files and verification.

## Context

Requested directly by the repository owner on 2026-08-24.

## Affected Areas

- `AGENTS.md`
- `docs/agentic-workflow.md`
- `multiagent/protocol.md`
- `multiagent/policies/git.md`
- `multiagent/policies/permissions.md`
- `multiagent/policies/task-status.md`
- `multiagent/logs/2026-08.md`
- `multiagent/tasks/README.md`

## Issue Points

```text
1 issue point = 1 hour
```

- Estimate: 1
- Over 8 issue points: no

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

Reason: documentation-only policy update requested by the repository owner.

## Implementation Notes

- Added an explicit pull request rule to the Git policy and agent protocol.
- Mirrored the rule in the top-level `AGENTS.md` instructions.
- Replaced code-only PR wording with repository-change PR wording to include docs, task files, logs, configuration, tests, source, and intentionally tracked generated artifacts.
- Left the pre-existing untracked `.h5p-library-cache/` directory untouched.

## Test Requirements

Expected checks:

- [ ] unit tests
- [ ] integration tests
- [ ] e2e tests
- [ ] lint
- [ ] build
- [x] manual verification

## Done Evidence

Fill before review/done:

- Changed files:
  - `AGENTS.md`
  - `docs/agentic-workflow.md`
  - `multiagent/protocol.md`
  - `multiagent/policies/git.md`
  - `multiagent/policies/permissions.md`
  - `multiagent/policies/task-status.md`
  - `multiagent/logs/2026-08.md`
  - `multiagent/tasks/README.md`
  - `multiagent/tasks/TASK-001-pr-only-git-policy.md`
- Commands run:
  - `git status --short --branch`
  - `sed -n ...` required context docs
  - `rg -n "commit|branch|PR|pull request|direct" AGENTS.md docs multiagent`
  - `rg -n "PR exists when code changed|PR is opened if code changed|Link the PR when code changes|code changed" AGENTS.md docs multiagent`
  - `git diff --check`
- Test results:
  - `git diff --check` passed.
  - Stale code-only PR wording scan returned no matches.
  - Unit/build checks not run; documentation-only policy update.
- Behavior verified:
  - Policy docs now state that agents may commit only to task/feature branches and every repository change must go through a pull request.
- Known limitations:
  - GitHub PR link will be added after the PR is opened.

## Handoff Notes

No blocker.

## Links

- GitHub Issue:
- PR:
- Related ADR:
