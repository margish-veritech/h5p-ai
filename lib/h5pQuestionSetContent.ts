import { buildQuestionMediaField } from "./h5pImage";
import type { MultiChoiceAnswer, MultiChoiceQuestion, QuestionSetQuiz } from "./types";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const MULTI_CHOICE_UI = {
  showSolutionButton: "Show solution",
  tryAgainButton: "Try again",
  checkAnswerButton: "Check",
  tipsLabel: "Show tip",
  scoreBarLabel: "You got :num out of :total points",
  tipAvailable: "Tip available",
  feedbackAvailable: "Feedback available",
  readFeedback: "Read feedback",
  wrongAnswer: "Wrong answer",
  correctAnswer: "Correct answer",
  shouldCheck: "Should have been checked",
  shouldNotCheck: "Should not have been checked",
  noInput: "Please answer before viewing the solution",
  submitAnswerButton: "Submit",
  a11yCheck:
    "Check the answers. The responses will be marked as correct, incorrect, or unanswered.",
  a11yShowSolution:
    "Show the solution. The task will be marked with its correct solution.",
  a11yRetry: "Retry the task. Reset all responses and start the task over again."
};

const CONFIRM_CHECK = {
  header: "Finish ?",
  body: "Are you sure you wish to finish ?",
  cancelLabel: "Cancel",
  confirmLabel: "Finish"
};

const CONFIRM_RETRY = {
  header: "Retry ?",
  body: "Are you sure you wish to retry ?",
  cancelLabel: "Cancel",
  confirmLabel: "Confirm"
};

const MULTI_CHOICE_OVERALL_FEEDBACK = [
  { from: 0, to: 0, feedback: "Wrong!" },
  { from: 1, to: 99, feedback: "Almost!" },
  { from: 100, to: 100, feedback: "Correct!" }
];

const EMPTY_TIPS_AND_FEEDBACK = {
  tip: "",
  chosenFeedback: "",
  notChosenFeedback: ""
};

const createSubContentId = () => crypto.randomUUID();

const formatAnswerText = (answer: MultiChoiceAnswer) => {
  const parts: string[] = [];

  if (answer.image) {
    parts.push(
      `<img src="${answer.image.h5pPath}" alt="${escapeHtml(answer.image.alt)}" />`
    );
  }

  if (answer.text.trim()) {
    parts.push(escapeHtml(answer.text));
  }

  return `<div>${parts.join("<br/>")}</div>\n`;
};

const countCorrectAnswers = (question: MultiChoiceQuestion) =>
  question.answers.filter((answer) => answer.correct).length;

// Mirrors h5p-examples/question-set (MultiChoice items without media).
export const buildMultiChoiceParams = (question: MultiChoiceQuestion) => ({
  answers: question.answers.map((answer) => ({
    correct: answer.correct,
    text: formatAnswerText(answer),
    tipsAndFeedback: EMPTY_TIPS_AND_FEEDBACK
  })),
  UI: MULTI_CHOICE_UI,
  question: `<p>${escapeHtml(question.question)}</p>\n`,
  behaviour: {
    enableRetry: true,
    enableSolutionsButton: true,
    singlePoint: countCorrectAnswers(question) === 1,
    randomAnswers: true,
    showSolutionsRequiresInput: true,
    type: "auto",
    confirmCheckDialog: false,
    confirmRetryDialog: false,
    autoCheck: false,
    passPercentage: 100,
    showScorePoints: true,
    enableCheckButton: true
  },
  media: buildQuestionMediaField(question.questionImage, question.summary),
  confirmCheck: CONFIRM_CHECK,
  confirmRetry: CONFIRM_RETRY,
  overallFeedback: MULTI_CHOICE_OVERALL_FEEDBACK
});

const buildQuestionSetShell = () => ({
  progressType: "dots",
  passPercentage: 50,
  introPage: {
    showIntroPage: false,
    startButtonText: "Start Quiz",
    introduction: ""
  },
  texts: {
    prevButton: "Previous",
    nextButton: "Next",
    finishButton: "Finish",
    textualProgress: "Question: @current of @total questions",
    questionLabel: "Question",
    jumpToQuestion: "Jump to question %d",
    readSpeakerProgress: "Question @current of @total",
    unansweredText: "Unanswered",
    answeredText: "Answered",
    currentQuestionText: "Current question",
    submitButton: "Submit",
    navigationLabel: "Questions"
  },
  endGame: {
    showResultPage: true,
    solutionButtonText: "Show solution",
    finishButtonText: "Finish",
    showAnimations: false,
    skippable: false,
    skipButtonText: "Skip video",
    message: "Your result:",
    retryButtonText: "Retry",
    noResultMessage: "Finished",
    overallFeedback: [
      {
        from: 0,
        to: 100,
        feedback: "You got @score points of @total possible."
      }
    ],
    oldFeedback: {
      successGreeting: "Congratulations!",
      successComment: "You did very well!",
      failGreeting: "Oh, no!",
      failComment: "This didn't go so well."
    },
    showSolutionButton: true,
    showRetryButton: true,
    scoreBarLabel: "You got @finals out of @totals points",
    submitButtonText: "Submit"
  },
  override: {
    showSolutionButton: "off",
    retryButton: "off",
    checkButton: true
  },
  disableBackwardsNavigation: false,
  randomQuestions: false
});

export const buildQuestionSetContentJson = (quiz: QuestionSetQuiz) => ({
  ...buildQuestionSetShell(),
  questions: quiz.questions.map((question) => ({
    params: buildMultiChoiceParams(question),
    library: "H5P.MultiChoice 1.16",
    subContentId: createSubContentId(),
    metadata: {
      title: question.question,
      license: "U",
      contentType: "Multiple Choice"
    }
  }))
});

export const buildQuestionSetH5pJson = (quiz: QuestionSetQuiz) => ({
  title: quiz.title,
  language: "en",
  mainLibrary: "H5P.QuestionSet",
  embedTypes: ["iframe"],
  license: "U",
  preloadedDependencies: [
    { machineName: "H5P.QuestionSet", majorVersion: "1", minorVersion: "20" }
  ]
});

export const safeQuestionSetFilename = (value: string) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return normalized || "question-set-quiz";
};
