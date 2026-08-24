import { describe, expect, it } from "vitest";
import {
  filterSearchableQuestions,
  multiChoiceQuestionMatchesSearch,
  trueFalseQuestionMatchesSearch
} from "@/lib/generatedQuestionSearch";
import type { MultiChoiceQuestion, TrueFalseQuestion } from "@/lib/types";

const trueFalseQuestion = (
  overrides: Partial<TrueFalseQuestion> = {}
): TrueFalseQuestion => ({
  title: "Question 1: Photosynthesis",
  summary: "Plant energy",
  question: "Photosynthesis converts light energy into chemical energy.",
  correct: true,
  feedbackOnCorrect: "Light drives the process in chloroplasts.",
  feedbackOnWrong: "Plants do use light energy for this process.",
  library: "H5P.TrueFalse",
  ...overrides
});

const multiChoiceQuestion = (
  overrides: Partial<MultiChoiceQuestion> = {}
): MultiChoiceQuestion => ({
  title: "Question 1: Water Cycle",
  summary: "Water vapor",
  question: "Which process changes liquid water into vapor?",
  answers: [
    { text: "Evaporation", correct: true },
    { text: "Condensation", correct: false },
    { text: "Precipitation", correct: false }
  ],
  ...overrides
});

describe("generated question search", () => {
  it("matches true-false questions by case-insensitive word or sentence", () => {
    expect(trueFalseQuestionMatchesSearch(trueFalseQuestion(), "plant")).toBe(true);
    expect(
      trueFalseQuestionMatchesSearch(
        trueFalseQuestion(),
        "LIGHT energy into chemical"
      )
    ).toBe(true);
    expect(trueFalseQuestionMatchesSearch(trueFalseQuestion(), "tectonic")).toBe(false);
  });

  it("matches multiple-choice questions by question text or answer text", () => {
    expect(multiChoiceQuestionMatchesSearch(multiChoiceQuestion(), "liquid water")).toBe(
      true
    );
    expect(multiChoiceQuestionMatchesSearch(multiChoiceQuestion(), "condensation")).toBe(
      true
    );
    expect(multiChoiceQuestionMatchesSearch(multiChoiceQuestion(), "photosynthesis")).toBe(
      false
    );
  });

  it("preserves original indexes when filtering generated questions", () => {
    const questions = [
      trueFalseQuestion({ question: "The Earth orbits the Sun." }),
      trueFalseQuestion({ question: "The Moon is made of cheese." }),
      trueFalseQuestion({ question: "Mars is called the red planet." })
    ];

    expect(
      filterSearchableQuestions(
        questions,
        "moon",
        trueFalseQuestionMatchesSearch
      )
    ).toEqual([{ index: 1, question: questions[1] }]);
  });

  it("returns every generated question for blank search queries", () => {
    const questions = [trueFalseQuestion(), trueFalseQuestion()];

    expect(
      filterSearchableQuestions(questions, "   ", trueFalseQuestionMatchesSearch)
    ).toEqual([
      { index: 0, question: questions[0] },
      { index: 1, question: questions[1] }
    ]);
  });
});
