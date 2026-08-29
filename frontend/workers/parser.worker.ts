/// <reference lib="webworker" />

import { SUPPORTED_DOCUMENT_FORMATS, type DocumentFormat } from "../input/document-input";
import { prevalidateDocument } from "../input/preflight/document";
import { failedPreflight } from "../input/preflight/result";

interface PreflightRequest {
  readonly kind: "preflight";
  readonly format: DocumentFormat;
  readonly buffer: ArrayBuffer;
}

function isDocumentFormat(value: unknown): value is DocumentFormat {
  return typeof value === "string" && SUPPORTED_DOCUMENT_FORMATS.some((format) => format === value);
}

function isPreflightRequest(value: unknown): value is PreflightRequest {
  if (typeof value !== "object" || value === null) return false;
  const keys = Object.keys(value).sort();
  return keys.join("\0") === "buffer\0format\0kind"
    && Reflect.get(value, "kind") === "preflight"
    && isDocumentFormat(Reflect.get(value, "format"))
    && Reflect.get(value, "buffer") instanceof ArrayBuffer;
}

self.onmessage = async (event: MessageEvent<unknown>) => {
  if (!isPreflightRequest(event.data)) {
    self.postMessage(failedPreflight("archive_malformed"));
    return;
  }
  const result = await prevalidateDocument(event.data.format, event.data.buffer);
  self.postMessage(result);
};
