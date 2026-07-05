import type { TrueFalseQuestion } from "./types";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const safeFilename = (value: string) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return normalized || "ai-generated-true-false";
};

export function generateAndDownloadH5P(question: TrueFalseQuestion): void {
  void (async () => {
    if (typeof window === "undefined") {
      return;
    }

    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();

    const h5pJson = {
      title: "AI Generated True/False",
      language: "en",
      mainLibrary: "H5P.TrueFalse",
      embedTypes: ["iframe"],
      license: "U",
      preloadedDependencies: [
        { machineName: "FontAwesome", majorVersion: 4, minorVersion: 5 },
        { machineName: "H5P.Question", majorVersion: 1, minorVersion: 5 },
        { machineName: "H5P.JoubelUI", majorVersion: 1, minorVersion: 3 },
        { machineName: "H5P.TrueFalse", majorVersion: 1, minorVersion: 8 }
      ]
    };

    const contentJson = {
      question: `<p>${escapeHtml(question.question)}</p>`,
      correct: question.correct ? "true" : "false",
      behaviour: {
        enableRetry: true,
        enableSolutionsButton: true,
        enableCheckButton: true,
        confirmCheckDialog: false,
        confirmRetryDialog: false,
        autoCheck: false
      },
      media: { disableImageZooming: false },
      feedback: {
        correct: question.feedbackCorrect,
        wrong: question.feedbackWrong
      },
      l10n: {
        trueText: "True",
        falseText: "False",
        score: "You got @score of @total points",
        checkAnswer: "Check",
        showSolutionButton: "Show solution",
        retry: "Retry",
        wrongAnswerMessage: "Wrong answer",
        correctAnswerMessage: "Correct answer",
        scoreBarLabel: "You got :num out of :total points",
        a11yCheck:
          "Check the answers. The responses will be marked as correct, incorrect, or unanswered.",
        a11yShowSolution:
          "Show the solution. The task will be marked with its correct solution.",
        a11yRetry:
          "Retry the task. Reset all responses and start the task over again."
      }
    };

    zip.file("h5p.json", JSON.stringify(h5pJson, null, 2));
    zip.file("content/content.json", JSON.stringify(contentJson, null, 2), {
      createFolders: false
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${safeFilename(question.question)}.h5p`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  })();
}
