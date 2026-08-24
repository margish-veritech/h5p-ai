# Glossary

## Agent

An AI coding assistant or automation working in the repository.

## Agentic Development Protocol

The repo-local workflow in `AGENTS.md` and `multiagent/` that defines how agents pick up tasks, record evidence, and hand off work.

## H5P

A package format and ecosystem for interactive learning content. This repo generates `.h5p` quiz packages in the browser.

## H5P True/False

An H5P content type for a single true/false question.

## H5P Question Set

An H5P content type that groups multiple questions into one quiz package.

## Source

The instructional material provided by the user through pasted text or one supported upload.

## Extraction

The process of converting a supported upload into normalized plain text.

## OCR

Optical character recognition. This project uses OpenAI for printed-text OCR on JPEG, PNG, and WebP images.

## Normalized Text

Canonical plain text produced from pasted content and/or uploaded files before quiz generation.

## Generation Request

The validated request sent to a quiz generation API route, including source text, question count, and difficulty.

## Done Evidence

The changed files, commands, test results, behavior verification, and limitations recorded before moving a task to review or done.

## Handoff

A durable note in `multiagent/handoffs/` explaining incomplete work so another human or agent can continue without chat history.
