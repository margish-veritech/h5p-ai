"use client";

type InputFormProps = {
  text: string;
  count: number;
  isLoading: boolean;
  error: string | null;
  onTextChange: (value: string) => void;
  onCountChange: (value: number) => void;
  onSubmit: () => void;
};

export function InputForm({
  text,
  count,
  isLoading,
  error,
  onTextChange,
  onCountChange,
  onSubmit
}: InputFormProps) {
  return (
    <section className="mx-auto w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-normal text-ink">
          H5P AI Generator
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Paste source content, generate True/False questions, edit them, and
          download one H5P package per question.
        </p>
      </div>

      <form
        className="mt-6 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="space-y-2">
          <label
            htmlFor="source-content"
            className="block text-sm font-medium text-slate-800"
          >
            Paste your content here
          </label>
          <textarea
            id="source-content"
            value={text}
            minLength={1}
            rows={8}
            className="min-h-32 w-full rounded-md border border-slate-300 px-3 py-2 text-base leading-6 text-slate-900 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
            placeholder="Paste your content here"
            onChange={(event) => onTextChange(event.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-[220px_1fr] sm:items-end">
          <div className="space-y-2">
            <label
              htmlFor="question-count"
              className="block text-sm font-medium text-slate-800"
            >
              Number of questions
            </label>
            <input
              id="question-count"
              type="number"
              min={1}
              max={10}
              value={count}
              className="h-11 w-full rounded-md border border-slate-300 px-3 text-base text-slate-900 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/20"
              onChange={(event) => onCountChange(Number(event.target.value))}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-11 min-w-44 cursor-pointer items-center justify-center rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white transition hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Generating
              </span>
            ) : (
              "Generate Questions"
            )}
          </button>
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </form>
    </section>
  );
}
