/// <reference lib="webworker" />

import { SUPPORTED_DOCUMENT_FORMATS, type DocumentFormat } from "../input/document-input";
import { prevalidateDocument } from "../input/preflight/document";
import { failedPreflight } from "../input/preflight/result";

interface PreflightRequest {
  readonly kind: "preflight";
  readonly format: DocumentFormat;
  readonly buffer: ArrayBuffer;
}

function isRequest(value: unknown): value is PreflightRequest {
  if (typeof value !== "object" || value === null) return false;
  const format = Reflect.get(value, "format");
  return Object.keys(value).sort().join("\0") === "buffer\0format\0kind"
    && Reflect.get(value, "kind") === "preflight"
    && SUPPORTED_DOCUMENT_FORMATS.some((item) => item === format)
    && Reflect.get(value, "buffer") instanceof ArrayBuffer;
}

self.onmessage = async (event: MessageEvent<unknown>) => {
  if (!isRequest(event.data)) {
    self.postMessage(failedPreflight("archive_malformed"));
    return;
  }
  const bytes = new Uint8Array(event.data.buffer);
  try {
    self.postMessage(await prevalidateDocument(event.data.format, event.data.buffer));
  } finally {
    bytes.fill(0);
  }
};
