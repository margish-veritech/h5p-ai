import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_SOURCE_CHARACTERS } from "@/lib/sourceLimits";

const { createCompletion } = vi.hoisted(() => ({
  createCompletion: vi.fn()
}));

vi.mock("@/lib/openai", () => ({
  openai: {
    chat: {
      completions: {
        create: createCompletion
      }
    }
  }
}));

import { POST as postQuestionSet } from "@/app/api/generate/question-set/route";
import { POST as postTrueFalse } from "@/app/api/generate/true-false/route";

const generationRequest = (body: unknown) =>
  new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

describe("generation route regressions", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key";
    createCompletion.mockReset();
  });

  it("keeps the True/False success shape", async () => {
    createCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              questions: [
                {
                  summary: "Water cycle",
                  question: "Evaporation changes liquid water into water vapor.",
                  correct: true,
                  feedbackOnCorrect: "Correct.",
                  feedbackOnWrong: "Evaporation produces water vapor."
                }
              ]
            })
          }
        }
      ]
    });

    const response = await postTrueFalse(
      generationRequest({ text: "Evaporation changes water into vapor.", count: 1 })
    );
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({ library: "H5P.TrueFalse", correct: true });
  });

  it("keeps the Quiz Set success shape", async () => {
    createCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              quizSummary: "Water cycle",
              questions: [
                {
                  summary: "Evaporation",
                  question: "Which process creates water vapor?",
                  answers: [
                    { text: "Evaporation", correct: true },
                    { text: "Freezing", correct: false },
                    { text: "Condensation", correct: false }
                  ]
                }
              ]
            })
          }
        }
      ]
    });

    const response = await postQuestionSet(
      generationRequest({ text: "Evaporation changes water into vapor.", count: 1 })
    );
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ summary: "Water cycle" });
    expect(payload.questions).toHaveLength(1);
  });

  it("rejects over-limit source before calling OpenAI", async () => {
    const response = await postTrueFalse(
      generationRequest({ text: "x".repeat(MAX_SOURCE_CHARACTERS + 1), count: 1 })
    );
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ code: "SOURCE_TOO_LONG" });
    expect(createCompletion).not.toHaveBeenCalled();
  });
});
