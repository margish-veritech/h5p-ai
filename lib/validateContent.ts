import type { MultiChoiceQuestion, QuestionSetQuiz, TrueFalseQuestion } from "./types";

const normalizeOption = (value: string) => value.trim().toLowerCase();

export const validateTrueFalseQuestion = (question: TrueFalseQuestion): string | null => {
  if (!question.question.trim()) {
    return "Question text cannot be empty.";
  }

  if (!question.feedbackOnCorrect.trim() || !question.feedbackOnWrong.trim()) {
    return "Feedback fields cannot be empty.";
  }

  return null;
};

export const validateMultiChoiceQuestion = (question: MultiChoiceQuestion): string | null => {
  if (!question.question.trim()) {
    return "Question text cannot be empty.";
  }

  const filledAnswers = question.answers.filter((answer) => answer.text.trim());

  if (filledAnswers.length < 2) {
    return "Each question needs at least two answer options.";
  }

  const hasCorrect = filledAnswers.some((answer) => answer.correct);

  if (!hasCorrect) {
    return "Each question needs at least one correct answer.";
  }

  const seen = new Set<string>();

  for (const answer of filledAnswers) {
    const key = normalizeOption(answer.text);

    if (seen.has(key)) {
      return "Duplicate answer options are not allowed.";
    }

    seen.add(key);
  }

  return null;
};

export const validateQuestionSetQuiz = (quiz: QuestionSetQuiz): string | null => {
  if (!quiz.summary.trim()) {
    return "Quiz topic cannot be empty.";
  }

  if (quiz.questions.length === 0) {
    return "Add at least one question before exporting.";
  }

  for (let index = 0; index < quiz.questions.length; index += 1) {
    const error = validateMultiChoiceQuestion(quiz.questions[index]);

    if (error) {
      return `Question ${index + 1}: ${error}`;
    }
  }

  return null;
};
