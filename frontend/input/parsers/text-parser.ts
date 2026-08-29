import type { PyodideInterface } from "pyodide";

import { loadBrowserPython, loadPythonSource, type PythonAsset } from "./python-runtime";

export const MAX_TEXT_SOURCES = 100_000;
export const MAX_TEXT_SOURCE_CODE_POINTS = 100_000;
export const MAX_TEXT_DOCUMENT_CODE_POINTS = 2_000_000;
const MAX_TEXT_JSON_CODE_POINTS = 10_000_000;
const CSV_SOURCE: PythonAsset = Object.freeze({
  path: "/parser/csv_parser.py",
  bytes: 1_539,
  sha256: "a613b9e912609ee2ce8554eb81381e85575ec5794cea6a9833f024cb1ced58ea",
});
const TXT_SOURCE: PythonAsset = Object.freeze({
  path: "/parser/txt_parser.py",
  bytes: 1_215,
  sha256: "708dd2e757084478d7422c0261a493cbeccbd7015e053f8985c64296f2a14e7c",
});

export interface CsvSource {
  readonly row: number;
  readonly column: number;
  readonly content: string;
}

export interface TxtSource {
  readonly line_start: number;
  readonly line_end: number;
  readonly content: string;
}

export type CsvParserResult =
  | Readonly<{ ok: true; format: "csv"; sources: readonly CsvSource[] }>
  | Readonly<{ ok: false; code: "csv_parse_failed"; message: string }>;
export type TxtParserResult =
  | Readonly<{ ok: true; format: "txt"; sources: readonly TxtSource[] }>
  | Readonly<{ ok: false; code: "txt_parse_failed"; message: string }>;

function failedCsvParse(): CsvParserResult {
  return Object.freeze({ ok: false, code: "csv_parse_failed", message: "The CSV fields could not be read safely." });
}

function failedTxtParse(): TxtParserResult {
  return Object.freeze({ ok: false, code: "txt_parse_failed", message: "The text lines could not be read safely." });
}

function validContent(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_TEXT_SOURCE_CODE_POINTS;
}

function validateCsvSource(value: unknown, previous: CsvSource | undefined): CsvSource | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  if (Object.keys(value).sort().join("\0") !== "column\0content\0row") return undefined;
  const row = Reflect.get(value, "row");
  const column = Reflect.get(value, "column");
  const content = Reflect.get(value, "content");
  if (!Number.isSafeInteger(row) || Number(row) < 1 || Number(row) > 100_000) return undefined;
  if (!Number.isSafeInteger(column) || Number(column) < 1 || Number(column) > 1_000) return undefined;
  if (!validContent(content)) return undefined;
  if (previous !== undefined && (Number(row) < previous.row
    || (Number(row) === previous.row && Number(column) <= previous.column))) return undefined;
  return Object.freeze({ row: Number(row), column: Number(column), content });
}

function validateTxtSource(value: unknown, previousEnd: number): TxtSource | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  if (Object.keys(value).sort().join("\0") !== "content\0line_end\0line_start") return undefined;
  const start = Reflect.get(value, "line_start");
  const end = Reflect.get(value, "line_end");
  const content = Reflect.get(value, "content");
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) return undefined;
  if (Number(start) <= previousEnd || Number(end) < Number(start) || Number(end) > 200_000) return undefined;
  if (!validContent(content)) return undefined;
  return Object.freeze({ line_start: Number(start), line_end: Number(end), content });
}

function validateEnvelope(value: unknown, format: "csv" | "txt"): readonly unknown[] | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  if (Object.keys(value).sort().join("\0") !== "format\0schema_version\0sources") return undefined;
  const sources = Reflect.get(value, "sources");
  if (Reflect.get(value, "schema_version") !== "1" || Reflect.get(value, "format") !== format) return undefined;
  if (!Array.isArray(sources) || sources.length === 0 || sources.length > MAX_TEXT_SOURCES) return undefined;
  return sources;
}

function validateCsvOutput(value: unknown): CsvParserResult {
  const sources = validateEnvelope(value, "csv");
  if (sources === undefined) return failedCsvParse();
  const checked: CsvSource[] = [];
  let total = 0;
  for (const rawSource of sources) {
    const source = validateCsvSource(rawSource, checked.at(-1));
    if (source === undefined) return failedCsvParse();
    total += source.content.length;
    if (total > MAX_TEXT_DOCUMENT_CODE_POINTS) return failedCsvParse();
    checked.push(source);
  }
  return Object.freeze({ ok: true, format: "csv", sources: Object.freeze(checked) });
}

function validateTxtOutput(value: unknown): TxtParserResult {
  const sources = validateEnvelope(value, "txt");
  if (sources === undefined) return failedTxtParse();
  const checked: TxtSource[] = [];
  let total = 0;
  for (const rawSource of sources) {
    const source = validateTxtSource(rawSource, checked.at(-1)?.line_end ?? 0);
    if (source === undefined) return failedTxtParse();
    total += source.content.length;
    if (total > MAX_TEXT_DOCUMENT_CODE_POINTS) return failedTxtParse();
    checked.push(source);
  }
  return Object.freeze({ ok: true, format: "txt", sources: Object.freeze(checked) });
}

async function runTextParser(format: "csv" | "txt", buffer: ArrayBuffer): Promise<unknown> {
  const sourceBytes = new Uint8Array(buffer);
  const path = `/tmp/aethelgard-source.${format}`;
  let pyodide: PyodideInterface | undefined;
  let sourceWritten = false;
  try {
    pyodide = await loadBrowserPython([]);
    const parserSource = await loadPythonSource(format === "csv" ? CSV_SOURCE : TXT_SOURCE);
    pyodide.FS.writeFile(path, sourceBytes);
    sourceWritten = true;
    const raw = await pyodide.runPythonAsync(parserSource);
    if (typeof raw !== "string" || raw.length > MAX_TEXT_JSON_CODE_POINTS) return undefined;
    return JSON.parse(raw);
  } catch {
    return undefined;
  } finally {
    if (sourceWritten && pyodide !== undefined) pyodide.FS.unlink(path);
    sourceBytes.fill(0);
  }
}

export async function parseCsv(buffer: ArrayBuffer): Promise<CsvParserResult> {
  return validateCsvOutput(await runTextParser("csv", buffer));
}

export async function parseTxt(buffer: ArrayBuffer): Promise<TxtParserResult> {
  return validateTxtOutput(await runTextParser("txt", buffer));
}
