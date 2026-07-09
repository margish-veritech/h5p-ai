export type Difficulty = "beginner" | "intermediate" | "advanced";

export type H5PContentType = "true-false" | "question-set";

/** Content-only shape returned by the AI. */
export type GeneratedQuestionDraft = {
  summary: string;
  question: string;
  correct: boolean;
  feedbackOnCorrect: string;
  feedbackOnWrong: string;
};

export type TrueFalseQuestion = GeneratedQuestionDraft & {
  title: string;
  library: "H5P.TrueFalse";
};

export type MultiChoiceAnswer = {
  text: string;
  correct: boolean;
};

/** Content-only shape returned by the AI for one multiple-choice question. */
export type GeneratedMultiChoiceDraft = {
  summary: string;
  question: string;
  answers: MultiChoiceAnswer[];
};

export type MultiChoiceQuestion = GeneratedMultiChoiceDraft & {
  title: string;
};

/** Content-only quiz summary from the AI. */
export type GeneratedQuestionSetDraft = {
  quizSummary: string;
  questions: GeneratedMultiChoiceDraft[];
};

export type QuestionSetQuiz = {
  title: string;
  summary: string;
  questions: MultiChoiceQuestion[];
};
