import { describe, expect, it } from "vitest";
import {
  buildTrueFalseContentJson,
  buildTrueFalseH5pJson
} from "@/lib/h5pContent";
import {
  buildQuestionSetContentJson,
  buildQuestionSetH5pJson
} from "@/lib/h5pQuestionSetContent";

describe("H5P export regressions", () => {
  it("preserves True/False and Question Set library shapes", () => {
    const trueFalse = {
      summary: "Plants",
      title: "Question 1 | Plants",
      library: "H5P.TrueFalse" as const,
      question: "Plants use light energy.",
      correct: true,
      feedbackOnCorrect: "Correct.",
      feedbackOnWrong: "Plants use light energy."
    };
    expect(buildTrueFalseH5pJson(trueFalse).mainLibrary).toBe("H5P.TrueFalse");
    expect(buildTrueFalseContentJson(trueFalse).question).toBe(
      "<p>Plants use light energy.</p>"
    );

    const quiz = {
      summary: "Plants",
      title: "Quiz | Plants",
      questions: [
        {
          summary: "Energy",
          title: "Question 1 | Energy",
          question: "What provides energy for photosynthesis?",
          answers: [
            { text: "Sunlight", correct: true },
            { text: "Moonlight", correct: false }
          ]
        }
      ]
    };
    expect(buildQuestionSetH5pJson(quiz).mainLibrary).toBe("H5P.QuestionSet");
    expect(buildQuestionSetContentJson(quiz).questions[0].library).toBe(
      "H5P.MultiChoice 1.16"
    );
  });
});

