import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { basename, dirname, delimiter, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mode = process.argv[2] ?? "dev";

if (!new Set(["dev", "production"]).has(mode)) {
  throw new Error("Usage: npm run test:pdf-runtime -- dev|production");
}

const getAvailablePort = () =>
  new Promise((resolvePort, reject) => {
    const listener = createServer();
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", () => {
      const address = listener.address();
      if (!address || typeof address === "string") {
        listener.close();
        reject(new Error("Could not allocate a local port"));
        return;
      }
      listener.close(() => resolvePort(address.port));
    });
  });

const waitForServer = async (url, server, serverLog) => {
  const deadline = Date.now() + 45_000;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Next server exited early (${server.exitCode}).\n${serverLog()}`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // The server is still starting.
    }

    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }

  throw new Error(`Next server did not become ready.\n${serverLog()}`);
};

const postPdf = async (baseUrl, name, buffer) => {
  const formData = new FormData();
  formData.append("file", new Blob([buffer], { type: "application/pdf" }), name);
  const response = await fetch(`${baseUrl}/api/extract`, { method: "POST", body: formData });
  return { status: response.status, payload: await response.json() };
};

const expectCase = (label, result, status, code) => {
  if (result.status !== status || (code && result.payload.code !== code)) {
    throw new Error(
      `${label}: expected ${status}${code ? `/${code}` : ""}, received ` +
        `${result.status}/${result.payload.code ?? "success"}: ${JSON.stringify(result.payload)}`
    );
  }
  console.log(`${label}: ${result.status}/${result.payload.code ?? "success"}`);
};

const pdfEscape = (value) =>
  value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");

const createPdf = (text) => {
  const content = text
    ? `BT\n/F1 12 Tf\n72 720 Td\n(${pdfEscape(text)}) Tj\nET\n`
    : "";
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}endstream\nendobj\n`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += object;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "ascii");
};

const stopServer = async (server) => {
  if (server.exitCode !== null) {
    return;
  }

  server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolveExit) => server.once("exit", resolveExit)),
    new Promise((resolveWait) => setTimeout(resolveWait, 5_000))
  ]);
  if (server.exitCode === null) {
    server.kill("SIGKILL");
  }
};

const port = await getAvailablePort();
const baseUrl = `http://127.0.0.1:${port}`;
const nextBin = resolve(root, "node_modules/next/dist/bin/next");
const nextCommand = mode === "production" ? "start" : "dev";
const server = spawn(process.execPath, [nextBin, nextCommand, "-p", String(port)], {
  cwd: root,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  stdio: ["ignore", "pipe", "pipe"]
});
let output = "";
const capture = (chunk) => {
  output = `${output}${chunk}`.slice(-12_000);
};
server.stdout.on("data", capture);
server.stderr.on("data", capture);

try {
  await waitForServer(baseUrl, server, () => output);

  for (const [name, expectedText] of [
    ["quartz-text.pdf", "Photosynthesis"],
    ["chrome-text.pdf", "Evaporation"]
  ]) {
    const result = await postPdf(baseUrl, name, await readFile(resolve(root, "tests/fixtures", name)));
    expectCase(name, result, 200);
    if (!result.payload.text?.includes(expectedText)) {
      throw new Error(`${name}: successful response did not include expected extracted text`);
    }
  }

  expectCase(
    "encrypted PDF",
    await postPdf(
      baseUrl,
      "encrypted.pdf",
      await readFile(resolve(root, "tests/fixtures/encrypted-attachment.pdf"))
    ),
    422,
    "ENCRYPTED_DOCUMENT"
  );
  expectCase(
    "corrupt PDF",
    await postPdf(baseUrl, "corrupt.pdf", Buffer.from("%PDF-1.4\nnot a valid PDF\n", "ascii")),
    422,
    "CORRUPT_DOCUMENT"
  );
  expectCase(
    "scan-only PDF",
    await postPdf(baseUrl, "scan-only.pdf", createPdf("")),
    422,
    "NO_READABLE_TEXT"
  );

  for (const path of (process.env.PDF_RUNTIME_EXTRA_FIXTURES ?? "")
    .split(delimiter)
    .filter(Boolean)) {
    const result = await postPdf(baseUrl, basename(path), await readFile(path));
    if (result.status !== 200 && result.payload.code !== "TOO_MANY_PAGES") {
      throw new Error(`system fixture ${path} failed: ${JSON.stringify(result)}`);
    }
    console.log(`system fixture ${path}: ${result.status}/${result.payload.code ?? "success"}`);
  }
} finally {
  await stopServer(server);
}
