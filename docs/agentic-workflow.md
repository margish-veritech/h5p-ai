# Agentic Workflow

This file is the agent-perspective map for where to go, what to read, and when to read it.

## Agent Reading Workflow

### 1. Entering The Repo

Read first:

1. `AGENTS.md`
2. `docs/agentic-workflow.md`
3. `docs/project-overview.md`

Use this step to understand the repository purpose, the agent operating rules, and the high-level product.

### 2. Before Choosing Work

Read:

1. `multiagent/protocol.md`
2. `multiagent/README.md`
3. `multiagent/policies/task-status.md`

Use this step to understand GitHub labels, task statuses, priority order, issue points, and the lifecycle from triage to done.

### 3. Before Triaging A GitHub Issue

Read:

1. The GitHub Issue body and comments
2. `.github/ISSUE_TEMPLATE/agent_task.yml` or `.github/ISSUE_TEMPLATE/requirements_epic.yml`
3. `multiagent/protocol.md`
4. `multiagent/policies/decomposition.md`
5. `multiagent/templates/requirements-breakdown-template.md`

Use this step to classify the issue as `agent:ready`, `agent:needs-clarification`, `agent:needs-breakdown`, `agent:blocked`, or `agent:split`.

Do not code during triage.

### 4. Before Claiming Implementation

Read:

1. The ready GitHub Issue or local task file
2. `docs/setup.md`
3. `docs/testing.md`
4. `docs/conventions.md`
5. `multiagent/policies/permissions.md`
6. Any relevant policy files in `multiagent/policies/`

Use this step to confirm the goal, acceptance criteria, affected area, issue points, verification expectation, dependencies, and approval requirements.

Only claim work labeled `agent:ready` or a local task with `status: ready`.

All repository changes must be made on a task/feature branch and delivered through a pull request. Agents must not commit directly to `main`, `dev`, release branches, protected branches, shared branches, or other target branches.

### 5. Before Editing Code

Read the files that own the affected behavior.

Common paths:

- UI workflow: `app/page.tsx` and `components/`
- API extraction: `app/api/extract/route.ts` and `lib/source/`
- Quiz generation: `app/api/generate/` and `lib/mapGeneratedQuestions.ts` or `lib/mapGeneratedQuestionSet.ts`
- H5P packaging: `lib/generateH5P.ts`, `lib/generateQuestionSetH5P.ts`, `lib/h5pContent.ts`, and `lib/h5pQuestionSetContent.ts`
- Shared limits: `lib/sourceLimits.ts`
- Tests: `tests/`

Use this step to understand local patterns before making changes.

### 6. While Working

Keep the active task file in `multiagent/tasks/` updated with discoveries, scope changes, changed files, and test findings.

Commit only to the task/feature branch for the active task. Every source, test, documentation, task, log, configuration, or intentionally tracked generated-file change must go through a pull request before it lands on a target branch.

When work becomes blocked or risky, read:

1. `multiagent/templates/handoff-template.md`
2. `multiagent/handoffs/README.md`

Then leave a handoff that another agent can continue from without chat history.

### 7. Before Review

Read:

1. `docs/testing.md`
2. `multiagent/policies/testing.md`
3. The active task file
4. `multiagent/templates/changelog-entry-template.md`
5. `multiagent/logs/README.md`

Use this step to record changed files, commands run, test results, behavior verified, known limitations, and the one-line work log entry.

## GitHub Issue Triage

GitHub Issues are the preferred backlog for agent work. New issues may start as `agent:needs-triage`.

This repo estimates implementation work with issue points:

```text
1 issue point = 1 hour of expected implementation, verification, and documentation work
```

Issues over 8 issue points should be split into smaller issues before coding.

Before implementation, a triage agent checks whether the issue has:

- clear goal
- clear acceptance criteria
- enough context to begin
- test or verification expectation
- reasonable scope for one PR, estimated at 8 issue points or less
- no unresolved product decision
- known dependencies

## Labels

- `agent:needs-triage`: issue has not been classified yet.
- `agent:needs-clarification`: human input is needed before implementation.
- `agent:needs-breakdown`: issue is over 8 issue points, too large, vague, or separable.
- `agent:split`: parent issue has child issues and tracks overall progress.
- `agent:ready`: issue is clear, scoped, and ready for implementation.
- `agent:in-progress`: implementation is claimed and active.
- `agent:blocked`: issue cannot continue because of an external dependency or blocker.
- `agent:review`: implementation is ready for review.
- `agent:done`: work is merged, accepted, or explicitly complete.

## Breakdown

Agents should split large requirements when independent deliverables can be reviewed and verified separately.

Each child issue should include:

- parent issue link
- goal
- acceptance criteria
- dependencies
- expected verification
- suggested labels
- issue point estimate
- sequence order

Use `multiagent/policies/decomposition.md` for split rules and `multiagent/templates/requirements-breakdown-template.md` for recording a proposed breakdown.

## Issue Forms

- `.github/ISSUE_TEMPLATE/agent_task.yml` is for implementation-ready tasks intended to fit one PR.
- `.github/ISSUE_TEMPLATE/requirements_epic.yml` is for larger requirements that need triage and possible decomposition.
