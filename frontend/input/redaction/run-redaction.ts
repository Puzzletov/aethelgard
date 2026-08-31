import type { RedactionRequest, RedactionResult } from "./redactor";
import {
  isSourceReference,
  MAX_NORMALIZED_DOCUMENT_CODE_POINTS,
  MAX_NORMALIZED_SOURCE_CODE_POINTS,
  MAX_NORMALIZED_SOURCES,
} from "../normalization/source-record";

export const REDACTION_TIMEOUT_MS = 10_000;

export interface RedactionSafeMode {
  readonly schema_version: "1";
  readonly ok: false;
  readonly category: "privacy";
  readonly code: "redaction_failed";
  readonly message: "Private information could not be removed safely.";
  readonly retry: "fresh_document";
}

export type RedactionOperationResult = RedactionResult | RedactionSafeMode;
type WorkerFactory = () => Worker;

const SAFE_MODE: RedactionSafeMode = Object.freeze({
  schema_version: "1", ok: false, category: "privacy", code: "redaction_failed",
  message: "Private information could not be removed safely.", retry: "fresh_document",
});

function defaultWorker(): Worker {
  return new Worker(new URL("./redaction-worker.ts", import.meta.url), { type: "module" });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sourcePoints(value: unknown, ordinal: number): number | undefined {
  if (!isRecord(value) || Object.keys(value).sort().join("\0") !== "content\0ordinal\0reference\0schema_version"
    || value.schema_version !== "1" || value.ordinal !== ordinal || !isSourceReference(value.reference)
    || typeof value.content !== "string" || value.content.length === 0) return undefined;
  let points = 0;
  for (const _codePoint of value.content) {
    points += 1;
    if (points > MAX_NORMALIZED_SOURCE_CODE_POINTS) return undefined;
  }
  return points;
}

function validSources(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_NORMALIZED_SOURCES) return false;
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    const points = sourcePoints(value[index], index + 1);
    if (points === undefined) return false;
    total += points;
    if (total > MAX_NORMALIZED_DOCUMENT_CODE_POINTS) return false;
  }
  return true;
}

function isResult(value: unknown): value is RedactionResult {
  if (!isRecord(value)) return false;
  const record = value;
  return Object.keys(record).sort().join("\0") === "must_redact_leaks\0placeholder_count\0schema_version\0sources"
    && record.schema_version === "1" && record.must_redact_leaks === 0
    && Number.isSafeInteger(record.placeholder_count) && Number(record.placeholder_count) >= 0
    && Number(record.placeholder_count) <= 10_000 && validSources(record.sources);
}

export function runRedactionWorker(
  request: RedactionRequest, createWorker: WorkerFactory = defaultWorker,
): Promise<RedactionOperationResult> {
  return new Promise((resolve) => {
    let worker: Worker;
    try { worker = createWorker(); } catch { resolve(SAFE_MODE); return; }
    let settled = false;
    const finish = (result: RedactionOperationResult): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };
    const timer = setTimeout(() => finish(SAFE_MODE), REDACTION_TIMEOUT_MS);
    worker.onmessage = (event: MessageEvent<unknown>) => finish(isResult(event.data) ? event.data : SAFE_MODE);
    worker.onerror = (event) => {
      event.preventDefault();
      finish(SAFE_MODE);
    };
    try { worker.postMessage(request); } catch { finish(SAFE_MODE); }
  });
}
