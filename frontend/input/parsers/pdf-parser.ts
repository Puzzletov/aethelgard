import { loadPyodide, type PyodideInterface } from "pyodide";

export const MAX_PDF_PAGES = 500;
export const MAX_PDF_PAGE_CODE_POINTS = 100_000;
export const MAX_PDF_DOCUMENT_CODE_POINTS = 2_000_000;
const PDFMINER_WHEEL = "pdfminer_six-20260107-py3-none-any.whl";
const PDFMINER_WHEEL_BYTES = 6_592_252;
const PDFMINER_WHEEL_SHA256 = "366585ba97e80dffa8f00cebe303d2f381884d8637af4ce422f1df3ef38111a9";
const PDF_PARSER_SOURCE_BYTES = 1_587;
const PDF_PARSER_SOURCE_SHA256 = "aa21f9484e13da62000db5a4994053cda1fdc49be47dc36f96f795b46c3b2a2c";
const MAX_ASSET_CHUNKS = 4_096;

export interface PdfPageText {
  readonly page: number;
  readonly content: string;
}

export type PdfParserResult =
  | Readonly<{ ok: true; format: "pdf"; pages: readonly PdfPageText[] }>
  | Readonly<{ ok: false; code: "pdf_parse_failed"; message: string }>;

function failedPdfParse(): PdfParserResult {
  return Object.freeze({ ok: false, code: "pdf_parse_failed", message: "The PDF text could not be read safely." });
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const input = Uint8Array.from(bytes);
  try {
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", input.buffer));
    return [...digest].map((value) => value.toString(16).padStart(2, "0")).join("");
  } finally {
    input.fill(0);
  }
}

async function fetchAsset(path: string, expectedBytes: number, expectedHash: string): Promise<Uint8Array> {
  const response = await fetch(new URL(path, self.location.origin), {
    cache: "force-cache",
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  if (!response.ok || response.body === null) throw new Error("parser_asset_unavailable");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let complete = false;
  try {
    for (let count = 0; count < MAX_ASSET_CHUNKS; count += 1) {
      const item = await reader.read();
      if (item.done) {
        complete = true;
        break;
      }
      total += item.value.byteLength;
      if (total > expectedBytes) throw new Error("parser_asset_size");
      chunks.push(item.value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  if (!complete || total !== expectedBytes) throw new Error("parser_asset_size");
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  if (await sha256(output) !== expectedHash) throw new Error("parser_asset_hash");
  return output;
}

async function loadPdfRuntime(): Promise<PyodideInterface> {
  const indexURL = new URL("/pyodide/", self.location.origin).href;
  return loadPyodide({
    indexURL,
    packages: ["cryptography", "charset-normalizer"],
    stdout: () => undefined,
    stderr: () => undefined,
  });
}

function validatePage(value: unknown, expectedPage: number): PdfPageText | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  if (Object.keys(value).sort().join("\0") !== "content\0page") return undefined;
  const page = Reflect.get(value, "page");
  const content = Reflect.get(value, "content");
  if (page !== expectedPage || typeof content !== "string" || content.length > MAX_PDF_PAGE_CODE_POINTS) {
    return undefined;
  }
  return Object.freeze({ page, content });
}

function validatePdfOutput(value: unknown): PdfParserResult {
  if (typeof value !== "object" || value === null) return failedPdfParse();
  if (Object.keys(value).sort().join("\0") !== "format\0pages\0schema_version") return failedPdfParse();
  const pages = Reflect.get(value, "pages");
  if (Reflect.get(value, "schema_version") !== "1" || Reflect.get(value, "format") !== "pdf") return failedPdfParse();
  if (!Array.isArray(pages) || pages.length === 0 || pages.length > MAX_PDF_PAGES) return failedPdfParse();
  const checked: PdfPageText[] = [];
  let total = 0;
  for (let index = 0; index < pages.length; index += 1) {
    const page = validatePage(pages[index], index + 1);
    if (page === undefined) return failedPdfParse();
    total += page.content.length;
    if (total > MAX_PDF_DOCUMENT_CODE_POINTS) return failedPdfParse();
    checked.push(page);
  }
  return Object.freeze({ ok: true, format: "pdf", pages: Object.freeze(checked) });
}

async function installPdfMiner(pyodide: PyodideInterface): Promise<void> {
  const wheel = await fetchAsset(`/pyodide/${PDFMINER_WHEEL}`, PDFMINER_WHEEL_BYTES, PDFMINER_WHEEL_SHA256);
  try {
    pyodide.unpackArchive(wheel, "wheel");
  } finally {
    wheel.fill(0);
  }
}

export async function parsePdf(buffer: ArrayBuffer): Promise<PdfParserResult> {
  const sourceBytes = new Uint8Array(buffer);
  let pyodide: PyodideInterface | undefined;
  let sourceWritten = false;
  try {
    pyodide = await loadPdfRuntime();
    await installPdfMiner(pyodide);
    const parserBytes = await fetchAsset("/parser/pdf_parser.py", PDF_PARSER_SOURCE_BYTES, PDF_PARSER_SOURCE_SHA256);
    const parserSource = new TextDecoder("utf-8", { fatal: true }).decode(parserBytes);
    parserBytes.fill(0);
    pyodide.FS.writeFile("/tmp/aethelgard-source.pdf", sourceBytes);
    sourceWritten = true;
    const raw = await pyodide.runPythonAsync(parserSource);
    if (typeof raw !== "string" || raw.length > MAX_PDF_DOCUMENT_CODE_POINTS + 100_000) return failedPdfParse();
    return validatePdfOutput(JSON.parse(raw));
  } catch {
    return failedPdfParse();
  } finally {
    if (sourceWritten && pyodide !== undefined) pyodide.FS.unlink("/tmp/aethelgard-source.pdf");
    sourceBytes.fill(0);
  }
}
