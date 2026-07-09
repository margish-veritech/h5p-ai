"use client";

import { applyMultiChoiceSummaryUpdate } from "@/lib/mapGeneratedQuestionSet";
import type { MultiChoiceQuestion, QuestionSetQuiz } from "@/lib/types";

type MultiChoiceReviewCardProps = {
  index: number;
  question: MultiChoiceQuestion;
  onQuizChange: (quiz: QuestionSetQuiz) => void;
  quiz: QuestionSetQuiz;
};

export function MultiChoiceReviewCard({
  index,
  question,
  onQuizChange,
  quiz
}: MultiChoiceReviewCardProps) {
  const updateQuestion = (updatedQuestion: MultiChoiceQuestion) => {
    onQuizChange({
      ...quiz,
      questions: quiz.questions.map((item, itemIndex) =>
        itemIndex === index ? updatedQuestion : item
      )
    });
  };

  const updateAnswer = (
    answerIndex: number,
    field: "text" | "correct",
    value: string | boolean
  ) => {
    updateQuestion({
      ...question,
      answers: question.answers.map((answer, itemIndex) =>
        itemIndex === answerIndex ? { ...answer, [field]: value } : answer
      )
    });
  };

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-ink">{question.title}</h2>

      <div className="mt-5 grid gap-4">
        <div className="space-y-2">
          <label
            htmlFor={`mc-summary-${index}`}
            className="block text-sm font-medium text-slate-800"
          >
            Topic summary
          </label>
          <input
            id={`mc-summary-${index}`}
            value={question.summary}
            type="text"
            className="h-11 w-full rounded-md border border-slate-300 px-3 text-base text-slate-900 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
            onChange={(event) =>
              onQuizChange(applyMultiChoiceSummaryUpdate(quiz, index, event.target.value))
            }
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor={`mc-question-${index}`}
            className="block text-sm font-medium text-slate-800"
          >
            Question text
          </label>
          <textarea
            id={`mc-question-${index}`}
            value={question.question}
            rows={3}
            className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-base leading-6 text-slate-900 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
            onChange={(event) => updateQuestion({ ...question, question: event.target.value })}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-800">Answer options</p>
          {question.answers.map((answer, answerIndex) => (
            <div
              key={answerIndex}
              className="grid gap-3 rounded-md border border-slate-200 p-3 sm:grid-cols-[1fr_140px]"
            >
              <input
                value={answer.text}
                type="text"
                className="h-11 w-full rounded-md border border-slate-300 px-3 text-base text-slate-900 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
                onChange={(event) => updateAnswer(answerIndex, "text", event.target.value)}
              />
              <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={answer.correct}
                  onChange={(event) =>
                    updateAnswer(answerIndex, "correct", event.target.checked)
                  }
                />
                Correct answer
              </label>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
