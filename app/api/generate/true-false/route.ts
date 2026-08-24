import {
  buildGenerationPrompt,
  mapGeneratedQuestions
} from "@/lib/mapGeneratedQuestions";
import { parseGenerationRequest } from "@/lib/generationRequest";
import { openai } from "@/lib/openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 }
    );
  }

  try {
    const parsedRequest = parseGenerationRequest(await request.json());

    if (parsedRequest.error) {
      const { status, ...payload } = parsedRequest.error;
      return NextResponse.json(payload, { status });
    }

    const { text, count, difficulty } = parsedRequest.data;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You write educational true-false questions. Return JSON only: {\"questions\":[...]} with content fields only."
        },
        {
          role: "user",
          content: buildGenerationPrompt(text, count, difficulty)
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content;

    if (!raw) {
      return NextResponse.json({ error: "No response from the model." }, { status: 502 });
    }

    const parsed = JSON.parse(raw) as { questions?: unknown };
    const rawQuestions = parsed.questions;

    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      return NextResponse.json({ error: "Invalid response from the model." }, { status: 502 });
    }

    const questions = mapGeneratedQuestions(rawQuestions, count);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Model returned questions in an unexpected format." },
        { status: 502 }
      );
    }

    if (questions.length !== count) {
      return NextResponse.json(
        {
          error: `Expected ${count} valid questions, but only ${questions.length} could be generated. Try again.`
        },
        { status: 502 }
      );
    }

    return NextResponse.json(questions);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate questions.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
