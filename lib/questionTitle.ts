export const formatQuestionTitle = (index: number, summary: string) => {
  const topic = summary.trim();

  return topic ? `Question ${index + 1} | ${topic}` : `Question ${index + 1}`;
};

const GENERIC_TITLE = /^question\s*\d+$/i;

export const normalizeSummary = (summary: string, question: string, index: number) => {
  const trimmed = summary.trim();

  if (trimmed && !GENERIC_TITLE.test(trimmed)) {
    return trimmed;
  }

  const snippet = question.trim().replace(/\s+/g, " ").slice(0, 50).trim();

  if (snippet) {
    return snippet.endsWith(".") ? snippet.slice(0, -1) : snippet;
  }

  return `Topic ${index + 1}`;
};
