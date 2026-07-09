"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { InputForm } from "@/components/InputForm";
import { PageHeader } from "@/components/PageHeader";
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
    <AppShell step={screen === "input" ? "create" : "review"}>
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
        <section>
          <PageHeader
            title="Review questions"
            description="Edit each True/False item, then download its own H5P package."
            actions={
              <button type="button" className="btn-secondary" onClick={() => setScreen("input")}>
                Back
              </button>
            }
          />

          <div className="grid gap-5">
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
    </AppShell>
  );
}
