/// <reference lib="webworker" />

import { SUPPORTED_DOCUMENT_FORMATS, type DocumentFormat } from "../input/document-input";
import { parseDocx } from "../input/parsers/docx-parser";
import { parsePdf } from "../input/parsers/pdf-parser";
import { parsePptx } from "../input/parsers/pptx-parser";
import { parseCsv, parseTxt } from "../input/parsers/text-parser";
import { parseXlsx } from "../input/parsers/xlsx-parser";
import { prevalidateDocument } from "../input/preflight/document";
import { failedPreflight } from "../input/preflight/result";

interface PreflightRequest {
  readonly kind: "preflight" | "parse_pdf" | "parse_docx" | "parse_pptx" | "parse_xlsx" | "parse_csv" | "parse_txt";
  readonly format: DocumentFormat;
  readonly buffer: ArrayBuffer;
}

const ALLOCATION_FAILURE = Object.freeze({ schema_version: "1", ok: false, reason: "allocation" });

function isDocumentFormat(value: unknown): value is DocumentFormat {
  return typeof value === "string" && SUPPORTED_DOCUMENT_FORMATS.some((format) => format === value);
}

function isPreflightRequest(value: unknown): value is PreflightRequest {
  if (typeof value !== "object" || value === null) return false;
  const keys = Object.keys(value).sort();
  const kind = Reflect.get(value, "kind");
  return keys.join("\0") === "buffer\0format\0kind"
    && (kind === "preflight" || kind === "parse_pdf" || kind === "parse_docx"
      || kind === "parse_pptx" || kind === "parse_xlsx" || kind === "parse_csv" || kind === "parse_txt")
    && isDocumentFormat(Reflect.get(value, "format"))
    && Reflect.get(value, "buffer") instanceof ArrayBuffer;
}

async function parseValidated(request: PreflightRequest) {
  if (request.kind === "parse_pdf" && request.format === "pdf") return parsePdf(request.buffer);
  if (request.kind === "parse_docx" && request.format === "docx") return parseDocx(request.buffer);
  if (request.kind === "parse_pptx" && request.format === "pptx") return parsePptx(request.buffer);
  if (request.kind === "parse_xlsx" && request.format === "xlsx") return parseXlsx(request.buffer);
  if (request.kind === "parse_csv" && request.format === "csv") return parseCsv(request.buffer);
  if (request.kind === "parse_txt" && request.format === "txt") return parseTxt(request.buffer);
  return failedPreflight("magic_invalid");
}

function isAllocationFailure(error: unknown): boolean {
  return error instanceof RangeError
    || error instanceof WebAssembly.RuntimeError && /memory|allocation|out of bounds/iu.test(error.message);
}

self.onmessage = async (event: MessageEvent<unknown>) => {
  if (!isPreflightRequest(event.data)) {
    self.postMessage(failedPreflight("archive_malformed"));
    return;
  }
  const bytes = new Uint8Array(event.data.buffer);
  try {
    const preflight = await prevalidateDocument(event.data.format, event.data.buffer);
    if (!preflight.ok || event.data.kind === "preflight") {
      self.postMessage(preflight);
      return;
    }
    self.postMessage(await parseValidated(event.data));
  } catch (error) {
    if (!isAllocationFailure(error)) throw error;
    self.postMessage(ALLOCATION_FAILURE);
  } finally {
    bytes.fill(0);
  }
};
