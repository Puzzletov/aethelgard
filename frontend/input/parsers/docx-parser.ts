import type { PyodideInterface } from "pyodide";

import {
  installPythonWheel,
  loadBrowserPython,
  loadPythonSource,
  type PythonAsset,
} from "./python-runtime";

export const MAX_DOCX_SOURCES = 20_000;
export const MAX_DOCX_SOURCE_CODE_POINTS = 100_000;
export const MAX_DOCX_DOCUMENT_CODE_POINTS = 2_000_000;
const PYTHON_DOCX_WHEEL: PythonAsset = Object.freeze({
  path: "/pyodide/python_docx-1.2.0-py3-none-any.whl",
  bytes: 252_987,
  sha256: "3fd478f3250fbbbfd3b94fe1e985955737c145627498896a8a6bf81f4baf66c7",
});
const DOCX_PARSER_SOURCE: PythonAsset = Object.freeze({
  path: "/parser/docx_parser.py",
  bytes: 2_750,
  sha256: "18a15677cc8b88f4433dc3d4c1388213b0eec3edf943d26105c5a4615f45bc0c",
});

export type DocxSource =
  | Readonly<{ kind: "paragraph"; paragraph: number; content: string }>
  | Readonly<{ kind: "table_cell"; table: number; row: number; column: number; content: string }>;

export type DocxParserResult =
  | Readonly<{ ok: true; schema_version: "1"; format: "docx"; sources: readonly DocxSource[] }>
  | Readonly<{ ok: false; code: "docx_parse_failed"; message: string }>;

function failedDocxParse(): DocxParserResult {
  return Object.freeze({ ok: false, code: "docx_parse_failed", message: "The DOCX text could not be read safely." });
}

function positiveIndex(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function validateParagraph(value: object, content: string): DocxSource | undefined {
  if (Object.keys(value).sort().join("\0") !== "content\0kind\0paragraph") return undefined;
  const paragraph = Reflect.get(value, "paragraph");
  if (Reflect.get(value, "kind") !== "paragraph" || !positiveIndex(paragraph)) return undefined;
  return Object.freeze({ kind: "paragraph", paragraph, content });
}

function validateTableCell(value: object, content: string): DocxSource | undefined {
  if (Object.keys(value).sort().join("\0") !== "column\0content\0kind\0row\0table") return undefined;
  const table = Reflect.get(value, "table");
  const row = Reflect.get(value, "row");
  const column = Reflect.get(value, "column");
  if (Reflect.get(value, "kind") !== "table_cell"
    || !positiveIndex(table) || !positiveIndex(row) || !positiveIndex(column)) return undefined;
  return Object.freeze({ kind: "table_cell", table, row, column, content });
}

function validateSource(value: unknown): DocxSource | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const content = Reflect.get(value, "content");
  if (typeof content !== "string" || content.length === 0 || content.length > MAX_DOCX_SOURCE_CODE_POINTS) {
    return undefined;
  }
  return Reflect.get(value, "kind") === "paragraph"
    ? validateParagraph(value, content)
    : validateTableCell(value, content);
}

function validateDocxOutput(value: unknown): DocxParserResult {
  if (typeof value !== "object" || value === null) return failedDocxParse();
  if (Object.keys(value).sort().join("\0") !== "format\0schema_version\0sources") return failedDocxParse();
  const sources = Reflect.get(value, "sources");
  if (Reflect.get(value, "schema_version") !== "1" || Reflect.get(value, "format") !== "docx") {
    return failedDocxParse();
  }
  if (!Array.isArray(sources) || sources.length === 0 || sources.length > MAX_DOCX_SOURCES) return failedDocxParse();
  const checked: DocxSource[] = [];
  let total = 0;
  for (const valueSource of sources) {
    const source = validateSource(valueSource);
    if (source === undefined) return failedDocxParse();
    total += source.content.length;
    if (total > MAX_DOCX_DOCUMENT_CODE_POINTS) return failedDocxParse();
    checked.push(source);
  }
  return Object.freeze({ ok: true, schema_version: "1", format: "docx", sources: Object.freeze(checked) });
}

export async function parseDocx(buffer: ArrayBuffer): Promise<DocxParserResult> {
  const sourceBytes = new Uint8Array(buffer);
  let pyodide: PyodideInterface | undefined;
  let sourceWritten = false;
  try {
    pyodide = await loadBrowserPython(["lxml", "typing-extensions"]);
    await installPythonWheel(pyodide, PYTHON_DOCX_WHEEL);
    const parserSource = await loadPythonSource(DOCX_PARSER_SOURCE);
    pyodide.FS.writeFile("/tmp/aethelgard-source.docx", sourceBytes);
    sourceWritten = true;
    const raw = await pyodide.runPythonAsync(parserSource);
    if (typeof raw !== "string" || raw.length > MAX_DOCX_DOCUMENT_CODE_POINTS + 500_000) return failedDocxParse();
    return validateDocxOutput(JSON.parse(raw));
  } catch {
    return failedDocxParse();
  } finally {
    if (sourceWritten && pyodide !== undefined) pyodide.FS.unlink("/tmp/aethelgard-source.docx");
    sourceBytes.fill(0);
  }
}
