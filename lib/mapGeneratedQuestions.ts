import { formatQuestionTitle, normalizeSummary } from "./questionTitle";
import type { GeneratedQuestionDraft, TrueFalseQuestion } from "./types";

const trim = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const parseBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return null;
};

const readField = (value: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    if (key in value) {
      return value[key];
    }
  }

  return undefined;
};

export const toTrueFalseQuestion = (
  draft: GeneratedQuestionDraft,
  index: number
): TrueFalseQuestion => {
  const summary = normalizeSummary(draft.summary, draft.question, index);

  return {
    summary,
    title: formatQuestionTitle(index, summary),
    library: "H5P.TrueFalse",
    question: draft.question,
    correct: draft.correct,
    feedbackOnCorrect: draft.feedbackOnCorrect,
    feedbackOnWrong: draft.feedbackOnWrong
  };
};

const coerceDraft = (value: unknown, index: number): GeneratedQuestionDraft | null => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const correct = parseBoolean(raw.correct);
  const question = trim(raw.question);

  if (correct === null || !question) {
    return null;
  }

  const feedbackOnCorrect = trim(
    readField(raw, ["feedbackOnCorrect", "feedbackCorrect"])
  );
  const feedbackOnWrong = trim(readField(raw, ["feedbackOnWrong", "feedbackWrong"]));

  if (!feedbackOnCorrect || !feedbackOnWrong) {
    return null;
  }

  return {
    summary: trim(readField(raw, ["summary", "title"])),
    question,
    correct,
    feedbackOnCorrect,
    feedbackOnWrong
  };
};

export const mapGeneratedQuestions = (
  rawQuestions: unknown[],
  expectedCount: number
): TrueFalseQuestion[] =>
  rawQuestions
    .slice(0, expectedCount)
    .map((question, index) => {
      const draft = coerceDraft(question, index);
      return draft ? toTrueFalseQuestion(draft, index) : null;
    })
    .filter((question): question is TrueFalseQuestion => question !== null);

export const buildGenerationPrompt = (
  content: string,
  questionCount: number,
  difficulty: string
) => `Generate ${questionCount} true-false questions from the learning content below.

Difficulty: ${difficulty}

Content:
${content}

Return only question content. Do not include H5P fields, library names, HTML, or markdown.

Each question must include exactly these fields:
- summary: a short topic label for what the question is about (3-8 words, e.g. "What is Psychology", "Photosynthesis in leaves")
- question: one clear true/false statement
- correct: boolean true or false
- feedbackOnCorrect: short feedback when the learner is correct
- feedbackOnWrong: short feedback when the learner is wrong

Rules:
1. Generate exactly ${questionCount} questions.
2. Use only facts from the provided content.
3. Do not invent information.
4. Make each statement unambiguous.
5. Test different concepts where possible.
6. Balance true and false answers when possible.
7. Avoid trick questions unless difficulty is advanced.
8. Never use generic summaries like "Question 1" or "Topic 1".

Example:
{
  "questions": [
    {
      "summary": "Photosynthesis location",
      "question": "Photosynthesis happens in the chloroplasts of plant cells.",
      "correct": true,
      "feedbackOnCorrect": "Correct. Chloroplasts are the main site of photosynthesis.",
      "feedbackOnWrong": "Not correct. Photosynthesis mainly happens in chloroplasts."
    }
  ]
}`;

export const applySummaryUpdate = (
  question: TrueFalseQuestion,
  index: number,
  summary: string
): TrueFalseQuestion => {
  const normalized = normalizeSummary(summary, question.question, index);

  return {
    ...question,
    summary: normalized,
    title: formatQuestionTitle(index, normalized)
  };
};
