import type JSZip from "jszip";
import type {
  QuestionSetQuiz,
  TrueFalseQuestion,
  UploadedImage
} from "./types";

const uniqueImages = (images: UploadedImage[]) => {
  const seen = new Set<string>();

  return images.filter((image) => {
    if (seen.has(image.id)) {
      return false;
    }

    seen.add(image.id);
    return true;
  });
};

export const collectTrueFalseImages = (question: TrueFalseQuestion) =>
  uniqueImages(question.questionImage ? [question.questionImage] : []);

export const collectQuestionSetImages = (quiz: QuestionSetQuiz) =>
  uniqueImages(
    quiz.questions.flatMap((question) => [
      ...(question.questionImage ? [question.questionImage] : []),
      ...question.answers.flatMap((answer) => (answer.image ? [answer.image] : []))
    ])
  );

export const addImagesToZip = async (zip: JSZip, images: UploadedImage[]) => {
  for (const image of images) {
    const response = await fetch(image.url);

    if (!response.ok) {
      throw new Error(`Failed to load image ${image.originalName}.`);
    }

    const bytes = await response.arrayBuffer();
    zip.file(`content/${image.h5pPath}`, bytes);
  }
};
