"use client";

import { generateAndDownloadH5P } from "@/lib/generateH5P";
import { applySummaryUpdate } from "@/lib/mapGeneratedQuestions";
import type { TrueFalseQuestion } from "@/lib/types";
import { ImageUploadField } from "./ImageUploadField";

type ReviewCardProps = {
  index: number;
  question: TrueFalseQuestion;
  onChange: (question: TrueFalseQuestion) => void;
};

export function ReviewCard({ index, question, onChange }: ReviewCardProps) {
  const update = <Key extends keyof TrueFalseQuestion>(
    key: Key,
    value: TrueFalseQuestion[Key]
  ) => {
    onChange({ ...question, [key]: value });
  };

  return (
    <article className="panel overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <span className="badge-ocean">True / False</span>
          <h2 className="mt-3 truncate font-display text-xl font-semibold text-ink">
            {question.title}
          </h2>
        </div>
        <button
          type="button"
          className="btn-download shrink-0"
          onClick={() => generateAndDownloadH5P(question)}
        >
          Download .h5p
        </button>
      </div>

      <div className="mt-5 grid gap-5">
        <div>
          <label htmlFor={`summary-${index}`} className="field-label">
            Topic summary
          </label>
          <input
            id={`summary-${index}`}
            value={question.summary}
            type="text"
            placeholder="e.g. What is Psychology"
            className="field-input h-11"
            onChange={(event) =>
              onChange(applySummaryUpdate(question, index, event.target.value))
            }
          />
          <p className="mt-2 text-sm text-muted">Package title: {question.title}</p>
        </div>

        <div>
          <label htmlFor={`question-${index}`} className="field-label">
            Question statement
          </label>
          <textarea
            id={`question-${index}`}
            value={question.question}
            rows={4}
            className="field-textarea min-h-24"
            onChange={(event) => update("question", event.target.value)}
          />
        </div>

        <ImageUploadField
          label="Question image"
          image={question.questionImage}
          defaultAlt={question.summary}
          onChange={(questionImage) => update("questionImage", questionImage)}
        />

        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div>
            <label htmlFor={`correct-${index}`} className="field-label">
              Correct answer
            </label>
            <select
              id={`correct-${index}`}
              value={question.correct ? "true" : "false"}
              className="field-input h-11 cursor-pointer"
              onChange={(event) => update("correct", event.target.value === "true")}
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>

          <div>
            <label htmlFor={`feedback-correct-${index}`} className="field-label">
              Feedback when correct
            </label>
            <input
              id={`feedback-correct-${index}`}
              value={question.feedbackOnCorrect}
              type="text"
              className="field-input h-11"
              onChange={(event) => update("feedbackOnCorrect", event.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor={`feedback-wrong-${index}`} className="field-label">
            Feedback when wrong
          </label>
          <input
            id={`feedback-wrong-${index}`}
            value={question.feedbackOnWrong}
            type="text"
            className="field-input h-11"
            onChange={(event) => update("feedbackOnWrong", event.target.value)}
          />
        </div>
      </div>
    </article>
  );
}
