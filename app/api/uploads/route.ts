import {
  ALLOWED_IMAGE_TYPES,
  buildH5pImagePath,
  ensureUploadDir,
  extensionForMime,
  MAX_UPLOAD_BYTES,
  uploadFilePath
} from "@/lib/uploads";
import type { UploadedImage } from "@/lib/types";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { NextResponse } from "next/server";

const parseDimension = (value: FormDataEntryValue | null) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const width = parseDimension(formData.get("width"));
    const height = parseDimension(formData.get("height"));
    const altValue = formData.get("alt");
    const alt = typeof altValue === "string" ? altValue.trim() : "";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, and WebP images are supported." },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Image must be 5 MB or smaller." },
        { status: 400 }
      );
    }

    if (!width || !height) {
      return NextResponse.json(
        { error: "Valid image dimensions are required." },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const mime = file.type;

    await ensureUploadDir();
    await writeFile(uploadFilePath(id, mime), Buffer.from(await file.arrayBuffer()));

    const image: UploadedImage = {
      id,
      originalName: file.name,
      mime,
      width,
      height,
      alt: alt || file.name,
      h5pPath: buildH5pImagePath(id, mime),
      url: `/api/uploads/${id}${extensionForMime(mime)}`
    };

    return NextResponse.json(image);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image upload failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
