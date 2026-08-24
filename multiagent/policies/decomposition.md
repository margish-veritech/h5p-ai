# Requirement Decomposition Policy

Agents must triage requirements before implementation and split work when a single issue is too large, vague, risky, or made of separable deliverables.

## Issue Points

Use issue points instead of size labels.

```text
1 issue point = 1 hour of expected implementation, verification, and documentation work
```

An issue should fit in one focused PR and should not exceed 8 issue points. If the estimate is over 8 issue points, split the work into child issues. Each child issue should have its own issue point estimate and should be 8 issue points or less.

## Must Split When

Split a task when any of these are true:

- it contains more than one independent feature
- it touches unrelated modules
- it requires database + API + UI + deployment changes
- acceptance criteria can be delivered independently
- implementation likely needs multiple PRs
- review would be hard as a single PR
- estimated work is over 8 issue points
- sequencing or dependencies are unclear

## Do Not Split When

Do not split a task when:

- the task is already small
- splitting creates artificial tiny tasks
- changes must be atomic to be safe
- acceptance criteria cannot be independently verified
- the issue is 8 issue points or less, has clear acceptance criteria, and none of the must-split rules apply

## Sub-Issue Requirements

Each sub-issue must include:

- parent issue link
- clear goal
- acceptance criteria
- dependencies
- expected verification
- suggested labels
- issue point estimate
- sequence order

## Parent Issue Rules

When an issue is split:

- label parent `agent:split`
- remove `agent:ready`
- link all child issues
- use the parent to track overall progress
- close the parent only when children are done

## Human Input Required

Ask for human input instead of splitting when:

- product behavior is ambiguous
- acceptance criteria conflict
- scope cannot be reduced safely
- security, payment, or data behavior is unclear
- the parent issue does not provide enough context to write useful child issues
