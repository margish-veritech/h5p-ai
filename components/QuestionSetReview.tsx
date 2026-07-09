"use client";

import { generateAndDownloadQuestionSetH5P } from "@/lib/generateQuestionSetH5P";
import { applyQuizSummaryUpdate } from "@/lib/mapGeneratedQuestionSet";
import type { QuestionSetQuiz } from "@/lib/types";
import { MultiChoiceReviewCard } from "./MultiChoiceReviewCard";
import { PageHeader } from "./PageHeader";

type QuestionSetReviewProps = {
  quiz: QuestionSetQuiz;
  onChange: (quiz: QuestionSetQuiz) => void;
  onBack: () => void;
};

export function QuestionSetReview({ quiz, onChange, onBack }: QuestionSetReviewProps) {
  return (
    <section>
      <PageHeader
        title="Review quiz"
        description="Fine-tune the quiz topic and each multiple-choice question, then export one Question Set package."
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={onBack}>
              Back
            </button>
            <button
              type="button"
              disabled={quiz.questions.length === 0}
              className="btn-download"
              onClick={() => generateAndDownloadQuestionSetH5P(quiz)}
            >
              Download .h5p
            </button>
          </>
        }
      />

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
