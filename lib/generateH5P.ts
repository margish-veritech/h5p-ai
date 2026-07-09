import {
  buildTrueFalseContentJson,
  buildTrueFalseH5pJson,
  safeH5PFilename
} from "./h5pContent";
import type { TrueFalseQuestion } from "./types";
import { validateTrueFalseQuestion } from "./validateContent";

export function generateAndDownloadH5P(question: TrueFalseQuestion): string | null {
  const error = validateTrueFalseQuestion(question);

  if (error) {
    return error;
  }

  void (async () => {
    if (typeof window === "undefined") {
      return;
    }

    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();

    zip.file("h5p.json", JSON.stringify(buildTrueFalseH5pJson(question), null, 2));
    zip.file(
      "content/content.json",
      JSON.stringify(buildTrueFalseContentJson(question), null, 2),
      { createFolders: false }
    );

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${safeH5PFilename(question.title || question.question)}.h5p`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  })();

  return null;
}
