import { openai } from "@/lib/openai";
import type { Difficulty, TrueFalseQuestion } from "@/lib/types";
import { NextResponse } from "next/server";

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];

const isDifficulty = (value: unknown): value is Difficulty =>
  typeof value === "string" && DIFFICULTIES.includes(value as Difficulty);

const isQuestion = (value: unknown): value is TrueFalseQuestion => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const question = value as TrueFalseQuestion;

  return (
    typeof question.title === "string" &&
    question.library === "H5P.TrueFalse" &&
    typeof question.question === "string" &&
    typeof question.correct === "boolean" &&
    typeof question.feedbackOnCorrect === "string" &&
    typeof question.feedbackOnWrong === "string"
  );
};

const buildPrompt = (content: string, questionCount: number, difficulty: Difficulty) =>
  `You are an H5P content generator.

Your task is to generate True/False questions from the provided learning content.

Important rule:
H5P.TrueFalse supports only ONE question per H5P content item.

So if the user requests multiple True/False questions, do NOT put multiple questions inside one H5P.TrueFalse object.

Instead, generate multiple separate H5P.TrueFalse content objects.

Input:

* Content: ${content}
* Number of questions: ${questionCount}
* Difficulty: ${difficulty}

Output format:
Return a valid JSON array.

Each array item must represent one separate H5P.TrueFalse content item.

Each item must include:

* title: short title for this question
* library: "H5P.TrueFalse"
* question: the statement shown to the learner
* correct: true or false
* feedbackOnCorrect: short positive feedback
* feedbackOnWrong: short explanation of why the answer is wrong

Rules:

1. Generate exactly ${questionCount} separate True/False questions.
2. Each question must be based only on the provided content.
3. Do not invent facts outside the content.
4. Make statements clear and unambiguous.
5. Avoid trick questions unless difficulty is advanced.
6. Balance true and false answers when possible.
7. Each question should test a different concept.
8. Return JSON only. Do not include markdown, explanation, or extra text.

Expected JSON structure:

[
{
"title": "Question 1",
"library": "H5P.TrueFalse",
"question": "Photosynthesis happens in the chloroplasts of plant cells.",
"correct": true,
"feedbackOnCorrect": "Correct. Chloroplasts contain chlorophyll and are the main site of photosynthesis.",
"feedbackOnWrong": "Not correct. Photosynthesis mainly happens in chloroplasts."
},
{
"title": "Question 2",
"library": "H5P.TrueFalse",
"question": "Plants use oxygen as the main input for photosynthesis.",
"correct": false,
"feedbackOnCorrect": "Correct. Plants mainly use carbon dioxide and water for photosynthesis.",
"feedbackOnWrong": "Not correct. Oxygen is mostly produced during photosynthesis, not used as the main input."
}
]`;

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
            "You generate H5P True/False questions. Return a JSON object with a single key `questions` whose value is an array of question objects."
        },
        {
          role: "user",
          content: `${buildPrompt(text, count, difficulty)}\n\nReturn: {"questions":[...]}`
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content;

    if (!raw) {
      return NextResponse.json({ error: "No response from the model." }, { status: 502 });
    }

    const parsed = JSON.parse(raw) as { questions?: unknown };
    const questions = parsed.questions;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "Invalid response from the model." }, { status: 502 });
    }

    if (!questions.every(isQuestion)) {
      return NextResponse.json(
        { error: "Model returned questions in an unexpected format." },
        { status: 502 }
      );
    }

    return NextResponse.json(questions.slice(0, count));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate questions.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
