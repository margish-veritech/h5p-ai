import type { UploadedImage } from "./types";

const readImageDimensions = (file: File) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the image dimensions."));
    };

    image.src = objectUrl;
  });

export const uploadImageFile = async (
  file: File,
  alt: string
): Promise<UploadedImage> => {
  const { width, height } = await readImageDimensions(file);
  const formData = new FormData();

  formData.append("file", file);
  formData.append("width", String(width));
  formData.append("height", String(height));
  formData.append("alt", alt);

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData
  });

  const payload = (await response.json()) as UploadedImage | { error?: string };

  if (!response.ok) {
    throw new Error(
      typeof payload === "object" && payload !== null && "error" in payload && payload.error
        ? payload.error
        : "Image upload failed."
    );
  }

  return payload as UploadedImage;
};
