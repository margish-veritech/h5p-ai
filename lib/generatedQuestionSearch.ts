import type { MultiChoiceQuestion, TrueFalseQuestion } from "./types";

type SearchableQuestion<TQuestion> = {
  index: number;
  question: TQuestion;
};

const normalizeSearchText = (value: string) =>
  value.toLowerCase().replace(/\s+/g, " ").trim();

const includesSearchQuery = (values: string[], query: string) => {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  return normalizeSearchText(values.join(" ")).includes(normalizedQuery);
};

export const trueFalseQuestionMatchesSearch = (
  question: TrueFalseQuestion,
  query: string
) =>
  includesSearchQuery(
    [
      question.title,
      question.summary,
      question.question,
      question.feedbackOnCorrect,
      question.feedbackOnWrong
    ],
    query
  );

export const multiChoiceQuestionMatchesSearch = (
  question: MultiChoiceQuestion,
  query: string
) =>
  includesSearchQuery(
    [
      question.title,
      question.summary,
      question.question,
      ...question.answers.map((answer) => answer.text)
    ],
    query
  );

export const filterSearchableQuestions = <TQuestion>(
  questions: TQuestion[],
  query: string,
  matchesSearch: (question: TQuestion, query: string) => boolean
): SearchableQuestion<TQuestion>[] =>
  questions
    .map((question, index) => ({ index, question }))
    .filter(({ question }) => matchesSearch(question, query));
