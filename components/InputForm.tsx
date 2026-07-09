"use client";

import { useEffect, useRef, useState } from "react";
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

const SAMPLE_CONTENT = `Photosynthesis is the process by which green plants make their own food using sunlight, carbon dioxide, and water. This process mainly happens in the leaves of the plant. Leaves contain a green pigment called chlorophyll, which helps absorb energy from sunlight.

During photosynthesis, plants take in carbon dioxide from the air through tiny openings in their leaves called stomata. They also absorb water from the soil through their roots. Using sunlight as energy, the plant converts carbon dioxide and water into glucose and oxygen.

Glucose is a type of sugar that plants use as food for energy and growth. Oxygen is released back into the air as a by-product of photosynthesis. This oxygen is important for humans, animals, and many other living organisms because they need it to breathe.

Photosynthesis is important because it provides food for plants and also supports life on Earth by producing oxygen. Without photosynthesis, there would be less oxygen in the atmosphere and less food available for many living things.
`;

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
  const [sampleCopied, setSampleCopied] = useState(false);
  const resetCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetCopyTimeoutRef.current) {
        clearTimeout(resetCopyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopySample = async () => {
    try {
      await navigator.clipboard.writeText(SAMPLE_CONTENT);
      setSampleCopied(true);

      if (resetCopyTimeoutRef.current) {
        clearTimeout(resetCopyTimeoutRef.current);
      }

      resetCopyTimeoutRef.current = setTimeout(() => {
        setSampleCopied(false);
        resetCopyTimeoutRef.current = null;
      }, 5000);
    } catch {
      setSampleCopied(false);
    }
  };

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

        <button
          type="button"
          className={`min-w-44 transition ${
            sampleCopied ? "btn-download" : "btn-secondary"
          }`}
          onClick={handleCopySample}
          aria-live="polite"
        >
          {sampleCopied ? (
            <>
              <span aria-hidden>✓</span>
              Copied to clipboard
            </>
          ) : (
            "Copy sample content"
          )}
        </button>
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
