import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import type { TrueFalseQuestion } from "@/lib/types";

export const runtime = "nodejs";

const isQuestion = (value: unknown): value is TrueFalseQuestion => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.question === "string" &&
    typeof candidate.correct === "boolean" &&
    typeof candidate.feedbackCorrect === "string" &&
    typeof candidate.feedbackWrong === "string"
  );
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<{
      text: unknown;
      count: unknown;
    }>;

    const text = typeof body.text === "string" ? body.text.trim() : "";
    const count = typeof body.count === "number" ? body.count : Number.NaN;

    if (!text) {
      return NextResponse.json({ error: "Text must not be empty." }, { status: 400 });
    }

    if (!Number.isInteger(count) || count < 1 || count > 10) {
      return NextResponse.json(
        { error: "Count must be an integer from 1 to 10." },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an educational content expert. Generate H5P True/False questions from the provided text. Return ONLY valid JSON — no markdown, no explanation, no backticks."
        },
        {
          role: "user",
          content: `Generate ${count} True/False questions based on this content:\n\n${text}\n\nReturn a JSON array. Each object must have exactly these fields:
- question: string
- correct: boolean
- feedbackCorrect: string
- feedbackWrong: string`
        }
      ],
      temperature: 0.4
    });

    const rawContent = completion.choices[0]?.message.content;

    console.log("RAW Content ", rawContent)
    if (!rawContent) {
      return NextResponse.json(
        { error: "OpenAI returned an empty response." },
        { status: 500 }
      );
    }


    let parsed: unknown;

    try {
      console.log("Started parsing ", rawContent)
      parsed = JSON.parse(rawContent);
    } catch {
      console.log("Failed parsing ")
      return NextResponse.json(
        { error: "OpenAI returned invalid JSON." },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsed) || !parsed.every(isQuestion)) {

      console.log("No parsed array ")
      return NextResponse.json(
        { error: "OpenAI returned an unexpected question format." },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate questions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
