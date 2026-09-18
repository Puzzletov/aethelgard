import { MustRedactLeakError, redactRequest } from "./redactor";

const KNOWN_FAILURES = new Set(["invalid_redaction_request", "mapping_limit", "redacted_output_limit",
  "must_redact_leak", "placeholder_limit"]);

function failureReason(error: unknown): string {
  return error instanceof Error && KNOWN_FAILURES.has(error.message) ? error.message : "transformation_error";
}

self.onmessage = (event: MessageEvent<unknown>): void => {
  try {
    self.postMessage(redactRequest(event.data));
  } catch (error) {
    self.postMessage({ schema_version: "1", ok: false, reason: failureReason(error),
      ...(error instanceof MustRedactLeakError ? { leak_diagnostic: error.diagnostic } : {}) });
  }
};
