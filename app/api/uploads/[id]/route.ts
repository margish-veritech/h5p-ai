import { ALLOWED_IMAGE_TYPES, UPLOAD_DIR } from "@/lib/uploads";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const filename = path.basename(params.id);
  const extension = path.extname(filename).toLowerCase();
  const mime = MIME_BY_EXTENSION[extension];

  if (!mime || !ALLOWED_IMAGE_TYPES.has(mime)) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  try {
    const bytes = await readFile(path.join(UPLOAD_DIR, filename));

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }
}
