import type { PyodideInterface } from "pyodide";

import {
  installPythonWheel,
  loadBrowserPython,
  loadPythonSource,
  type PythonAsset,
} from "./python-runtime";

export const MAX_XLSX_SHEETS = 200;
export const MAX_XLSX_SOURCES = 100_000;
export const MAX_XLSX_SOURCE_CODE_POINTS = 100_000;
export const MAX_XLSX_DOCUMENT_CODE_POINTS = 2_000_000;
const ET_XMLFILE_WHEEL: PythonAsset = Object.freeze({
  path: "/pyodide/et_xmlfile-2.0.0-py3-none-any.whl",
  bytes: 18_059,
  sha256: "7a91720bc756843502c3b7504c77b8fe44217c85c537d85037f0f536151b2caa",
});
const OPENPYXL_WHEEL: PythonAsset = Object.freeze({
  path: "/pyodide/openpyxl-3.1.5-py2.py3-none-any.whl",
  bytes: 250_910,
  sha256: "5282c12b107bffeef825f4617dc029afaf41d0ea60823bbb665ef3079dc79de2",
});
const XLSX_PARSER_SOURCE: PythonAsset = Object.freeze({
  path: "/parser/xlsx_parser.py",
  bytes: 2_722,
  sha256: "0f2f1a723e2b1799c5fcaa6df8579fb27c25445301482a552baadeca7837d2bc",
});

export interface XlsxSource {
  readonly sheet: number;
  readonly cell: string;
  readonly content: string;
}

export type XlsxParserResult =
  | Readonly<{ ok: true; format: "xlsx"; sources: readonly XlsxSource[] }>
  | Readonly<{ ok: false; code: "xlsx_parse_failed"; message: string }>;

function failedXlsxParse(): XlsxParserResult {
  return Object.freeze({ ok: false, code: "xlsx_parse_failed", message: "The XLSX cells could not be read safely." });
}

function validateSource(value: unknown): XlsxSource | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  if (Object.keys(value).sort().join("\0") !== "cell\0content\0sheet") return undefined;
  const sheet = Reflect.get(value, "sheet");
  const cell = Reflect.get(value, "cell");
  const content = Reflect.get(value, "content");
  if (!Number.isSafeInteger(sheet) || Number(sheet) < 1 || Number(sheet) > MAX_XLSX_SHEETS) return undefined;
  if (typeof cell !== "string" || !/^[A-Z]{1,3}[1-9][0-9]{0,5}$/.test(cell)) return undefined;
  if (typeof content !== "string" || content.length === 0 || content.length > MAX_XLSX_SOURCE_CODE_POINTS) {
    return undefined;
  }
  return Object.freeze({ sheet: Number(sheet), cell, content });
}

function validateXlsxOutput(value: unknown): XlsxParserResult {
  if (typeof value !== "object" || value === null) return failedXlsxParse();
  if (Object.keys(value).sort().join("\0") !== "format\0schema_version\0sources") return failedXlsxParse();
  const sources = Reflect.get(value, "sources");
  if (Reflect.get(value, "schema_version") !== "1" || Reflect.get(value, "format") !== "xlsx") {
    return failedXlsxParse();
  }
  if (!Array.isArray(sources) || sources.length === 0 || sources.length > MAX_XLSX_SOURCES) return failedXlsxParse();
  const checked: XlsxSource[] = [];
  let total = 0;
  for (const rawSource of sources) {
    const source = validateSource(rawSource);
    if (source === undefined) return failedXlsxParse();
    total += source.content.length;
    if (total > MAX_XLSX_DOCUMENT_CODE_POINTS) return failedXlsxParse();
    checked.push(source);
  }
  return Object.freeze({ ok: true, format: "xlsx", sources: Object.freeze(checked) });
}

export async function parseXlsx(buffer: ArrayBuffer): Promise<XlsxParserResult> {
  const sourceBytes = new Uint8Array(buffer);
  let pyodide: PyodideInterface | undefined;
  let sourceWritten = false;
  try {
    pyodide = await loadBrowserPython([]);
    await installPythonWheel(pyodide, ET_XMLFILE_WHEEL);
    await installPythonWheel(pyodide, OPENPYXL_WHEEL);
    const parserSource = await loadPythonSource(XLSX_PARSER_SOURCE);
    pyodide.FS.writeFile("/tmp/aethelgard-source.xlsx", sourceBytes);
    sourceWritten = true;
    const raw = await pyodide.runPythonAsync(parserSource);
    if (typeof raw !== "string" || raw.length > MAX_XLSX_DOCUMENT_CODE_POINTS + 4_000_000) return failedXlsxParse();
    return validateXlsxOutput(JSON.parse(raw));
  } catch {
    return failedXlsxParse();
  } finally {
    if (sourceWritten && pyodide !== undefined) pyodide.FS.unlink("/tmp/aethelgard-source.xlsx");
    sourceBytes.fill(0);
  }
}
