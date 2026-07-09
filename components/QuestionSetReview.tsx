"use client";

import { generateAndDownloadQuestionSetH5P } from "@/lib/generateQuestionSetH5P";
import { applyQuizSummaryUpdate } from "@/lib/mapGeneratedQuestionSet";
import type { QuestionSetQuiz } from "@/lib/types";
import { MultiChoiceReviewCard } from "./MultiChoiceReviewCard";

type QuestionSetReviewProps = {
  quiz: QuestionSetQuiz;
  onChange: (quiz: QuestionSetQuiz) => void;
  onBack: () => void;
};

export function QuestionSetReview({ quiz, onChange, onBack }: QuestionSetReviewProps) {
  return (
    <section className="mx-auto w-full max-w-4xl">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-ink">Review Quiz</h1>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Edit the quiz and its multiple-choice questions, then download one Question Set
            H5P file.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:ring-offset-2"
            onClick={onBack}
          >
            Back
          </button>
          <button
            type="button"
            disabled={quiz.questions.length === 0}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
            onClick={() => generateAndDownloadQuestionSetH5P(quiz)}
          >
            Download .h5p
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-2">
          <label htmlFor="quiz-summary" className="block text-sm font-medium text-slate-800">
            Quiz topic
          </label>
          <input
            id="quiz-summary"
            value={quiz.summary}
            type="text"
            className="h-11 w-full rounded-md border border-slate-300 px-3 text-base text-slate-900 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
            onChange={(event) => onChange(applyQuizSummaryUpdate(quiz, event.target.value))}
          />
          <p className="text-sm text-slate-500">Title: {quiz.title}</p>
        </div>
      </div>

      <div className="grid gap-4">
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
