"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { InputForm } from "@/components/InputForm";
import { PageHeader } from "@/components/PageHeader";
import { QuestionSetReview } from "@/components/QuestionSetReview";
import { ReviewCard } from "@/components/ReviewCard";
import type {
  Difficulty,
  H5PContentType,
  QuestionSetQuiz,
  TrueFalseQuestion
} from "@/lib/types";
import type {
  ExtractRouteResponse,
  ExtractionErrorCode
} from "@/lib/source/types";
import {
  MAX_SOURCE_CHARACTERS,
  MAX_UPLOAD_BYTES,
  SOURCE_FILE_HELP
} from "@/lib/sourceLimits";

type Screen = "input" | "review";

const GENERATE_ENDPOINTS: Record<H5PContentType, string> = {
  "true-false": "/api/generate/true-false",
  "question-set": "/api/generate/question-set"
};

export default function Home() {
  const [screen, setScreen] = useState<Screen>("input");
  const [contentType, setContentType] = useState<H5PContentType>("true-false");
  const [text, setText] = useState("");
  const [count, setCount] = useState(3);
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [trueFalseQuestions, setTrueFalseQuestions] = useState<TrueFalseQuestion[]>([]);
  const [questionSetQuiz, setQuestionSetQuiz] = useState<QuestionSetQuiz | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [pendingFilename, setPendingFilename] = useState<string | null>(null);
  const [extractedSource, setExtractedSource] = useState<
    ExtractRouteResponse["source"] | null
  >(null);
  const [extractionStats, setExtractionStats] = useState<
    ExtractRouteResponse["stats"] | null
  >(null);
  const [extractionWarnings, setExtractionWarnings] = useState<string[]>([]);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [pastedTextSeed, setPastedTextSeed] = useState("");
  const [error, setError] = useState<string | null>(null);
  const extractionRequestRef = useRef<XMLHttpRequest | null>(null);
  const extractionRequestIdRef = useRef(0);

  useEffect(() => {
    return () => extractionRequestRef.current?.abort();
  }, []);

  const handleTextChange = (value: string) => {
    setText(value);
    if (!extractedSource && !isExtracting) {
      setPastedTextSeed(value);
    }
  };

  const cancelExtraction = () => {
    extractionRequestIdRef.current += 1;
    extractionRequestRef.current?.abort();
    extractionRequestRef.current = null;
    setIsExtracting(false);
    setExtractionProgress(0);
    setPendingFilename(null);
    setExtractionError("Extraction cancelled. Your existing source text was preserved.");
  };

  const extractFiles = (files: File[]) => {
    setExtractionError(null);

    if (files.length !== 1) {
      setExtractionError("Upload one file at a time.");
      return;
    }

    const file = files[0];
    const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
    const supportedExtensions = [".txt", ".csv", ".pdf", ".docx", ".jpg", ".jpeg", ".png", ".webp"];

    if (extension === ".doc") {
      setExtractionError("Legacy .doc files are not supported. Resave as .docx or PDF.");
      return;
    }

    if (!supportedExtensions.includes(extension)) {
      setExtractionError(`Unsupported file format. Upload ${SOURCE_FILE_HELP}.`);
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setExtractionError(
        `The file is ${(file.size / 1024 / 1024).toFixed(1)} MiB; the limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MiB.`
      );
      return;
    }

    extractionRequestRef.current?.abort();
    const requestId = extractionRequestIdRef.current + 1;
    extractionRequestIdRef.current = requestId;

    const request = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    if (pastedTextSeed.trim()) {
      formData.append("pastedText", pastedTextSeed);
    }

    extractionRequestRef.current = request;
    setIsExtracting(true);
    setExtractionProgress(0);
    setPendingFilename(file.name);

    request.open("POST", "/api/extract");
    request.timeout = 40_000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && extractionRequestIdRef.current === requestId) {
        setExtractionProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    };
    request.onload = () => {
      if (extractionRequestIdRef.current !== requestId) {
        return;
      }

      try {
        const payload = JSON.parse(request.responseText) as
          | ExtractRouteResponse
          | { error?: string; code?: ExtractionErrorCode };

        if (request.status < 200 || request.status >= 300 || !("text" in payload)) {
          throw new Error(
            "error" in payload && payload.error
              ? payload.error
              : "The source could not be extracted."
          );
        }

        setText(payload.text);
        setExtractedSource(payload.source);
        setExtractionStats(payload.stats);
        setExtractionWarnings(payload.warnings);
        setError(null);
      } catch (caughtError) {
        setExtractionError(
          caughtError instanceof Error
            ? caughtError.message
            : "The source could not be extracted."
        );
      } finally {
        extractionRequestRef.current = null;
        setIsExtracting(false);
        setExtractionProgress(0);
        setPendingFilename(null);
      }
    };
    request.onerror = () => {
      if (extractionRequestIdRef.current === requestId) {
        extractionRequestRef.current = null;
        setIsExtracting(false);
        setExtractionProgress(0);
        setPendingFilename(null);
        setExtractionError("The upload failed. Check your connection and try again.");
      }
    };
    request.ontimeout = () => {
      if (extractionRequestIdRef.current === requestId) {
        extractionRequestRef.current = null;
        setIsExtracting(false);
        setExtractionProgress(0);
        setPendingFilename(null);
        setExtractionError("Extraction timed out. Try a smaller file or paste the text.");
      }
    };
    request.send(formData);
  };

  const generateQuestions = async () => {
    setError(null);

    if (!text.trim()) {
      setError("Content is required.");
      return;
    }

    if (text.length > MAX_SOURCE_CHARACTERS) {
      setError(
        `Content exceeds the ${MAX_SOURCE_CHARACTERS.toLocaleString()}-character limit. Split or shorten it and try again.`
      );
      return;
    }

    const requestedContentType = contentType;
    setIsGenerating(true);

    try {
      const response = await fetch(GENERATE_ENDPOINTS[requestedContentType], {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text, count, difficulty })
      });

      const payload = (await response.json()) as
        | TrueFalseQuestion[]
        | QuestionSetQuiz
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          !Array.isArray(payload) &&
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            payload.error
            ? payload.error
            : "Failed to generate questions."
        );
      }

      if (requestedContentType === "true-false") {
        if (!Array.isArray(payload)) {
          throw new Error("Unexpected response from the generator.");
        }

        setTrueFalseQuestions(payload);
      } else {
        if (Array.isArray(payload) || !payload || typeof payload !== "object") {
          throw new Error("Unexpected response from the generator.");
        }

        setQuestionSetQuiz(payload as QuestionSetQuiz);
      }

      setScreen("review");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to generate questions."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const updateTrueFalseQuestion = (
    index: number,
    updatedQuestion: TrueFalseQuestion
  ) => {
    setTrueFalseQuestions((currentQuestions) =>
      currentQuestions.map((question, questionIndex) =>
        questionIndex === index ? updatedQuestion : question
      )
    );
  };

  return (
    <AppShell step={screen === "input" ? "create" : "review"}>
      {screen === "input" ? (
        <InputForm
          text={text}
          count={count}
          difficulty={difficulty}
          contentType={contentType}
          isLoading={isGenerating}
          isExtracting={isExtracting}
          extractionProgress={extractionProgress}
          pendingFilename={pendingFilename}
          extractedSource={extractedSource}
          extractionStats={extractionStats}
          extractionWarnings={extractionWarnings}
          extractionError={extractionError}
          error={error}
          onTextChange={handleTextChange}
          onCountChange={(value) => setCount(Number.isNaN(value) ? 1 : value)}
          onDifficultyChange={setDifficulty}
          onContentTypeChange={setContentType}
          onFilesSelected={extractFiles}
          onCancelExtraction={cancelExtraction}
          onSubmit={generateQuestions}
        />
      ) : contentType === "true-false" ? (
        <section>
          <PageHeader
            title="Review questions"
            description="Edit each true-false item, then download its own H5P package."
            actions={
              <>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={isGenerating}
                  onClick={() => setScreen("input")}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={isGenerating}
                  onClick={() => void generateQuestions()}
                >
                  {isGenerating ? "Regenerating..." : "Regenerate"}
                </button>
              </>
            }
          />

          {error ? (
            <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="grid gap-5">
            {trueFalseQuestions.map((question, index) => (
              <ReviewCard
                key={index}
                index={index}
                question={question}
                onChange={(updatedQuestion) =>
                  updateTrueFalseQuestion(index, updatedQuestion)
                }
              />
            ))}
          </div>
        </section>
      ) : questionSetQuiz ? (
        <QuestionSetReview
          quiz={questionSetQuiz}
          onChange={setQuestionSetQuiz}
          onBack={() => setScreen("input")}
          onRegenerate={() => void generateQuestions()}
          isLoading={isGenerating}
          error={error}
        />
      ) : null}
    </AppShell>
  );
}
