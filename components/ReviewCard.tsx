"use client";

import { generateAndDownloadH5P } from "@/lib/generateH5P";
import type { TrueFalseQuestion } from "@/lib/types";

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
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-ink">Question {index + 1}</h2>
        <button
          type="button"
          className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
          onClick={() => generateAndDownloadH5P(question)}
        >
          Download .h5p
        </button>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="space-y-2">
          <label
            htmlFor={`question-${index}`}
            className="block text-sm font-medium text-slate-800"
          >
            Question text
          </label>
          <textarea
            id={`question-${index}`}
            value={question.question}
            rows={4}
            className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-base leading-6 text-slate-900 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
            onChange={(event) => update("question", event.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label
              htmlFor={`correct-${index}`}
              className="block text-sm font-medium text-slate-800"
            >
              Correct answer
            </label>
            <select
              id={`correct-${index}`}
              value={question.correct ? "true" : "false"}
              className="h-11 w-full cursor-pointer rounded-md border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
              onChange={(event) => update("correct", event.target.value === "true")}
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label
              htmlFor={`feedback-correct-${index}`}
              className="block text-sm font-medium text-slate-800"
            >
              Feedback for correct answer
            </label>
            <input
              id={`feedback-correct-${index}`}
              value={question.feedbackCorrect}
              type="text"
              className="h-11 w-full rounded-md border border-slate-300 px-3 text-base text-slate-900 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
              onChange={(event) => update("feedbackCorrect", event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor={`feedback-wrong-${index}`}
            className="block text-sm font-medium text-slate-800"
          >
            Feedback for wrong answer
          </label>
          <input
            id={`feedback-wrong-${index}`}
            value={question.feedbackWrong}
            type="text"
            className="h-11 w-full rounded-md border border-slate-300 px-3 text-base text-slate-900 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
            onChange={(event) => update("feedbackWrong", event.target.value)}
          />
        </div>
      </div>
    </article>
  );
}
