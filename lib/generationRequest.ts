import type { Difficulty } from "./types";
import { MAX_SOURCE_CHARACTERS } from "./sourceLimits";
import { normalizeSourceText } from "./source/normalizeText";

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];

type GenerationRequest = {
  text: string;
  count: number;
  difficulty: Difficulty;
};

type GenerationRequestError = {
  error: string;
  code: "SOURCE_REQUIRED" | "SOURCE_TOO_LONG";
  status: 400 | 413;
};

export type ParsedGenerationRequest =
  | { data: GenerationRequest; error?: never }
  | { data?: never; error: GenerationRequestError };

const isDifficulty = (value: unknown): value is Difficulty =>
  typeof value === "string" && DIFFICULTIES.includes(value as Difficulty);

export const parseGenerationRequest = (body: unknown): ParsedGenerationRequest => {
  const input = typeof body === "object" && body !== null ? body : {};
  const values = input as Record<string, unknown>;
  const text = normalizeSourceText(typeof values.text === "string" ? values.text : "");

  if (!text) {
    return {
      error: {
        error: "Content is required.",
        code: "SOURCE_REQUIRED",
        status: 400
      }
    };
  }

  if (text.length > MAX_SOURCE_CHARACTERS) {
    return {
      error: {
        error: `Content exceeds the ${MAX_SOURCE_CHARACTERS.toLocaleString()}-character limit. Split or shorten it and try again.`,
        code: "SOURCE_TOO_LONG",
        status: 413
      }
    };
  }

  const count =
    typeof values.count === "number" && Number.isFinite(values.count)
      ? Math.min(10, Math.max(1, Math.round(values.count)))
      : 3;
  const difficulty = isDifficulty(values.difficulty)
    ? values.difficulty
    : "intermediate";

  return { data: { text, count, difficulty } };
};

