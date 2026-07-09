"use client";

import { useState } from "react";
import { generateAndDownloadQuestionSetH5P } from "@/lib/generateQuestionSetH5P";
import { applyQuizSummaryUpdate } from "@/lib/mapGeneratedQuestionSet";
import type { QuestionSetQuiz } from "@/lib/types";
import { MultiChoiceReviewCard } from "./MultiChoiceReviewCard";
import { PageHeader } from "./PageHeader";

type QuestionSetReviewProps = {
  quiz: QuestionSetQuiz;
  onChange: (quiz: QuestionSetQuiz) => void;
  onBack: () => void;
  onRegenerate: () => void;
  isLoading?: boolean;
  error?: string | null;
};

export function QuestionSetReview({
  quiz,
  onChange,
  onBack,
  onRegenerate,
  isLoading = false,
  error = null
}: QuestionSetReviewProps) {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  return (
    <section>
      <PageHeader
        title="Review quiz"
        description="Fine-tune the quiz topic and each multiple-choice question, then export one Question Set package."
        actions={
          <>
            <button type="button" className="btn-secondary" disabled={isLoading} onClick={onBack}>
              Back
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={isLoading}
              onClick={onRegenerate}
            >
              {isLoading ? "Regenerating..." : "Regenerate"}
            </button>
            <button
              type="button"
              className="btn-download"
              onClick={() => {
                setDownloadError(null);
                const error = generateAndDownloadQuestionSetH5P(quiz);

                if (error) {
                  setDownloadError(error);
                }
              }}
            >
              Download .h5p
            </button>
          </>
        }
      />

      {error ? (
        <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {downloadError ? (
        <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {downloadError}
        </p>
      ) : null}

      <div className="panel mb-5">
        <span className="badge-brand">Quiz set</span>
        <div className="mt-4">
          <label htmlFor="quiz-summary" className="field-label">
            Quiz topic
          </label>
          <input
            id="quiz-summary"
            value={quiz.summary}
            type="text"
            className="field-input h-11"
            onChange={(event) => onChange(applyQuizSummaryUpdate(quiz, event.target.value))}
          />
          <p className="mt-2 text-sm text-muted">Package title: {quiz.title}</p>
        </div>
      </div>

      <div className="grid gap-5">
        {quiz.questions.map((question, index) => (
          <MultiChoiceReviewCard
            key={index}
            index={index}
            question={question}
            quiz={quiz}
            onQuizChange={onChange}
          />
        ))}
      </div>
    </section>
  );
}
