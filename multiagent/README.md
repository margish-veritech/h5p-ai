# Multiagent Workflow

This directory contains the repo-local operating system for agents.

GitHub Issues are the backlog. Files in this directory are the durable working memory.

GitHub Issues may start as `agent:needs-triage`. Agents should classify and, when needed, decompose requirements before implementation.

This workflow estimates work with issue points: 1 issue point = 1 hour of expected implementation, verification, and documentation work. Issues over 8 issue points should be split before coding.

For the agent-perspective read order, use `docs/agentic-workflow.md`.

## Directory Map

```text
multiagent/
  protocol.md              Process agents must follow
  tasks/                   One task mirror per active task
  logs/                    One-line chronological work log
  handoffs/                Incomplete work handoffs
  policies/                Permissions, restrictions, and safety rules
  templates/               Copy-ready templates
```

## Requirement Triage

Agents must not blindly implement large or unclear issues.

Before coding, classify each issue as:

- `agent:ready`
- `agent:needs-clarification`
- `agent:needs-breakdown`
- `agent:blocked`
- `agent:split`

If an issue contains separable work or is over 8 issue points, use `multiagent/policies/decomposition.md` and `multiagent/templates/requirements-breakdown-template.md` to propose child issues with acceptance criteria, dependencies, labels, issue point estimates, verification expectations, and sequence.

## Core Principle

No important agent context should live only in chat.

If an agent discovers something important, it must be written into:

- the task file
- a handoff file
- docs
- an ADR
- or the one-line log

## How This Applies Here

For H5P AI Generator, durable context is especially important around:

- upload and extraction limits
- OpenAI prompt and response-shape changes
- generated H5P package compatibility
- PDF runtime behavior
- security/privacy assumptions about uploaded source and image OCR

When a task changes any of these areas, update the active task file and the relevant documentation before moving the task to review.
