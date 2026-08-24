import { ExtractionError } from "./errors";

export const withExtractionTimeout = async <T>(
  work: Promise<T>,
  timeoutMs: number
): Promise<T> => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      work,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => {
          reject(
            new ExtractionError(
              "EXTRACTION_TIMEOUT",
              "Extraction took too long. Try a smaller or simpler file."
            )
          );
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
};
