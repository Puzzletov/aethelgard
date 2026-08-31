export type PreflightFailureCode =
  | "size_invalid"
  | "magic_invalid"
  | "archive_malformed"
  | "archive_limit"
  | "archive_encrypted"
  | "archive_path"
  | "xml_unsafe"
  | "external_relationship"
  | "active_content"
  | "embedded_content"
  | "pdf_encrypted"
  | "pdf_active_content"
  | "text_invalid";

export type PreflightResult =
  | Readonly<{ ok: true; byteLength: number; archiveEntries: number }>
  | Readonly<{ ok: false; code: PreflightFailureCode; message: string }>;

const SAFE_MESSAGES = Object.freeze<Record<PreflightFailureCode, string>>({
  size_invalid: "The document size is invalid.",
  magic_invalid: "The document type does not match its content.",
  archive_malformed: "The document container is malformed.",
  archive_limit: "The document container exceeds a safety limit.",
  archive_encrypted: "Encrypted Office documents are not supported.",
  archive_path: "The document container has an unsafe path.",
  xml_unsafe: "The document contains unsafe XML.",
  external_relationship: "Documents with external relationships are not supported.",
  active_content: "Documents with macros or active content are not supported.",
  embedded_content: "Documents with embedded content are not supported.",
  pdf_encrypted: "Encrypted PDF documents are not supported.",
  pdf_active_content: "PDF documents with active or embedded content are not supported.",
  text_invalid: "The text document is not valid UTF-8 text.",
});
const FAILURE_CODES = Object.freeze(new Set(Object.keys(SAFE_MESSAGES)));
const MAX_RESULT_BYTES = 15 * 1024 * 1024;
const MAX_RESULT_ENTRIES = 512;

export class PreflightFailure extends Error {
  constructor(readonly code: PreflightFailureCode) {
    super(SAFE_MESSAGES[code]);
    this.name = "PreflightFailure";
  }
}

export function rejectedPreflight(error: PreflightFailure): PreflightResult {
  return Object.freeze({ ok: false, code: error.code, message: SAFE_MESSAGES[error.code] });
}

export function failedPreflight(code: PreflightFailureCode): PreflightResult {
  return rejectedPreflight(new PreflightFailure(code));
}

export function isPreflightResult(value: unknown): value is PreflightResult {
  if (typeof value !== "object" || value === null || typeof Reflect.get(value, "ok") !== "boolean") {
    return false;
  }
  if (Reflect.get(value, "ok") === true) {
    const byteLength = Reflect.get(value, "byteLength");
    const archiveEntries = Reflect.get(value, "archiveEntries");
    return Object.keys(value).sort().join("\0") === "archiveEntries\0byteLength\0ok"
      && typeof byteLength === "number" && Number.isSafeInteger(byteLength)
      && byteLength > 0 && byteLength <= MAX_RESULT_BYTES
      && typeof archiveEntries === "number" && Number.isSafeInteger(archiveEntries)
      && archiveEntries >= 0 && archiveEntries <= MAX_RESULT_ENTRIES;
  }
  const code = Reflect.get(value, "code");
  const message = Reflect.get(value, "message");
  return Object.keys(value).sort().join("\0") === "code\0message\0ok"
    && typeof code === "string" && FAILURE_CODES.has(code)
    && message === SAFE_MESSAGES[code as PreflightFailureCode];
}
