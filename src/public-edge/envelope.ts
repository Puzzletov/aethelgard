import {
  ALLOWED_FOCUS,
  ALLOWED_OUTPUTS,
  ANALYSIS_SCHEMA_VERSION,
  MAX_REQUESTED_OUTPUTS,
  MAX_SOURCE_RECORDS,
  MAX_TURNSTILE_TOKEN_CHARS,
} from "./config.ts";

const ENVELOPE_FIELDS = Object.freeze([
  "schema_version",
  "turnstile_token",
  "focus",
  "requested_outputs",
  "sources",
]);

export interface BasicAnalysisEnvelope {
  readonly schema_version: string;
  readonly turnstile_token: string;
  readonly focus: string;
  readonly requested_outputs: readonly string[];
  readonly sources: readonly Record<string, unknown>[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactFields(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);
  return keys.length === ENVELOPE_FIELDS.length && ENVELOPE_FIELDS.every((key) => key in value);
}

function hasAllowedOutputs(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_REQUESTED_OUTPUTS) {
    return false;
  }
  const outputs = value.filter((item): item is string => typeof item === "string");
  return outputs.length === value.length &&
    new Set(outputs).size === outputs.length &&
    outputs.every((output) => ALLOWED_OUTPUTS.includes(output as never));
}

function hasBoundedSources(value: unknown): boolean {
  return Array.isArray(value) &&
    value.length > 0 &&
    value.length <= MAX_SOURCE_RECORDS &&
    value.every(isRecord);
}

export function isBasicAnalysisEnvelope(value: unknown): value is BasicAnalysisEnvelope {
  if (!isRecord(value) || !hasExactFields(value)) return false;
  if (value.schema_version !== ANALYSIS_SCHEMA_VERSION) return false;
  if (typeof value.turnstile_token !== "string") return false;
  if (value.turnstile_token.length === 0 || value.turnstile_token.length > MAX_TURNSTILE_TOKEN_CHARS) {
    return false;
  }
  if (typeof value.focus !== "string" || !ALLOWED_FOCUS.includes(value.focus as never)) return false;
  return hasAllowedOutputs(value.requested_outputs) && hasBoundedSources(value.sources);
}
