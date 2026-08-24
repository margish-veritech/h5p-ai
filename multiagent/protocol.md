# Agentic Development Protocol

## Work Sources

Agents may work from:

1. GitHub Issues labeled `agent:ready`
2. Repo-local tasks in `multiagent/tasks/` with `status: ready`

GitHub Issues are preferred for team-visible work.

New GitHub Issues may start with `agent:needs-triage`. Agents must triage unclear or large requirements before implementation.

## Task Priority Order

Pick work in this order:

1. `priority:P0`
2. `priority:P1`
3. `priority:P2`
4. `priority:P3`

Within the same priority, pick the lowest sequence number or oldest ready issue.

## Requirement Triage

Before claiming implementation work, agents must classify the issue or repo-local task.

Readiness checklist:

- clear goal
- clear acceptance criteria
- enough context to begin
- test or verification expectation
- reasonable scope for one PR, estimated at 8 issue points or less
- no unresolved product decision
- dependencies are known

Triage outcomes:

- `agent:ready`: requirement is clear, scoped, and implementable.
- `agent:needs-clarification`: human input is needed before safe implementation.
- `agent:needs-breakdown`: requirement is over 8 issue points, too large, or separable and should be decomposed.
- `agent:blocked`: work cannot proceed because of an external dependency, access issue, or unresolved blocker.
- `agent:split`: parent requirement has been decomposed into child issues.

Full lifecycle:

```text
Issue created
  -> agent:needs-triage
  -> triage agent reviews
  -> if unclear: agent:needs-clarification
  -> if over 8 issue points or too large: agent:needs-breakdown
  -> create sub-issues
  -> parent becomes agent:split
  -> child issues become agent:ready
  -> implementation agent claims ready issue
  -> agent:in-progress
  -> agent:review
  -> agent:done
```

Use issue points for estimation: 1 issue point = 1 hour of expected implementation, verification, and documentation work. Agents must not implement vague, oversized, conflicting, or risky requirements. Any issue estimated over 8 issue points must be split before implementation. Ask for human input when product behavior is ambiguous, acceptance criteria conflict, scope cannot be reduced safely, or security/payment/data behavior is unclear.

Use `multiagent/policies/decomposition.md` when deciding whether to split work, and use `multiagent/templates/requirements-breakdown-template.md` to record the triage result.

## GitHub Issue Flow

```text
agent:needs-triage -> agent:ready -> agent:in-progress -> agent:review -> agent:done
         |                |
         |                v
         |          agent:blocked
         |
         +-> agent:needs-clarification
         |
         +-> agent:needs-breakdown -> child issues -> agent:split
```

## Local Task Status Flow

```text
backlog -> ready -> in_progress -> review -> done
                         |
                         v
                      blocked
```

## Claiming A Task

Only claim tasks classified as `agent:ready` or repo-local tasks with `status: ready`.

When claiming GitHub Issue `#123`:

1. Move label from `agent:ready` to `agent:in-progress`.
2. Comment with agent name and branch.
3. Create a task/feature branch.
4. Create or update local task file.

Branch format:

```text
agent/GH-123-short-title
```

Task file format:

```text
multiagent/tasks/GH-123-short-title.md
```

For repo-only work, use:

```text
multiagent/tasks/TASK-000-short-title.md
```

## Pull Request Rule

Every repository change must be made on a task/feature branch and delivered through a pull request before it lands on `main`, `dev`, release, protected, shared, or other target branches.

Agents may commit only to the task/feature branch for the active task. Agents must not commit directly to target branches or push/merge changes to target branches outside a pull request.

## Working The Task

During implementation, update the task file when you discover:

- relevant files
- root cause
- design decisions
- blockers
- changed scope
- test findings

For this project, also record changes to:

- source extraction limits or accepted formats
- OpenAI prompts, models, or parsing behavior
- H5P package structure
- privacy/security assumptions
- runtime requirements

## Completing The Task

Before moving to `review`, update:

- task status
- done evidence
- changed files
- test results
- one-line log
- GitHub Issue labels
- PR link for any repository changes

## Blocking The Task

If blocked:

1. Set local task status to `blocked`.
2. Add blocker details.
3. Create handoff file.
4. Move GitHub label to `agent:blocked`, if using GitHub.
5. Comment on the issue with the blocker summary, if using GitHub.

## Stopping Mid-Task

Before stopping, agents must leave enough context for another agent to continue without reading chat history.
