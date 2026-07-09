"use client";

import { useRef, useState } from "react";
import { uploadImageFile } from "@/lib/uploadImage";
import type { UploadedImage } from "@/lib/types";

type ImageUploadFieldProps = {
  label: string;
  image: UploadedImage | null | undefined;
  defaultAlt?: string;
  onChange: (image: UploadedImage | null) => void;
};

export function ImageUploadField({
  label,
  image,
  defaultAlt = "",
  onChange
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const uploaded = await uploadImageFile(file, defaultAlt || file.name);
      onChange(uploaded);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Image upload failed."
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="field-label mb-0">{label}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary h-9 px-3 text-xs"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? "Uploading..." : image ? "Replace image" : "Upload image"}
          </button>
          {image ? (
            <button
              type="button"
              className="btn-secondary h-9 px-3 text-xs text-red-700"
              onClick={() => onChange(null)}
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {image ? (
        <div className="overflow-hidden rounded-xl border border-line bg-stone-50/80 p-3">
          <img
            src={image.url}
            alt={image.alt}
            className="max-h-48 w-full rounded-lg object-contain"
          />
          <p className="mt-2 text-xs text-muted">
            {image.originalName} · {image.width}×{image.height}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-line bg-stone-50/60 px-4 py-6 text-center text-sm text-muted">
          JPG, PNG, or WebP up to 5 MB
        </div>
      )}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
