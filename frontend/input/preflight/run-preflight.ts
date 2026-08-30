import type { SelectedDocument } from "../document-input";
import { failedPreflight, isPreflightResult, type PreflightResult } from "./result";

export const PREFLIGHT_TIMEOUT_MS = 10_000;
type WorkerFactory = () => Worker;

function defaultWorker(): Worker {
  return new Worker(new URL("../../workers/parser.worker.ts", import.meta.url), { type: "module" });
}

function executeWorker(
  document: SelectedDocument, buffer: ArrayBuffer, createWorker: WorkerFactory,
): Promise<PreflightResult> {
  const worker = createWorker();
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: PreflightResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };
    const timer = setTimeout(() => finish(failedPreflight("archive_limit")), PREFLIGHT_TIMEOUT_MS);
    worker.onmessage = (event: MessageEvent<unknown>) => {
      finish(isPreflightResult(event.data) ? event.data : failedPreflight("archive_malformed"));
    };
    worker.onerror = (event) => {
      event.preventDefault();
      finish(failedPreflight("archive_malformed"));
    };
    try {
      worker.postMessage({ kind: "preflight", format: document.format, buffer }, [buffer]);
    } catch {
      finish(failedPreflight("archive_malformed"));
    }
  });
}

export async function runDocumentPreflight(
  document: SelectedDocument, createWorker: WorkerFactory = defaultWorker,
): Promise<PreflightResult> {
  let buffer: ArrayBuffer;
  try {
    buffer = await document.file.arrayBuffer();
  } catch {
    return failedPreflight("size_invalid");
  }
  if (buffer.byteLength !== document.byteLength) return failedPreflight("size_invalid");
  try {
    return await executeWorker(document, buffer, createWorker);
  } catch {
    return failedPreflight("archive_malformed");
  }
}
