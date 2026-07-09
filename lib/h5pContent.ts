import type { TrueFalseQuestion } from "./types";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

// Mirrors h5p-examples/true-false-question.h5p (official H5P export shape).
export const buildTrueFalseContentJson = (question: TrueFalseQuestion) => ({
  correct: question.correct ? "true" : "false",
  l10n: {
    trueText: "True",
    falseText: "False",
    score: "You got @score of @total points",
    checkAnswer: "Check",
    showSolutionButton: "Show solution",
    tryAgain: "Retry",
    wrongAnswerMessage: "Wrong answer",
    correctAnswerMessage: "Correct answer",
    scoreBarLabel: "You got :num out of :total points"
  },
  behaviour: {
    enableRetry: true,
    enableSolutionsButton: true,
    confirmCheckDialog: false,
    confirmRetryDialog: false,
    autoCheck: false,
    feedbackOnWrong: question.feedbackOnWrong,
    feedbackOnCorrect: question.feedbackOnCorrect,
    enableCheckButton: true
  },
  confirmCheck: {
    header: "Finish ?",
    body: "Are you sure you wish to finish ?",
    cancelLabel: "Cancel",
    confirmLabel: "Finish"
  },
  confirmRetry: {
    header: "Retry ?",
    body: "Are you sure you wish to retry ?",
    cancelLabel: "Cancel",
    confirmLabel: "Confirm"
  },
  question: `<p>${escapeHtml(question.question)}</p>`,
  media: { disableImageZooming: false }
});

export const buildTrueFalseH5pJson = (question: TrueFalseQuestion) => ({
  title: question.title,
  language: "en",
  mainLibrary: "H5P.TrueFalse",
  embedTypes: ["iframe"],
  license: "U",
  preloadedDependencies: [
    { machineName: "H5P.TrueFalse", majorVersion: "1", minorVersion: "8" }
  ]
});

export const safeH5PFilename = (value: string) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return normalized || "true-false-question";
};
