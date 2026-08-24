type GeneratedQuestionSearchProps = {
  query: string;
  resultCount: number;
  totalCount: number;
  onQueryChange: (query: string) => void;
};

export function GeneratedQuestionSearch({
  query,
  resultCount,
  totalCount,
  onQueryChange
}: GeneratedQuestionSearchProps) {
  const hasQuery = query.trim().length > 0;
  const questionLabel = totalCount === 1 ? "question" : "questions";

  return (
    <div className="panel-muted mb-5">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <label htmlFor="generated-question-search" className="field-label">
            Search generated questions
          </label>
          <input
            id="generated-question-search"
            value={query}
            type="search"
            className="field-input h-11"
            placeholder="Search by word or sentence"
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn-secondary h-11"
          disabled={!hasQuery}
          onClick={() => onQueryChange("")}
        >
          Clear
        </button>
      </div>
      <p className="mt-3 text-sm text-muted" aria-live="polite">
        Showing {hasQuery ? resultCount : totalCount} of {totalCount} {questionLabel}
      </p>
    </div>
  );
}
