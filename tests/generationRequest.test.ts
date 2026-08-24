import { describe, expect, it } from "vitest";
import { parseGenerationRequest } from "@/lib/generationRequest";
import { MAX_SOURCE_CHARACTERS } from "@/lib/sourceLimits";

describe("parseGenerationRequest", () => {
  it("preserves the existing defaults and count clamping", () => {
    expect(parseGenerationRequest({ text: "  lesson text  " })).toEqual({
      data: { text: "lesson text", count: 3, difficulty: "intermediate" }
    });
    expect(
      parseGenerationRequest({ text: "lesson", count: 99.6, difficulty: "advanced" })
    ).toEqual({ data: { text: "lesson", count: 10, difficulty: "advanced" } });
  });

  it("returns stable empty and over-limit errors without truncating", () => {
    expect(parseGenerationRequest({ text: " \n " }).error).toMatchObject({
      code: "SOURCE_REQUIRED",
      status: 400
    });
    const overLimit = "x".repeat(MAX_SOURCE_CHARACTERS + 1);
    const result = parseGenerationRequest({ text: overLimit });
    expect(result.error).toMatchObject({ code: "SOURCE_TOO_LONG", status: 413 });
    expect(overLimit).toHaveLength(MAX_SOURCE_CHARACTERS + 1);
  });
});

