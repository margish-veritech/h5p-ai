export type Difficulty = "beginner" | "intermediate" | "advanced";

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
