"use client";

import { applyMultiChoiceSummaryUpdate } from "@/lib/mapGeneratedQuestionSet";
import type { MultiChoiceQuestion, QuestionSetQuiz } from "@/lib/types";
import { ImageUploadField } from "./ImageUploadField";

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
    <article className="panel">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="badge-ocean">Multiple choice</span>
          <h2 className="mt-3 font-display text-xl font-semibold text-ink">
            {question.title}
          </h2>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-muted">
          {index + 1} / {quiz.questions.length}
        </span>
      </div>

      <div className="grid gap-5">
        <div>
          <label htmlFor={`mc-summary-${index}`} className="field-label">
            Topic summary
          </label>
          <input
            id={`mc-summary-${index}`}
            value={question.summary}
            type="text"
            className="field-input h-11"
            onChange={(event) =>
              onQuizChange(applyMultiChoiceSummaryUpdate(quiz, index, event.target.value))
            }
          />
        </div>

        <div>
          <label htmlFor={`mc-question-${index}`} className="field-label">
            Question text
          </label>
          <textarea
            id={`mc-question-${index}`}
            value={question.question}
            rows={3}
            className="field-textarea min-h-20"
            onChange={(event) => updateQuestion({ ...question, question: event.target.value })}
          />
        </div>

        <ImageUploadField
          label="Question image"
          image={question.questionImage}
          defaultAlt={question.summary}
          onChange={(questionImage) => updateQuestion({ ...question, questionImage })}
        />

        <div className="space-y-3">
          <p className="field-label mb-0">Answer options</p>
          {question.answers.map((answer, answerIndex) => (
            <div key={answerIndex} className="space-y-3">
              <div
                className={`grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_auto] ${
                  answer.correct
                    ? "border-pine/30 bg-pine-soft/60"
                    : "border-line bg-stone-50/70"
                }`}
              >
                <input
                  value={answer.text}
                  type="text"
                  className="field-input h-11 border-none bg-white shadow-none focus:ring-2"
                  onChange={(event) => updateAnswer(answerIndex, "text", event.target.value)}
                />
                <label
                  className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm font-medium transition ${
                    answer.correct
                      ? "border-pine bg-white text-pine-dark"
                      : "border-line bg-white text-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-pine"
                    checked={answer.correct}
                    onChange={(event) =>
                      updateAnswer(answerIndex, "correct", event.target.checked)
                    }
                  />
                  Correct
                </label>
              </div>
              <ImageUploadField
                label="Answer image (optional)"
                image={answer.image}
                defaultAlt={answer.text || question.summary}
                onChange={(image) =>
                  updateQuestion({
                    ...question,
                    answers: question.answers.map((item, itemIndex) =>
                      itemIndex === answerIndex ? { ...item, image } : item
                    )
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
