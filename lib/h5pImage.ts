import type { UploadedImage } from "./types";

const createSubContentId = () => crypto.randomUUID();

// Mirrors h5p-examples/json/question-set MultiChoice media.type shape.
export const buildH5pImageMediaBlock = (
  image: UploadedImage,
  title?: string
) => ({
  disableImageZooming: false,
  type: {
    library: "H5P.Image 1.1",
    params: {
      contentName: "Image",
      alt: image.alt,
      file: {
        path: image.h5pPath,
        mime: image.mime,
        width: image.width,
        height: image.height,
        copyright: {
          license: "U"
        }
      },
      decorative: false
    },
    subContentId: createSubContentId(),
    metadata: {
      title: title || image.originalName,
      license: "U",
      contentType: "Image"
    }
  }
});

export const buildQuestionMediaField = (
  image: UploadedImage | null | undefined,
  title?: string
) => {
  if (!image) {
    return { disableImageZooming: false };
  }

  return buildH5pImageMediaBlock(image, title);
};
