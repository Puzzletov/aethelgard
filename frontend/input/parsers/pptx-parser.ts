import type { PyodideInterface } from "pyodide";

import {
  installPythonWheel,
  loadBrowserPython,
  loadPythonSource,
  type PythonAsset,
} from "./python-runtime";

export const MAX_PPTX_SLIDES = 500;
export const MAX_PPTX_SLIDE_CODE_POINTS = 100_000;
export const MAX_PPTX_DOCUMENT_CODE_POINTS = 2_000_000;
const PYTHON_PPTX_WHEEL: PythonAsset = Object.freeze({
  path: "/pyodide/python_pptx-1.0.2-py3-none-any.whl",
  bytes: 472_788,
  sha256: "160838e0b8565a8b1f67947675886e9fea18aa5e795db7ae531606d68e785cba",
});
const PPTX_PARSER_SOURCE: PythonAsset = Object.freeze({
  path: "/parser/pptx_parser.py",
  bytes: 2_859,
  sha256: "1ef81ba346d2b8b706846a3430492417a48bd54f46afffaee18b0234f28241d3",
});
const UNUSED_PPTX_PACKAGE_DATA = Object.freeze([
  "/home/pyodide/pptx/templates/default.pptx",
  "/home/pyodide/pptx/templates/xlsx-icon.emf",
]);

export interface PptxSource {
  readonly slide: number;
  readonly content: string;
}

export type PptxParserResult =
  | Readonly<{ ok: true; format: "pptx"; sources: readonly PptxSource[] }>
  | Readonly<{ ok: false; code: "pptx_parse_failed"; message: string }>;

function failedPptxParse(): PptxParserResult {
  return Object.freeze({ ok: false, code: "pptx_parse_failed", message: "The PPTX text could not be read safely." });
}

function validateSource(value: unknown, previousSlide: number): PptxSource | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  if (Object.keys(value).sort().join("\0") !== "content\0slide") return undefined;
  const slide = Reflect.get(value, "slide");
  const content = Reflect.get(value, "content");
  if (!Number.isSafeInteger(slide) || Number(slide) <= previousSlide || Number(slide) > MAX_PPTX_SLIDES) return undefined;
  if (typeof content !== "string" || content.length === 0 || content.length > MAX_PPTX_SLIDE_CODE_POINTS) {
    return undefined;
  }
  return Object.freeze({ slide: Number(slide), content });
}

function validatePptxOutput(value: unknown): PptxParserResult {
  if (typeof value !== "object" || value === null) return failedPptxParse();
  if (Object.keys(value).sort().join("\0") !== "format\0schema_version\0sources") return failedPptxParse();
  const sources = Reflect.get(value, "sources");
  if (Reflect.get(value, "schema_version") !== "1" || Reflect.get(value, "format") !== "pptx") {
    return failedPptxParse();
  }
  if (!Array.isArray(sources) || sources.length === 0 || sources.length > MAX_PPTX_SLIDES) return failedPptxParse();
  const checked: PptxSource[] = [];
  let total = 0;
  let previousSlide = 0;
  for (const rawSource of sources) {
    const source = validateSource(rawSource, previousSlide);
    if (source === undefined) return failedPptxParse();
    total += source.content.length;
    if (total > MAX_PPTX_DOCUMENT_CODE_POINTS) return failedPptxParse();
    previousSlide = source.slide;
    checked.push(source);
  }
  return Object.freeze({ ok: true, format: "pptx", sources: Object.freeze(checked) });
}

function pruneUnusedPackageData(pyodide: PyodideInterface): void {
  for (const path of UNUSED_PPTX_PACKAGE_DATA) pyodide.FS.unlink(path);
}

export async function parsePptx(buffer: ArrayBuffer): Promise<PptxParserResult> {
  const sourceBytes = new Uint8Array(buffer);
  let pyodide: PyodideInterface | undefined;
  let sourceWritten = false;
  try {
    pyodide = await loadBrowserPython(["lxml", "typing-extensions"]);
    await installPythonWheel(pyodide, PYTHON_PPTX_WHEEL);
    pruneUnusedPackageData(pyodide);
    const parserSource = await loadPythonSource(PPTX_PARSER_SOURCE);
    pyodide.FS.writeFile("/tmp/aethelgard-source.pptx", sourceBytes);
    sourceWritten = true;
    const raw = await pyodide.runPythonAsync(parserSource);
    if (typeof raw !== "string" || raw.length > MAX_PPTX_DOCUMENT_CODE_POINTS + 200_000) return failedPptxParse();
    return validatePptxOutput(JSON.parse(raw));
  } catch {
    return failedPptxParse();
  } finally {
    if (sourceWritten && pyodide !== undefined) pyodide.FS.unlink("/tmp/aethelgard-source.pptx");
    sourceBytes.fill(0);
  }
}
