# Post–multi-input roadmap: make quiz creation easy and trustworthy

**Research date:** 2026-08-20  
**Audience:** Michael and the H5P AI product/engineering team  
**Scope:** What to build after the current multi-input implementation so a content creator can reliably turn source material into a usable H5P quiz.

## Executive recommendation

Do not make the next milestone “support more inputs” or “generate more H5P types.” Multi-input removes the ingestion bottleneck, but the product still jumps from source text and three settings directly to generated output. The next milestone should be **creator control and trust**.

The target journey is:

> **Source → brief → concepts and coverage → generate → review with evidence → learner preview and checks → save → export or publish**

The smallest useful post–multi-input release should add:

1. A guided generation brief: audience/grade, learning objectives, output language, subject, difficulty, question count, and question mix.
2. A concept-and-coverage checkpoint before generation, where the creator can include, exclude, and weight concepts extracted from the source.
3. A real quiz editor: add, delete, duplicate, reorder, undo, and regenerate one question, its distractors, or its feedback without replacing approved work.
4. Source evidence for every item: a supporting excerpt plus page/row/section when available, with an explicit “needs review” state.
5. Learner preview plus structural, pedagogical, and accessibility checks before export.
6. Recoverable drafts with autosave and a versioned internal project format.
7. One coherent export action for the quiz, followed later by library, collaboration, and LMS publishing.

This sequence is consistent across the strongest benchmarks. H5P Smart Import makes creators review extracted text, review concepts, select content types, and test/edit the result; it also supports audience, focus, learning-objective, and output-language controls. Wayground and Kahoot similarly add preferences, selective question review, full editing, saving, and publishing rather than treating generation as the end of the workflow.

## What the repository supports today

This is a snapshot of the shared worktree while multi-input support is being implemented. It is not a criticism of that in-progress work.

