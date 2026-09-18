import type { MustRedactDiagnostic, RedactionRequest, RedactionResult } from "./redactor";
import {
  isSourceReference,
  MAX_NORMALIZED_DOCUMENT_CODE_POINTS,
  MAX_NORMALIZED_SOURCE_CODE_POINTS,
  MAX_NORMALIZED_SOURCES,
} from "../normalization/source-record";

export const REDACTION_TIMEOUT_MS = 10_000;

export type RedactionFailureReason = "worker_start" | "timeout" | "crash" | "post_failed"
  | "invalid_result" | "invalid_redaction_request" | "mapping_limit"
  | "redacted_output_limit" | "must_redact_leak" | "placeholder_limit" | "transformation_error";

export interface RedactionSafeMode {
  readonly schema_version: "1";
  readonly ok: false;
  readonly category: "privacy";
  readonly code: "redaction_failed";
  readonly message: "Private information could not be removed safely.";
  readonly retry: "fresh_document";
  readonly diagnostic_reason: RedactionFailureReason;
  readonly leak_diagnostic?: MustRedactDiagnostic;
}

export type RedactionOperationResult = RedactionResult | RedactionSafeMode;
type WorkerFactory = () => Worker;

function safeMode(
  diagnosticReason: RedactionFailureReason, leakDiagnostic?: MustRedactDiagnostic,
): RedactionSafeMode {
  return Object.freeze({
  schema_version: "1", ok: false, category: "privacy", code: "redaction_failed",
    message: "Private information could not be removed safely.", retry: "fresh_document",
    diagnostic_reason: diagnosticReason,
    ...(leakDiagnostic === undefined ? {} : { leak_diagnostic: leakDiagnostic }),
  });
}

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

function validLeak(value: unknown): value is MustRedactDiagnostic {
  if (!isRecord(value) || Object.keys(value).sort().join("\0") !== "completed_replacement_count\0match_representation\0must_redact_origin\0must_redact_rule\0planned_replacement_count\0post_transform_match_count\0pre_transform_match_count\0span_alignment") return false;
  const counts = [value.pre_transform_match_count, value.planned_replacement_count,
    value.completed_replacement_count, value.post_transform_match_count];
  return ["EMAIL", "PHONE", "CUSTOMER_ID", "PAYMENT_CARD", "ADDRESS", "PERSON", "ORGANIZATION", "LOCATION"]
    .includes(String(value.must_redact_rule))
    && ["deterministic_pattern", "entity_detector"].includes(String(value.must_redact_origin))
    && counts.every((count) => Number.isSafeInteger(count) && Number(count) >= 0 && Number(count) <= 2_000_000)
    && value.match_representation === "transformed" && ["exact", "mismatch"].includes(String(value.span_alignment));
}

function workerFailure(value: unknown): Readonly<{
  reason: RedactionFailureReason; leak?: MustRedactDiagnostic;
}> | undefined {
  if (!isRecord(value) || !["ok\0reason\0schema_version", "leak_diagnostic\0ok\0reason\0schema_version"]
    .includes(Object.keys(value).sort().join("\0"))
    || value.schema_version !== "1" || value.ok !== false || typeof value.reason !== "string") return undefined;
  const reasons = new Set<RedactionFailureReason>(["invalid_redaction_request", "mapping_limit",
    "redacted_output_limit", "must_redact_leak", "placeholder_limit", "transformation_error"]);
  if (!reasons.has(value.reason as RedactionFailureReason)) return undefined;
  if (value.leak_diagnostic !== undefined && !validLeak(value.leak_diagnostic)) return undefined;
  return Object.freeze({ reason: value.reason as RedactionFailureReason,
    ...(value.leak_diagnostic === undefined ? {} : { leak: value.leak_diagnostic }) });
}

export function runRedactionWorker(
  request: RedactionRequest, createWorker: WorkerFactory = defaultWorker,
): Promise<RedactionOperationResult> {
  return new Promise((resolve) => {
    let worker: Worker;
    try { worker = createWorker(); } catch { resolve(safeMode("worker_start")); return; }
    let settled = false;
    const finish = (result: RedactionOperationResult): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };
    const timer = setTimeout(() => finish(safeMode("timeout")), REDACTION_TIMEOUT_MS);
    worker.onmessage = (event: MessageEvent<unknown>) => {
      const failure = workerFailure(event.data);
      finish(isResult(event.data) ? event.data : safeMode(failure?.reason ?? "invalid_result", failure?.leak));
    };
    worker.onerror = (event) => {
      event.preventDefault();
      finish(safeMode("crash"));
    };
    try { worker.postMessage(request); } catch { finish(safeMode("post_failed")); }
  });
}
