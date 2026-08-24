import {
  MAX_SOURCE_CHARACTERS,
  MIN_READABLE_CHARACTERS,
  SOURCE_WARNING_CHARACTERS
} from "../sourceLimits";
import { ExtractionError } from "./errors";

export const countReadableCharacters = (value: string) =>
  Array.from(value).filter(
    (character) =>
      /[0-9]/.test(character) ||
      character.toLocaleLowerCase() !== character.toLocaleUpperCase()
  ).length;

export const normalizeSourceText = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();

export const validateNormalizedSource = (
  text: string,
  options: { requireReadableText?: boolean } = {}
) => {
  const normalized = normalizeSourceText(text);

  if (!normalized) {
    throw new ExtractionError(
      "NO_READABLE_TEXT",
      "No readable text could be extracted. Paste the text or upload a clearer source."
    );
  }

  if (
    options.requireReadableText !== false &&
    countReadableCharacters(normalized) < MIN_READABLE_CHARACTERS
  ) {
    throw new ExtractionError(
      "NO_READABLE_TEXT",
      "The source does not contain enough readable text to generate grounded questions."
    );
  }

  if (normalized.length > MAX_SOURCE_CHARACTERS) {
    throw new ExtractionError(
      "SOURCE_TOO_LONG",
      `Source text is ${normalized.length.toLocaleString()} characters. The limit is ${MAX_SOURCE_CHARACTERS.toLocaleString()} characters.`
    );
  }

  const warnings =
    normalized.length >= SOURCE_WARNING_CHARACTERS
      ? [
          `Source text is ${normalized.length.toLocaleString()} characters. Shorter sources usually produce better questions.`
        ]
      : [];

  return { text: normalized, warnings };
};

export const decodeUtf8Strict = (buffer: Buffer, failureMessage: string) => {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    throw new ExtractionError("CORRUPT_DOCUMENT", failureMessage);
  }
};
