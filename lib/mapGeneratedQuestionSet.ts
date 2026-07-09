import { formatQuestionTitle, normalizeSummary } from "./questionTitle";
import type {
  GeneratedMultiChoiceDraft,
  GeneratedQuestionSetDraft,
  MultiChoiceAnswer,
  MultiChoiceQuestion,
  QuestionSetQuiz
} from "./types";

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

export const formatQuizTitle = (summary: string) => {
  const topic = summary.trim();

  return topic ? `Quiz | ${topic}` : "Quiz (Question Set)";
};

const coerceAnswer = (value: unknown): MultiChoiceAnswer | null => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const correct = parseBoolean(raw.correct);
  const text = trim(raw.text);

  if (correct === null || !text) {
    return null;
  }

  return { text, correct };
};

const coerceMultiChoiceDraft = (
  value: unknown,
  index: number
): GeneratedMultiChoiceDraft | null => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const question = trim(raw.question);
  const answers = Array.isArray(raw.answers)
    ? raw.answers
        .map(coerceAnswer)
        .filter((answer): answer is MultiChoiceAnswer => answer !== null)
    : [];

  if (!question || answers.length < 2) {
    return null;
  }

  const correctCount = answers.filter((answer) => answer.correct).length;

  if (correctCount < 1) {
    return null;
  }

  return {
    summary: trim(raw.summary) || `Question ${index + 1}`,
    question,
    answers
  };
};

export const toMultiChoiceQuestion = (
  draft: GeneratedMultiChoiceDraft,
  index: number
): MultiChoiceQuestion => {
  const summary = normalizeSummary(draft.summary, draft.question, index);

  return {
    summary,
    title: formatQuestionTitle(index, summary),
    question: draft.question,
    answers: draft.answers
  };
};

export const toQuestionSetQuiz = (
  draft: GeneratedQuestionSetDraft,
  expectedCount: number
): QuestionSetQuiz => {
  const summary = trim(draft.quizSummary) || "Generated Quiz";
  const questions = draft.questions
    .slice(0, expectedCount)
    .map((question, index) => {
      const coerced = coerceMultiChoiceDraft(question, index);
      return coerced ? toMultiChoiceQuestion(coerced, index) : null;
    })
    .filter((question): question is MultiChoiceQuestion => question !== null);

  return {
    summary,
    title: formatQuizTitle(summary),
    questions
  };
};

export const mapGeneratedQuestionSet = (
  raw: unknown,
  expectedCount: number
): QuestionSetQuiz | null => {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const payload = raw as Record<string, unknown>;
  const rawQuestions = payload.questions;

  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return null;
  }

  const draft: GeneratedQuestionSetDraft = {
    quizSummary: trim(payload.quizSummary),
    questions: rawQuestions
      .map((question, index) => coerceMultiChoiceDraft(question, index))
      .filter((question): question is GeneratedMultiChoiceDraft => question !== null)
  };

  const quiz = toQuestionSetQuiz(draft, expectedCount);

  return quiz.questions.length > 0 ? quiz : null;
};

export const buildQuestionSetPrompt = (
  content: string,
  questionCount: number,
  difficulty: string
) => `Generate a multiple-choice quiz with ${questionCount} questions from the learning content below.

Difficulty: ${difficulty}

Content:
${content}

Return only quiz content. Do not include H5P fields, library names, HTML, or markdown.

Return this JSON shape:
{
  "quizSummary": "short quiz topic (3-8 words)",
  "questions": [
    {
      "summary": "short topic for this question",
      "question": "the multiple-choice question text",
      "answers": [
        { "text": "answer option", "correct": true },
        { "text": "answer option", "correct": false }
      ]
    }
  ]
}

Rules:
1. Generate exactly ${questionCount} multiple-choice questions.
2. Use only facts from the provided content.
3. Do not invent information.
4. Each question must have 3 or 4 answer options.
5. Each question must have at least one correct answer.
6. Prefer one correct answer per question unless the content clearly supports multiple correct answers.
7. Make distractors plausible but clearly wrong.
8. Test different concepts where possible.
9. Never use generic summaries like "Question 1" or "Quiz 1".`;

export const applyQuizSummaryUpdate = (
  quiz: QuestionSetQuiz,
  summary: string
): QuestionSetQuiz => {
  const normalized = summary.trim() || "Generated Quiz";

  return {
    ...quiz,
    summary: normalized,
    title: formatQuizTitle(normalized)
  };
};

export const applyMultiChoiceSummaryUpdate = (
  quiz: QuestionSetQuiz,
  index: number,
  summary: string
): QuestionSetQuiz => ({
  ...quiz,
  questions: quiz.questions.map((question, questionIndex) => {
    if (questionIndex !== index) {
      return question;
    }

    const normalized = normalizeSummary(summary, question.question, index);

    return {
      ...question,
      summary: normalized,
      title: formatQuestionTitle(index, normalized)
    };
  })
});
