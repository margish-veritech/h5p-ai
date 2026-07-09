import { addImagesToZip, collectQuestionSetImages } from "./addImagesToZip";
import {
  buildQuestionSetContentJson,
  buildQuestionSetH5pJson,
  safeQuestionSetFilename
} from "./h5pQuestionSetContent";
import type { QuestionSetQuiz } from "./types";

export function generateAndDownloadQuestionSetH5P(quiz: QuestionSetQuiz): void {
  void (async () => {
    if (typeof window === "undefined" || quiz.questions.length === 0) {
      return;
    }

    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();

    zip.file("h5p.json", JSON.stringify(buildQuestionSetH5pJson(quiz), null, 2));
    zip.file(
      "content/content.json",
      JSON.stringify(buildQuestionSetContentJson(quiz), null, 2),
      { createFolders: false }
    );

    await addImagesToZip(zip, collectQuestionSetImages(quiz));

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${safeQuestionSetFilename(quiz.title)}.h5p`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  })();
}
