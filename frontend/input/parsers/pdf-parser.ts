import type { PyodideInterface } from "pyodide";

import {
  installPythonWheel,
  loadBrowserPython,
  loadPythonSource,
  type PythonAsset,
} from "./python-runtime";

export const MAX_PDF_PAGES = 500;
export const MAX_PDF_PAGE_CODE_POINTS = 100_000;
export const MAX_PDF_DOCUMENT_CODE_POINTS = 2_000_000;
const PDFMINER_WHEEL: PythonAsset = Object.freeze({
  path: "/pyodide/pdfminer_six-20260107-py3-none-any.whl",
  bytes: 6_592_252,
  sha256: "366585ba97e80dffa8f00cebe303d2f381884d8637af4ce422f1df3ef38111a9",
});
const PDF_PARSER_SOURCE: PythonAsset = Object.freeze({
  path: "/parser/pdf_parser.py",
  bytes: 1_587,
  sha256: "aa21f9484e13da62000db5a4994053cda1fdc49be47dc36f96f795b46c3b2a2c",
});

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

export async function parsePdf(buffer: ArrayBuffer): Promise<PdfParserResult> {
  const sourceBytes = new Uint8Array(buffer);
  let pyodide: PyodideInterface | undefined;
  let sourceWritten = false;
  try {
    pyodide = await loadBrowserPython(["cryptography", "charset-normalizer"]);
    await installPythonWheel(pyodide, PDFMINER_WHEEL);
    const parserSource = await loadPythonSource(PDF_PARSER_SOURCE);
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
