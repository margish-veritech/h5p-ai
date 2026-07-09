import {
  buildQuestionSetPrompt,
  mapGeneratedQuestionSet
} from "@/lib/mapGeneratedQuestionSet";
import { openai } from "@/lib/openai";
import type { Difficulty } from "@/lib/types";
import { NextResponse } from "next/server";

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];

const isDifficulty = (value: unknown): value is Difficulty =>
  typeof value === "string" && DIFFICULTIES.includes(value as Difficulty);

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as {
      text?: unknown;
      count?: unknown;
      difficulty?: unknown;
    };

    const text = typeof body.text === "string" ? body.text.trim() : "";
    const count =
      typeof body.count === "number" && Number.isFinite(body.count)
        ? Math.min(10, Math.max(1, Math.round(body.count)))
        : 3;
    const difficulty = isDifficulty(body.difficulty) ? body.difficulty : "intermediate";

    if (!text) {
      return NextResponse.json({ error: "Content is required." }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You write educational multiple-choice quizzes. Return JSON only with quizSummary and questions."
        },
        {
          role: "user",
          content: buildQuestionSetPrompt(text, count, difficulty)
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content;

    if (!raw) {
      return NextResponse.json({ error: "No response from the model." }, { status: 502 });
    }

    const parsed = JSON.parse(raw) as unknown;
    const quiz = mapGeneratedQuestionSet(parsed, count);

    if (!quiz) {
      return NextResponse.json(
        { error: "Model returned a quiz in an unexpected format." },
        { status: 502 }
      );
    }

    if (quiz.questions.length !== count) {
      return NextResponse.json(
        {
          error: `Expected ${count} valid questions, but only ${quiz.questions.length} could be generated. Try again.`
        },
        { status: 502 }
      );
    }

    return NextResponse.json(quiz);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate the quiz.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
