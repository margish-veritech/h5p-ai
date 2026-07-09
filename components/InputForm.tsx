"use client";

import type { Difficulty, H5PContentType } from "@/lib/types";

type InputFormProps = {
  text: string;
  count: number;
  difficulty: Difficulty;
  contentType: H5PContentType;
  isLoading: boolean;
  error: string | null;
  onTextChange: (value: string) => void;
  onCountChange: (value: number) => void;
  onDifficultyChange: (value: Difficulty) => void;
  onContentTypeChange: (value: H5PContentType) => void;
  onSubmit: () => void;
};

const CONTENT_TYPES: Array<{
  value: H5PContentType;
  label: string;
  hint: string;
}> = [
  {
    value: "true-false",
    label: "True / False",
    hint: "One H5P file per question"
  },
  {
    value: "question-set",
    label: "Quiz set",
    hint: "Multiple choice in one package"
  }
];

export function InputForm({
  text,
  count,
  difficulty,
  contentType,
  isLoading,
  error,
  onTextChange,
  onCountChange,
  onDifficultyChange,
  onContentTypeChange,
  onSubmit
}: InputFormProps) {
  return (
    <section className="panel">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="badge-brand">Generator</span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
            Turn notes into H5P
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Paste your lesson content, pick a format, and get editable questions ready
            to export.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-stone-50/80 px-4 py-3 text-sm text-muted">
          <p className="font-medium text-ink">Output</p>
          <p className="mt-1">
            {contentType === "true-false"
              ? "Separate .h5p per True/False item"
              : "Single Question Set .h5p quiz"}
          </p>
        </div>
      </div>

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div>
          <p className="field-label">Content type</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {CONTENT_TYPES.map((type) => {
              const selected = contentType === type.value;

              return (
                <button
                  key={type.value}
                  type="button"
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-ocean bg-ocean-soft shadow-float"
                      : "border-line bg-white hover:border-stone-300 hover:bg-stone-50"
                  }`}
                  onClick={() => onContentTypeChange(type.value)}
                >
                  <p className="font-semibold text-ink">{type.label}</p>
                  <p className="mt-1 text-sm text-muted">{type.hint}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="source-content" className="field-label">
            Source content
          </label>
          <textarea
            id="source-content"
            value={text}
            minLength={1}
            rows={9}
            className="field-textarea"
            placeholder="Paste a paragraph, article section, or study notes..."
            onChange={(event) => onTextChange(event.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="question-count" className="field-label">
              Question count
            </label>
            <input
              id="question-count"
              type="number"
              min={1}
              max={10}
              value={count}
              className="field-input h-11"
              onChange={(event) => onCountChange(Number(event.target.value))}
            />
          </div>

          <div>
            <label htmlFor="difficulty" className="field-label">
              Difficulty
            </label>
            <select
              id="difficulty"
              value={difficulty}
              className="field-input h-11 cursor-pointer"
              onChange={(event) =>
                onDifficultyChange(event.target.value as Difficulty)
              }
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Questions are generated from your content only. You can edit everything
            before export.
          </p>
          <button type="submit" disabled={isLoading} className="btn-primary min-w-44">
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Generating
              </>
            ) : (
              "Generate questions"
            )}
          </button>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </form>
    </section>
  );
}
