import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/extract/route";

const requestWith = (formData: FormData) =>
  new Request("http://localhost/api/extract", { method: "POST", body: formData });

describe("POST /api/extract", () => {
  it("returns canonical text and metadata for a text upload", async () => {
    const formData = new FormData();
    formData.append("pastedText", "Additional pasted context.");
    formData.append(
      "file",
      new File(
        ["The uploaded lesson explains evaporation and condensation in the water cycle."],
        "lesson.txt",
        { type: "text/plain" }
      )
    );

    const response = await POST(requestWith(formData));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.text).toContain("--- PASTED TEXT ---");
    expect(payload.text).toContain("--- FILE: lesson.txt ---");
    expect(payload.source.kind).toBe("mixed");
  });

  it("rejects multiple files and unsupported legacy Word with stable codes", async () => {
    const multiple = new FormData();
    multiple.append("file", new File(["one"], "one.txt", { type: "text/plain" }));
    multiple.append("file", new File(["two"], "two.txt", { type: "text/plain" }));
    const multipleResponse = await POST(requestWith(multiple));
    expect(multipleResponse.status).toBe(400);
    expect(await multipleResponse.json()).toMatchObject({ code: "MULTIPLE_FILES" });

    const multipleFields = new FormData();
    multipleFields.append("file", new File(["one"], "one.txt", { type: "text/plain" }));
    multipleFields.append("attachment", new File(["two"], "two.txt", { type: "text/plain" }));
    const multipleFieldsResponse = await POST(requestWith(multipleFields));
    expect(multipleFieldsResponse.status).toBe(400);
    expect(await multipleFieldsResponse.json()).toMatchObject({ code: "MULTIPLE_FILES" });

    const legacy = new FormData();
    legacy.append(
      "file",
      new File(["legacy Word bytes"], "lesson.doc", { type: "application/msword" })
    );
    const legacyResponse = await POST(requestWith(legacy));
    expect(legacyResponse.status).toBe(415);
    expect(await legacyResponse.json()).toMatchObject({ code: "UNSUPPORTED_FORMAT" });
  });
});
