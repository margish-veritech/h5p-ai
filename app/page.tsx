"use client";

import { useState } from "react";
import { InputForm } from "@/components/InputForm";
import { QuestionSetReview } from "@/components/QuestionSetReview";
import { ReviewCard } from "@/components/ReviewCard";
import type {
  Difficulty,
  H5PContentType,
  QuestionSetQuiz,
  TrueFalseQuestion
} from "@/lib/types";

type Screen = "input" | "review";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("input");
  const [contentType, setContentType] = useState<H5PContentType>("true-false");
  const [text, setText] = useState("");
  const [count, setCount] = useState(3);
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [trueFalseQuestions, setTrueFalseQuestions] = useState<TrueFalseQuestion[]>([]);
  const [questionSetQuiz, setQuestionSetQuiz] = useState<QuestionSetQuiz | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQuestions = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const endpoint =
        contentType === "true-false"
          ? "/api/generate"
          : "/api/generate/question-set";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text, count, difficulty })
      });

      const payload = (await response.json()) as
        | TrueFalseQuestion[]
        | QuestionSetQuiz
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          !Array.isArray(payload) &&
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            payload.error
            ? payload.error
            : "Failed to generate questions."
        );
      }

      if (contentType === "true-false") {
        if (!Array.isArray(payload)) {
          throw new Error("Unexpected response from the generator.");
        }

        setTrueFalseQuestions(payload);
      } else {
        if (Array.isArray(payload) || !payload || typeof payload !== "object") {
          throw new Error("Unexpected response from the generator.");
        }

        setQuestionSetQuiz(payload as QuestionSetQuiz);
      }

      setScreen("review");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to generate questions."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateTrueFalseQuestion = (
    index: number,
    updatedQuestion: TrueFalseQuestion
  ) => {
    setTrueFalseQuestions((currentQuestions) =>
      currentQuestions.map((question, questionIndex) =>
        questionIndex === index ? updatedQuestion : question
      )
    );
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      {screen === "input" ? (
        <InputForm
          text={text}
          count={count}
          difficulty={difficulty}
          contentType={contentType}
          isLoading={isLoading}
          error={error}
          onTextChange={setText}
          onCountChange={(value) => setCount(Number.isNaN(value) ? 1 : value)}
          onDifficultyChange={setDifficulty}
          onContentTypeChange={setContentType}
          onSubmit={generateQuestions}
        />
      ) : contentType === "true-false" ? (
        <section className="mx-auto w-full max-w-4xl">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal text-ink">
                Review Questions
              </h1>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Edit each question, then download its H5P file.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:ring-offset-2"
              onClick={() => setScreen("input")}
            >
              Back
            </button>
          </div>

          <div className="grid gap-4">
            {trueFalseQuestions.map((question, index) => (
              <ReviewCard
                key={index}
                index={index}
                question={question}
                onChange={(updatedQuestion) =>
                  updateTrueFalseQuestion(index, updatedQuestion)
                }
              />
            ))}
          </div>
        </section>
      ) : questionSetQuiz ? (
        <QuestionSetReview
          quiz={questionSetQuiz}
          onChange={setQuestionSetQuiz}
          onBack={() => setScreen("input")}
        />
      ) : null}
    </main>
  );
}
