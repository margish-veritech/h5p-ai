export type Difficulty = "beginner" | "intermediate" | "advanced";

export type TrueFalseQuestion = {
  title: string;
  library: "H5P.TrueFalse";
  question: string;
  correct: boolean;
  feedbackOnCorrect: string;
  feedbackOnWrong: string;
};
