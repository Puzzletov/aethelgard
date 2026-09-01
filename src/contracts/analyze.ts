import { z } from "zod";

import {
  ALLOWED_FOCUS,
  ALLOWED_OUTPUTS,
  ANALYSIS_SCHEMA_VERSION,
  MAX_ANALYSIS_BODY_BYTES,
  MAX_REQUESTED_OUTPUTS,
  MAX_SOURCE_RECORDS,
  MAX_TURNSTILE_TOKEN_CHARS,
} from "../public-edge/config.ts";

const MAX_SOURCE_TEXT_CODE_POINTS = 100_000;
const MAX_SOURCE_REFERENCE_BYTES = 128;
const UTF8 = new TextEncoder();
const POSITIVE_INTEGER = z.number().int().positive().safe();
const CELL_REFERENCE = /^[A-Z]{1,3}[1-9][0-9]{0,5}$/u;
const STRUCTURED_PII = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,63}\b/iu,
  /\bCUST-[0-9]{6}\b/u,
  /\+[0-9][0-9 ()-]{6,28}[0-9]/u,
] as const;

function passesLuhn(value: string): boolean {
  const digits = value.replace(/[^0-9]/gu, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (double && (digit *= 2) > 9) digit -= 9;
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

function containsStructuredPii(value: string): boolean {
  if (STRUCTURED_PII.some((pattern) => pattern.test(value))) return true;
  for (const match of value.matchAll(/(?<![0-9])(?:[0-9][ -]?){13,19}(?![0-9])/gu)) {
    if (passesLuhn(match[0])) return true;
  }
  return false;
}

export const sourceReferenceSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("pdf_page"), page: POSITIVE_INTEGER }),
  z.strictObject({ kind: z.literal("docx_paragraph"), paragraph: POSITIVE_INTEGER }),
  z.strictObject({ kind: z.literal("docx_table_cell"), table: POSITIVE_INTEGER,
    row: POSITIVE_INTEGER, column: POSITIVE_INTEGER }),
  z.strictObject({ kind: z.literal("pptx_slide"), slide: POSITIVE_INTEGER }),
  z.strictObject({ kind: z.literal("xlsx_cell"), sheet: POSITIVE_INTEGER,
    cell: z.string().regex(CELL_REFERENCE) }),
  z.strictObject({ kind: z.literal("csv_field"), row: POSITIVE_INTEGER,
    column: POSITIVE_INTEGER }),
  z.strictObject({ kind: z.literal("txt_lines"), line_start: POSITIVE_INTEGER,
    line_end: POSITIVE_INTEGER }).refine((value) => value.line_end >= value.line_start),
]).refine((value) => UTF8.encode(JSON.stringify(value)).byteLength <= MAX_SOURCE_REFERENCE_BYTES);

export type SourceReference = z.output<typeof sourceReferenceSchema>;

const boundedRedactedText = z.string().min(1).refine(
  (value) => [...value].length <= MAX_SOURCE_TEXT_CODE_POINTS,
  "source_text_too_large",
).refine((value) => !containsStructuredPii(value), "unredacted_source");

export const normalizedSourceRecordSchema = z.strictObject({
  schema_version: z.literal(ANALYSIS_SCHEMA_VERSION),
  ordinal: POSITIVE_INTEGER,
  reference: sourceReferenceSchema,
  content: boundedRedactedText,
});

export type NormalizedSourceRecord = z.output<typeof normalizedSourceRecordSchema>;

function sourcesAreCanonical(sources: readonly z.infer<typeof normalizedSourceRecordSchema>[]): boolean {
  const references = new Set<string>();
  for (let index = 0; index < sources.length; index += 1) {
    if (sources[index].ordinal !== index + 1) return false;
    const reference = JSON.stringify(sources[index].reference);
    if (references.has(reference)) return false;
    references.add(reference);
  }
  return true;
}

const requestedOutputsSchema = z.array(z.enum(ALLOWED_OUTPUTS))
  .min(1).max(MAX_REQUESTED_OUTPUTS)
  .refine((values) => new Set(values).size === values.length, "duplicate_output")
  .refine((values) => values.every((value, index) => ALLOWED_OUTPUTS.indexOf(value)
    > (index === 0 ? -1 : ALLOWED_OUTPUTS.indexOf(values[index - 1]))), "output_order");

export const normalizedSourcesSchema = z.array(normalizedSourceRecordSchema)
  .min(1).max(MAX_SOURCE_RECORDS)
  .refine(sourcesAreCanonical, "noncanonical_sources");

export const focusSchema = z.enum(ALLOWED_FOCUS);

export const analyzeRequestSchema = z.strictObject({
  schema_version: z.literal(ANALYSIS_SCHEMA_VERSION),
  turnstile_token: z.string().min(1).max(MAX_TURNSTILE_TOKEN_CHARS),
  focus: focusSchema,
  requested_outputs: requestedOutputsSchema,
  sources: normalizedSourcesSchema,
});

export const trustedAnalyzeRequestSchema = analyzeRequestSchema;

const redactionResultSchema = z.strictObject({
  schema_version: z.literal(ANALYSIS_SCHEMA_VERSION),
  sources: normalizedSourcesSchema,
  placeholder_count: z.number().int().nonnegative().safe(),
  must_redact_leaks: z.literal(0),
});

export interface AnalyzeSerializationInput {
  readonly redaction_result: unknown;
  readonly turnstile_token: string;
  readonly focus: z.input<typeof analyzeRequestSchema>["focus"];
  readonly requested_outputs: z.input<typeof analyzeRequestSchema>["requested_outputs"];
}

export type AnalyzeRequest = z.output<typeof analyzeRequestSchema>;

export function parseAnalyzeRequest(value: unknown): AnalyzeRequest | undefined {
  const result = analyzeRequestSchema.safeParse(value);
  return result.success ? result.data : undefined;
}

export function parseTrustedAnalyzeRequest(value: unknown): AnalyzeRequest | undefined {
  const result = trustedAnalyzeRequestSchema.safeParse(value);
  return result.success ? result.data : undefined;
}

export function serializeAnalyzeRequest(input: AnalyzeSerializationInput): Uint8Array {
  const redaction = redactionResultSchema.parse(input.redaction_result);
  const request = analyzeRequestSchema.parse({
    schema_version: ANALYSIS_SCHEMA_VERSION,
    turnstile_token: input.turnstile_token,
    focus: input.focus,
    requested_outputs: input.requested_outputs,
    sources: redaction.sources,
  });
  const bytes = UTF8.encode(JSON.stringify(request));
  if (bytes.byteLength > MAX_ANALYSIS_BODY_BYTES) throw new Error("analyze_body_too_large");
  return bytes;
}
