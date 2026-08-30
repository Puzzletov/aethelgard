import { z } from "zod";

import { AI_RESPONSE_MAX_BYTES } from "./ai-transport.ts";
import {
  type NormalizedSourceRecord,
  sourceReferenceSchema,
} from "./analyze.ts";

export const MAX_STRAWMAN_FINDINGS = 24;
export const MAX_EVIDENCE_REFERENCES = 8;
export const MAX_QUANTITATIVE_CANDIDATES = 24;
export const MAX_STRAWMAN_RISKS = 16;
export const MAX_STRAWMAN_ASSUMPTIONS = 16;

const confidenceSchema = z.enum(["high", "medium", "low"]);
const safeTextSchema = z.string().min(1).refine(
  (value) => !/<\/?[A-Za-z][^>]*>/u.test(value),
  "html_forbidden",
);
const evidenceSchema = z.array(sourceReferenceSchema).min(1).max(MAX_EVIDENCE_REFERENCES)
  .refine((values) => new Set(values.map((value) => JSON.stringify(value))).size === values.length,
    "duplicate_evidence");

const findingSchema = z.strictObject({
  id: safeTextSchema,
  title: safeTextSchema,
  analysis: safeTextSchema,
  confidence: confidenceSchema,
  evidence: evidenceSchema,
});
const evidenceItemSchema = z.strictObject({
  id: safeTextSchema,
  text: safeTextSchema,
  confidence: confidenceSchema,
  evidence: evidenceSchema,
});
const candidateSchema = z.strictObject({
  id: safeTextSchema,
  label: safeTextSchema,
  value: z.number().finite(),
  unit: safeTextSchema,
  context: safeTextSchema,
  evidence: evidenceSchema,
});

const strawmanOutputBaseSchema = z.strictObject({
  schema_version: z.literal("1"),
  findings: z.array(findingSchema).min(1).max(MAX_STRAWMAN_FINDINGS),
  risks: z.array(evidenceItemSchema).max(MAX_STRAWMAN_RISKS),
  assumptions: z.array(evidenceItemSchema).max(MAX_STRAWMAN_ASSUMPTIONS),
  quantitative_candidates: z.array(candidateSchema).max(MAX_QUANTITATIVE_CANDIDATES),
});

export type StrawmanOutput = z.output<typeof strawmanOutputBaseSchema>;

function allIdsAreUnique(value: StrawmanOutput): boolean {
  const ids = [
    ...value.findings.map((item) => item.id),
    ...value.risks.map((item) => item.id),
    ...value.assumptions.map((item) => item.id),
    ...value.quantitative_candidates.map((item) => item.id),
  ];
  return new Set(ids).size === ids.length;
}

export const strawmanOutputSchema = strawmanOutputBaseSchema
  .refine(allIdsAreUnique, "duplicate_id");

function withinResponseBound(value: unknown): boolean {
  try {
    const encoded = new TextEncoder().encode(JSON.stringify(value));
    return encoded.byteLength <= AI_RESPONSE_MAX_BYTES;
  } catch {
    return false;
  }
}

function evidenceExists(output: StrawmanOutput, sources: readonly NormalizedSourceRecord[]): boolean {
  const allowed = new Set(sources.map((source) => JSON.stringify(source.reference)));
  const items = [...output.findings, ...output.risks, ...output.assumptions,
    ...output.quantitative_candidates];
  return items.every((item) => item.evidence.every((reference) =>
    allowed.has(JSON.stringify(reference))));
}

export function parseStrawmanOutput(
  value: unknown,
  sources: readonly NormalizedSourceRecord[],
): StrawmanOutput | undefined {
  if (!withinResponseBound(value)) return undefined;
  const parsed = strawmanOutputSchema.safeParse(value);
  if (!parsed.success || !evidenceExists(parsed.data, sources)) return undefined;
  return parsed.data;
}
