# Agent Permissions Policy

## Green Actions

Agents may do these without approval when scoped to the active task:

- read repository files
- edit source files
- add or update tests
- update documentation
- create task branches
- commit scoped changes to task/feature branches
- classify issues for readiness
- create GitHub sub-issues from a clear parent requirement
- update non-terminal GitHub triage labels
- update task files
- update one-line logs
- add handoff notes
- run local test/build/lint commands

## Yellow Actions

Agents may do these only with written justification in the task file:

- refactor shared abstractions
- modify config files
- update CI workflows
- change public interfaces
- edit generated files
- add feature flags
- touch security-sensitive code

## Red Actions

Agents must get explicit human approval before:

- adding dependencies
- changing database schema
- writing migrations
- changing auth or permission behavior
- changing billing/payment behavior
- deleting major code paths
- rewriting git history
- changing deployment secrets/config
- closing issues without PR/review

## Forbidden Actions

Agents must not:

- commit directly to `main`, `dev`, release branches, protected branches, shared branches, or any other target branch
- push or merge repository changes to a target branch outside a pull request

## Project-Specific Notes

- Changing OpenAI model selection, prompt shape, OCR behavior, or API response contracts is at least yellow and must be justified in the task file.
- Changing upload limits, supported file types, timeout values, or persistence behavior is at least yellow.
- Adding authentication, persistence, malware scanning, rate limiting, production deployment controls, or billing is red unless explicitly authorized by the task.
