import { z } from "zod";

import {
  type NormalizedSourceRecord,
} from "./analyze.ts";
import {
  evidenceSchema,
  modelTextSchema,
  referencesExist,
  withinAiResponseBound,
} from "./ai-output.ts";

export const MAX_STRAWMAN_FINDINGS = 24;
export const MAX_QUANTITATIVE_CANDIDATES = 24;
export const MAX_STRAWMAN_RISKS = 16;
export const MAX_STRAWMAN_ASSUMPTIONS = 16;

const confidenceSchema = z.enum(["high", "medium", "low"]);
const sourceEvidenceSchema = evidenceSchema(1);

const findingSchema = z.strictObject({
  id: modelTextSchema,
  title: modelTextSchema,
  analysis: modelTextSchema,
  confidence: confidenceSchema,
  evidence: sourceEvidenceSchema,
});
const evidenceItemSchema = z.strictObject({
  id: modelTextSchema,
  text: modelTextSchema,
  confidence: confidenceSchema,
  evidence: sourceEvidenceSchema,
});
const candidateSchema = z.strictObject({
  id: modelTextSchema,
  label: modelTextSchema,
  value: z.number().finite(),
  unit: modelTextSchema,
  context: modelTextSchema,
  evidence: sourceEvidenceSchema,
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

function evidenceExists(output: StrawmanOutput, sources: readonly NormalizedSourceRecord[]): boolean {
  const items = [...output.findings, ...output.risks, ...output.assumptions,
    ...output.quantitative_candidates];
  return referencesExist(items.map((item) => item.evidence), sources);
}

export function parseStrawmanOutput(
  value: unknown,
  sources: readonly NormalizedSourceRecord[],
): StrawmanOutput | undefined {
  if (!withinAiResponseBound(value)) return undefined;
  const parsed = strawmanOutputSchema.safeParse(value);
  if (!parsed.success || !evidenceExists(parsed.data, sources)) return undefined;
  return parsed.data;
}