- The new source UI accepts extracted text and an editable canonical preview, then passes exactly that text into generation ([`components/InputForm.tsx`](../components/InputForm.tsx#L178), [`app/page.tsx`](../app/page.tsx#L187)). This is the right foundation.
- The creator brief is still limited to content type, count, and difficulty ([`components/InputForm.tsx`](../components/InputForm.tsx#L152), [`lib/generationRequest.ts`](../lib/generationRequest.ts#L7)). There is no audience, objective, language, subject, standards, focus, or coverage model.
- The internal domain model only represents True/False and Multiple Choice/Question Set content; it has no project, stable item ID, objective, tag, review status, source evidence, or generation metadata ([`lib/types.ts`](../lib/types.ts#L1)).
- Review allows direct field editing and whole-quiz regeneration. It does not provide add/delete/duplicate/reorder, selective regeneration, undo, or an explicit reviewed/approved state ([`app/page.tsx`](../app/page.tsx#L293), [`components/QuestionSetReview.tsx`](../components/QuestionSetReview.tsx#L30), [`components/MultiChoiceReviewCard.tsx`](../components/MultiChoiceReviewCard.tsx#L23)).
- True/False items download individually; Question Set downloads as one package ([`components/ReviewCard.tsx`](../components/ReviewCard.tsx#L24), [`components/QuestionSetReview.tsx`](../components/QuestionSetReview.tsx#L46)). There is no project save, batch export, or publication step.
- Validation catches empty fields, too few or duplicate options, and missing correct answers, but not source grounding, ambiguity, one-best-answer quality, objective coverage, reading level, or accessibility ([`lib/validateContent.ts`](../lib/validateContent.ts#L5)).
- The application is described as stateless and current state lives in the page component, so a reload can discard work ([`README.md`](../README.md#L1), [`app/page.tsx`](../app/page.tsx#L32)).
- Generation uses the older JSON object response mode. Both routes still depend on parsing and mapping loosely structured model output ([True/False route](../app/api/generate/true-false/route.ts#L27), [Question Set route](../app/api/generate/question-set/route.ts#L27)).
- The source response exposes file-level metadata and total pages/rows but not a general locator map for every extracted span ([`lib/source/types.ts`](../lib/source/types.ts#L53)). PDF page markers and CSV row markers can seed provenance, but a stable source-span representation is still needed.

The current product is therefore a capable **generator/exporter**, not yet a complete **authoring workflow**.

## Benchmark findings

| Product or standard | Relevant workflow pattern | Implication for H5P AI |
|---|---|---|
| [H5P Smart Import tutorial](https://help.h5p.com/hc/en-us/articles/11700800414237-Smart-Import-Step-by-Step-Tutorial) | Upload → review text → review concepts → select types → test/edit | Add a concept/coverage checkpoint and learner preview; source extraction alone is not the complete workflow. |
| [H5P Smart Import customization](https://help.h5p.com/hc/en-us/articles/22960482644125-Smart-Import-Customization) | Tailors output to audience, focus areas, and learning objectives; focused, well-structured instructions work best | Replace a generic prompt box with a guided brief whose fields become explicit generation constraints. |
| [H5P Smart Import language support](https://help.h5p.com/hc/en-us/articles/27553991077149-Smart-Import-Language-Support) | Output language is independent of source language; 56 output languages are offered, with quality caveats for beta languages | Model output language separately from source language and evaluate quality per language before claiming support. |
| [Wayground AI](https://help.wayground.com/support/solutions/articles/158000405091-wayground-ai-generate-assessments-from-prompts-documents-youtube-more) | Preferences include count, subject, grade, language, standards/depth; creators can refine with AI or edit manually, then save/publish | Guided controls, selective refinement, and a save/publish end state are table stakes. |
| [Kahoot AI](https://support.kahoot.com/hc/en-us/articles/40803785990675-How-to-generate-a-kahoot-with-AI) | Creators review suggested questions, add all or selected items, edit media/type, add manual questions, save, and remain responsible for accuracy | Treat AI output as suggestions entering an editor, not as an automatically finished assessment. |
| [H5P reuse](https://help.h5p.com/hc/en-us/articles/7506823852317-Download-or-Copy-H5P-Content-Using-the-Reuse-Button) | `.h5p` files can be downloaded/uploaded between supporting sites; content and individual blocks can be copied/pasted | Preserve `.h5p` as the immediate portability path and later add a searchable internal question/project library. |
| [H5P sharing and collaboration](https://help.h5p.com/hc/en-us/articles/7521325114013-Share-and-embed-content) | Folders, publishing states, organization sharing, collaborators, and ownership | Projects, roles, and publishing states are a later multi-user capability, not an MVP generation control. |
| [H5P in an LMS](https://help.h5p.com/hc/en-us/articles/25645986853021-Adding-content-to-your-LMS) | H5P.com uses LTI for LMS insertion and learner reporting | Direct LMS publishing is valuable but requires an authenticated deployment/integration decision. Keep it after reliable save/export. |

The common pattern is more important than any single feature: **AI proposes; the creator constrains, selects, verifies, edits, previews, and deliberately publishes.**

## Prioritized product roadmap

### P0 — Complete the creator loop

These capabilities should precede additional source formats or broad question-type expansion.

#### 1. Versioned project model and recoverable drafts

Create an internal `QuizProject` schema before adding more editor behavior. Suggested fields:

- `schemaVersion`, `projectId`, `title`, timestamps, and stable item IDs.
- Canonical source snapshot, source metadata, extraction warnings, and source-span locator map.
- Creator brief, selected concepts, coverage targets, and quiz items.
- Per-item evidence, review status, validation results, and generation metadata.
- Model/prompt/schema versions sufficient to reproduce and evaluate behavior.

For the current single-user/stateless product, start with browser-side autosave in IndexedDB plus project JSON export/import. Do not retain uploaded binaries by default. Show `Saving…`, `Saved`, and failure states, restore after reload, and provide a clear “delete local draft” action. Server sync, accounts, and organizational storage come later because they introduce privacy, retention, authorization, and operational decisions.

Why first: stable IDs and a project schema are prerequisites for undo, selective regeneration, provenance, review state, versions, and future collaboration.

#### 2. Guided creator brief

Keep the existing simple defaults, with optional progressive disclosure. Add:

- Learner audience or grade/level.
- One or more learning objectives.
- Subject/topic and optional focus/exclusions.
- Output language, independent of source language.
- Question count and difficulty.
- Question type or mix; initially only the supported True/False and Multiple Choice modes.
- Assessment purpose: quick knowledge check, practice with feedback, or more challenging application.

Convert these fields into structured generation inputs and display them in review so the creator can see the intent being enforced. Avoid making creators invent “prompt engineering” syntax.

#### 3. Concept and coverage plan

Before spending a full generation call, extract a compact plan:

- Concepts found in the source, each with a supporting source span.
- Include/exclude controls.
- Intended number and difficulty of questions per concept.
- A warning when the requested objective is not supported by the source.

Default to a sensible automatic selection so a novice can continue in one click. Advanced creators can adjust coverage. This step prevents five near-duplicate questions about the easiest paragraph and makes the eventual quiz explainable.

#### 4. Granular review editor

Add the basic authoring primitives that are currently missing:

- Add a manual question.
- Delete, duplicate, and reorder questions with both keyboard-accessible controls and optional drag-and-drop.
- Add/remove/reorder options and enforce the intended single-select or multi-select rule explicitly.
- Undo/redo for edits and regeneration.
- Regenerate one question while preserving approved items.
- Regenerate only the stem, distractors, correct/wrong feedback, or difficulty.
- Give regeneration a short instruction such as “use a common misconception” or “make this less ambiguous.”
- Keep the old item available until the creator accepts the replacement.

Bulk operations should be small and reversible: select items, change difficulty/type where compatible, mark reviewed, or delete. Whole-quiz regeneration can remain, but it should no longer be the only refinement mechanism.

#### 5. Evidence and human review

For every generated item, return:

- A short source excerpt supporting the correct answer.
- Page, CSV row, or section when the extractor can supply one; otherwise a stable character span in the canonical source.
- A grounding status such as `supported`, `unclear`, or `outside source`.
- A creator review state: `needs review`, `reviewed`, or `approved`.

Show the evidence beside the question with a “view in source” action. Block final publish for structurally invalid items; warn rather than silently hide pedagogical or grounding concerns. Require an explicit creator acknowledgement before export when any item is unclear or outside the source.

This follows the NIST Generative AI Profile’s recommendations to document content lineage and assess outputs against ground truth using human oversight and automated evaluation. It also matches Kahoot and Wayground’s explicit requirement that creators review AI output before use.

#### 6. Learner preview and preflight checks

Add a true learner-mode preview of the final H5P behavior, not merely editable fields. Preflight should include:

- Structural blockers: empty content, invalid correct answers, duplicate options, export/package errors.
- Grounding blockers/warnings: unsupported answer, evidence mismatch, requested objective absent from source.
- Pedagogical warnings: ambiguous or negative stem, multiple defensible answers, trivial cueing, implausible distractors, duplicated concept, and unbalanced coverage/difficulty.
- Accessibility checks: keyboard completion, visible/programmatic labels, language metadata, focus behavior, contrast in any custom theme, and accessible async/error announcements.
- Package smoke test: build, load, answer, show feedback, score, and retry/reset where applicable.

Pedagogical checks should implement explainable rules, not an unexplained “quality score.” The University of Waterloo guidance supports clear and self-contained stems, one best answer, plausible homogeneous distractors, familiar language, avoiding trick/negative questions, and generally three to five alternatives. These should usually be warnings that teach the author how to improve the item.

#### 7. Coherent completion and export

- Give the project one clear final action: `Download quiz .h5p` for Question Set and `Download all .h5p files` as a zip for separate True/False items.
- Use predictable filenames and include a manifest/project JSON in the optional archive so editing can resume.
- Show a completion receipt: filename, item count, validation/review state, and next-step instructions for uploading to an H5P-capable site.
- Keep direct H5P upload/LMS publishing out of P0 unless the deployment target and credentials are already decided.

### P1 — Improve reuse, reach, and reliability

1. **Projects and question library:** list, rename, duplicate, search, tag, and reuse projects/questions. Filters should include subject, grade, objective, type, language, status, creator, and modified date.
2. **Localization:** translate or regenerate into a selected output language while preserving objective, correct answer, and evidence linkage. Evaluate supported languages individually and label beta quality honestly.
3. **Question-type expansion:** add one type at a time based on assessment purpose and H5P accessibility status. `Fill in the Blanks` is a stronger early candidate than visually complex types because H5P’s April 2026 table lists it as supporting WCAG 2.2 AA; the current Multiple Choice, Question Set, and True/False entries are listed as partially supporting because of a label-in-name issue. Each new type needs its own schema, editor, validator, learner preview, package fixtures, and quality evals.
4. **Templates/presets:** save reusable briefs for common audiences, objectives, languages, feedback style, and assessment purpose.
5. **Accessible authoring:** audit both the creator UI and the generated content against WCAG 2.2 AA. Use W3C ATAG as the product model: Part A makes the authoring interface accessible to creators; Part B helps creators produce accessible content.
6. **Operational telemetry:** capture source format, extraction/generation latency, failure class, token/cost totals, prompt/schema/model version, item edit/regeneration rates, and export completion. Do not log source or quiz content by default.

### P2 — Publish and collaborate

1. Authentication, organization/workspace, roles, and ownership.
2. Server-side projects, revision history, comments, review requests, and approval states.
3. Folders, sharing, cloning, archiving/trash, and retention controls.
4. Direct publishing to an explicitly supported H5P host or LMS. Use LTI 1.3/Advantage for hosted tool integration and grade/report flows where appropriate; this is not equivalent to merely downloading a package.
5. Optional QTI export/import if the product wants to interoperate with assessment item banks and non-H5P delivery systems. QTI is designed to exchange items, tests, and results among authoring tools, item banks, learning platforms, delivery systems, and analytics engines. It is a separate product surface and should not delay the H5P creator loop.
6. Learner-result reporting and item analysis once the product owns or integrates with delivery. Use response distributions to identify weak distractors, confusing questions, and objectives that need revision.

### P3 — Scale and optimization

- Bulk project generation from multiple sources with a queue, per-project status, retry, and cost controls.
- URL, video, and connected-drive ingestion only after the existing extractor has quality/latency telemetry and the creator loop is stable.
- Standards alignment and organization-managed taxonomies.
- Variant generation with equivalence checks.
- Recommendations based on learner results, always requiring creator review.

## Implementation-ready work breakdown

The following smaller tasks can be entered into the delivery backlog. The ordering reflects dependencies, not calendar estimates.

| ID | Subtask | Acceptance signal | Depends on |
|---|---|---|---|
| CW-01 | Define `QuizProject`, `CreatorBrief`, `Concept`, `QuizItem`, `SourceEvidence`, and `ReviewStatus` schemas with versioning and stable IDs | Round-trip fixtures preserve every field; older schema fixture migrates or fails with a clear message | Multi-input merged |
| CW-02 | Add local project autosave/recovery and project JSON import/export | Reload restores an in-progress project; save failure is visible; user can delete local data | CW-01 |
| CW-03 | Build the progressive creator brief UI and server validation | Generation request contains validated audience, objectives, subject/focus, language, purpose, count, difficulty, and type | CW-01 |
| CW-04 | Add concept extraction and coverage-plan API/schema | Every suggested concept links to a source span; creator can include/exclude and allocate questions | CW-01, CW-03 |
| CW-05 | Build the concept/coverage review step | Default plan is one-click; unsupported objectives and over-concentrated coverage are explained | CW-04 |
| CW-06 | Move generation to strict JSON Schema output and stable item IDs | Model output either validates exactly or returns a typed failure; mapping no longer accepts ambiguous shapes | CW-01, eval baseline |
| CW-07 | Add granular item/option CRUD, reorder, and keyboard controls | Creator can add/delete/duplicate/reorder without regenerating; every operation is keyboard reachable | CW-01 |
| CW-08 | Add undo/redo and scoped regeneration with accept/reject | Approved items are unchanged; the prior item remains until replacement is accepted | CW-06, CW-07 |
| CW-09 | Generate and display item evidence plus “view in source” | Each generated item has a supporting excerpt and locator/span or an explicit `unclear` status | CW-01, CW-04, CW-06 |
| CW-10 | Expand preflight validation and pedagogical lints | Structural issues block export; grounding, item-writing, coverage, and accessibility warnings explain fixes | CW-06, CW-09 |
| CW-11 | Add learner preview and package smoke-test fixtures | Creator can answer the preview; package loads and scores correctly for every supported type | CW-07, CW-10 |
| CW-12 | Add explicit review/approval flow and unified export | Export summary shows reviewed/warned items; True/False batch zip and Question Set package work predictably | CW-02, CW-09, CW-11 |
| CW-13 | Add privacy-safe product telemetry and creator-funnel events | Time/failure/cost/funnel metrics are available without retaining source content | CW-01 |
| CW-14 | Create a golden evaluation suite and release gate | Representative sources/formats run automatically; regressions in validity, grounding, correctness, and item quality block release | Start before CW-06; grows continuously |
| CW-15 | Conduct five novice-creator usability sessions | Observed findings and completion times produce a ranked fix list before P0 release | CW-03 through CW-12 vertical slice |

Recommended delivery slices:

- **Slice A — recoverable intent:** CW-01–03.
- **Slice B — planned generation:** CW-04–06 plus initial CW-14.
- **Slice C — safe editing:** CW-07–10.
- **Slice D — completion:** CW-11–13.
- **Release validation:** CW-14–15 across all slices.

## AI quality and engineering controls

### Strict outputs

The current `gpt-4o-mini` model supports Structured Outputs. OpenAI’s current API reference says JSON Schema output ensures adherence to the supplied schema and recommends it over the older JSON object mode used in the repository. Move generation and OCR shapes to strict schemas after capturing a baseline. This reduces structural retries, but it does **not** prove factual correctness or assessment quality.

### Golden evaluation suite

Build a small, reviewed corpus before changing prompts or models:

- Clean TXT, structured CSV, DOCX, text-layer PDF, image/OCR, and pasted text.
- Short, long, sparse, duplicated, contradictory, and poorly structured sources.
- Sources containing prompt-injection-like instructions.
- Material with easy facts, misconceptions, higher-order objectives, numbers, negation, and content that cannot support the requested objective.
- At least one representative source per claimed output language.

Score:

- Schema/package validity and exact requested count.
- Correct answer and feedback correctness.
- Source-grounding/evidence accuracy.
- Objective and concept coverage.
- Ambiguity and single-best-answer quality.
- Distractor plausibility and cueing.
- Reading level/language suitability.
- Duplicate/near-duplicate rate.
- Latency, tokens, cost, and retry rate.

Use deterministic checks where possible and blinded human review for educational quality. OpenAI’s Evals API can define repeatable data schemas and multiple graders, but a repository-owned fixture suite is also appropriate and avoids making quality testing dependent on one vendor API.

### Release discipline

- Establish current prompt/model metrics first.
- Change one variable at a time: schema, prompt, model snapshot, temperature, or validation.
- Pin a tested model snapshot when reproducibility matters; do not migrate models solely because a newer alias exists.
- Version the prompt and output schema in every project and telemetry event.
- Set quality thresholds from the measured baseline and expert review, not an invented percentage.
- Do not auto-publish AI-generated assessments.

## Accessibility requirements

WCAG 2.2 covers the web experience, but this product is also an authoring tool. W3C ATAG therefore supplies the better two-sided framing:

1. The creator interface itself must be accessible.
2. The interface must guide creators toward accessible learner content.

Concrete implications:

- Every generation/extraction/save status must be announced without stealing focus.
- Reordering cannot be drag-only; provide move up/down controls and preserve focus.
- Validation must connect messages to the exact field/item and provide a text summary.
- Preview must work with keyboard, screen reader, zoom/reflow, reduced motion, and high contrast.
- Language must be carried into generated content metadata.
- New content types must be checked against the current H5P accessibility recommendation and independently tested in the package version shipped by this app.
- “Accessible by default” templates and feedback are more valuable than a checklist that appears only at the end.

## Product success measures

Instrument the funnel from source to usable package. Suggested measures:

- Median time from valid source to first exported valid quiz; proposed usability target: under five minutes for a novice creating five questions from a clean source.
- Source-start → generation → preview → export completion rates and the biggest abandonment step.
- Extraction/generation failure and retry rates by source format.
- Percentage of items with source evidence, reviewed state, and no blocking preflight error.
- Per-item edit, scoped-regeneration, accept/reject, and undo rates.
- Draft recovery and return-to-project rate.
- Expert-rated grounding, correctness, objective coverage, ambiguity, and distractor quality from the golden set.
- Keyboard-only task completion and WCAG/ATAG audit defects.
- Export/package load success by H5P type and target platform.

Do not optimize for “few edits.” Editing can demonstrate healthy human review. Optimize for faster completion **without** lowering expert-rated correctness or creator confidence.

## Explicit non-goals for the next milestone

- More upload formats, URLs, video, or connected drives.
- Generating every H5P content type.
- Direct LMS publishing before a host/integration and authentication model are selected.
- Server-side source retention before privacy, deletion, access-control, and retention policies exist.
- Fully automatic publication or a single opaque AI “quality score.”
- QTI, collaboration, learner analytics, or standards mapping in the first post–multi-input release.

## Decision requested from Michael

Approve **P0: complete the creator loop** as the next product theme, with CW-01 through CW-15 as the initial breakdown. In particular, approve these product principles:

1. Creator intent and concept coverage are reviewed before generation.
2. Every generated item remains editable, traceable to source evidence, and explicitly human-reviewed.
3. Work is recoverable before additional integration breadth is added.
4. Learner preview and accessibility/quality preflight are release gates.
5. More question types, collaboration, and direct LMS publishing follow only after the P0 loop is measured and stable.

## Sources

### Product and ecosystem

- [H5P Smart Import step-by-step tutorial](https://help.h5p.com/hc/en-us/articles/11700800414237-Smart-Import-Step-by-Step-Tutorial)
- [H5P Smart Import customization](https://help.h5p.com/hc/en-us/articles/22960482644125-Smart-Import-Customization)
- [H5P Smart Import language support](https://help.h5p.com/hc/en-us/articles/27553991077149-Smart-Import-Language-Support)
- [H5P content-type accessibility recommendations](https://help.h5p.com/hc/en-us/articles/7505649072797-Content-types-recommendations)
- [H5P reuse/download/copy](https://help.h5p.com/hc/en-us/articles/7506823852317-Download-or-Copy-H5P-Content-Using-the-Reuse-Button)
- [H5P sharing, folders, publication, and collaboration](https://help.h5p.com/hc/en-us/articles/7521325114013-Share-and-embed-content)
- [H5P LMS publishing through LTI](https://help.h5p.com/hc/en-us/articles/25645986853021-Adding-content-to-your-LMS)
- [H5P drill-down reports](https://help.h5p.com/hc/en-us/articles/7518368882717-Drill-down-Reports)
- [Wayground AI assessment workflow](https://help.wayground.com/support/solutions/articles/158000405091-wayground-ai-generate-assessments-from-prompts-documents-youtube-more)
- [Kahoot AI authoring workflow](https://support.kahoot.com/hc/en-us/articles/40803785990675-How-to-generate-a-kahoot-with-AI)

### Quality, accessibility, AI, and interoperability

- [University of Waterloo: Designing Multiple-Choice Questions](https://uwaterloo.ca/centre-for-teaching-excellence/catalogs/tip-sheets/designing-multiple-choice-questions)
- [2025 peer-reviewed MCQ item-writing review in ERIC](https://eric.ed.gov/?id=EJ1494236)
- [W3C Authoring Tool Accessibility Guidelines overview](https://www.w3.org/WAI/standards-guidelines/atag/)
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [NIST Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)
- [OpenAI GPT-4o mini model capabilities](https://developers.openai.com/api/docs/models/gpt-4o-mini)
- [OpenAI Structured Outputs response-format reference](https://developers.openai.com/api/reference/java/resources/beta/subresources/responses)
- [OpenAI Evals API](https://developers.openai.com/api/reference/resources/evals/methods/create)
- [1EdTech QTI specification](https://www.1edtech.org/standards/qti/index)
- [1EdTech LTI Advantage implementation guide](https://standards.1edtech.org/lti/guides/implementation_guide/implementation-guide)
