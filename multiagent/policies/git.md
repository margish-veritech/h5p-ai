# Git Policy

## Required

- Start from latest `main` unless task says otherwise.
- Use a task/feature branch for every repository change.
- Commit only to the task/feature branch for the active task.
- Open a pull request for every repository change before it lands on `main`, `dev`, release, protected, shared, or other target branches.
- Keep commits scoped to the task.
- Do not mix unrelated cleanup with feature work.
- Check working tree before and after changes.

## Branch Names

GitHub issue tasks:

```text
agent/GH-<issue-number>-<short-title>
```

Repo-only tasks:

```text
agent/TASK-<task-number>-<short-title>
```

## Forbidden

Agents must not:

- commit directly to `main`, `dev`, release branches, protected branches, shared branches, or any other target branch
- push or merge repository changes to a target branch outside a pull request
- run `git reset --hard`
- force push
- rewrite history
- delete branches with unmerged work
- revert user changes unless explicitly instructed

## Commit Messages

Use:

```text
GH-123: short imperative summary
```

Example:

```text
GH-123: add empty password validation
```

For repo-only tasks:

```text
TASK-000: short imperative summary
```
