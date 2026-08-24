# Project Overview

## What This Project Does

H5P AI Generator is a stateless Next.js application that helps educators and content creators turn source material into downloadable H5P quiz packages.

Users can paste text directly or upload one supported file. The app extracts the source into an editable plain-text preview, sends the reviewed text to OpenAI for quiz generation, and packages the generated content as either individual H5P True/False questions or one H5P Question Set.

## Primary Users

- Educators: create H5P quiz content from lesson material.
- Instructional designers: convert source documents into reviewable quiz packages.
- Developers/maintainers: extend extraction, generation, validation, and H5P packaging behavior.

## Main Capabilities

- Paste source text or extract text from one supported upload.
- Support UTF-8 text, CSV, text-layer PDF, modern DOCX, JPEG, PNG, and WebP image OCR.
- Generate H5P True/False questions.
- Generate H5P Question Set multiple-choice quizzes.
- Review generated quiz content before download.
- Download browser-built `.h5p` packages.

## Non-Goals

This project does not currently aim to provide:

- user accounts, authentication, or authorization
- database persistence
- uploaded file storage
- rate limiting or abuse prevention
- malware scanning
- production hosting controls
- billing or payment flows

## Important External Systems

- GitHub: expected backlog and review workflow for agent tasks.
- Database: none currently.
- APIs: OpenAI API for quiz generation and image OCR.
- Deployment: not configured in the repository; use a Node 20-capable Next.js host.
- Monitoring: not configured in the repository.

## Current Development Priorities

- Preserve safe, bounded source extraction.
- Keep generation route response shapes stable.
- Maintain H5P package compatibility through regression tests.
- Document task evidence so humans and agents can continue work without chat history.
