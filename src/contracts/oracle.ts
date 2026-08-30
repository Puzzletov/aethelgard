import { z } from "zod";

import {
  evidenceSchema,
  modelTextSchema,
  referencesExist,
  uniqueJson,
  withinAiResponseBound,
} from "./ai-output.ts";
import type { NormalizedSourceRecord } from "./analyze.ts";
import {
  candidateSchema,
  confidenceSchema,
  evidenceItemSchema,
  findingSchema,
  parseStrawmanOutput,
  type StrawmanOutput,
} from "./strawman.ts";
import { parseSteelmanOutput, type SteelmanOutput } from "./steelman.ts";

export const MAX_ORACLE_FINDINGS = 24;
export const MAX_RECOMMENDATIONS = 16;
export const MAX_ORACLE_RISKS = 16;
export const MAX_ORACLE_CANDIDATES = 24;
const MAX_CRITIQUE_RESOLUTIONS = 24;

const recommendationSchema = z.strictObject({
  id: modelTextSchema,
  title: modelTextSchema,
  action: modelTextSchema,
  priority: z.enum(["high", "medium", "low"]),
  confidence: confidenceSchema,
  evidence: evidenceSchema(1),
});

const resolutionSchema = z.strictObject({
  steelman_item_id: modelTextSchema,
  status: z.enum(["resolved", "unresolved"]),
  explanation: modelTextSchema,
});

const oracleOutputBaseSchema = z.strictObject({
  schema_version: z.literal("1"),
  executive_summary: modelTextSchema,
  findings: z.array(findingSchema).min(1).max(MAX_ORACLE_FINDINGS),
  recommendations: z.array(recommendationSchema).min(1).max(MAX_RECOMMENDATIONS),
  risks: z.array(evidenceItemSchema).max(MAX_ORACLE_RISKS),
  quantitative_candidates: z.array(candidateSchema).max(MAX_ORACLE_CANDIDATES),
  critique_resolutions: z.array(resolutionSchema).min(1).max(MAX_CRITIQUE_RESOLUTIONS),
});

export type OracleOutput = z.output<typeof oracleOutputBaseSchema>;

function outputIdsAreUnique(value: OracleOutput): boolean {
  const ids = [...value.findings, ...value.recommendations, ...value.risks,
    ...value.quantitative_candidates].map((item) => item.id);
  return uniqueJson(ids);
}

export const oracleOutputSchema = oracleOutputBaseSchema
  .refine(outputIdsAreUnique, "duplicate_id");

function resolutionsAreComplete(output: OracleOutput, steelman: SteelmanOutput): boolean {
  const actual = output.critique_resolutions.map((item) => item.steelman_item_id);
  const expected = steelman.items.map((item) => item.id);
  return uniqueJson(actual) && actual.length === expected.length
    && expected.every((id) => actual.includes(id));
}

function oracleEvidenceExists(output: OracleOutput, sources: readonly NormalizedSourceRecord[]): boolean {
  const items = [...output.findings, ...output.recommendations, ...output.risks,
    ...output.quantitative_candidates];
  return referencesExist(items.map((item) => item.evidence), sources);
}

export function parseOracleOutput(
  value: unknown,
  sources: readonly NormalizedSourceRecord[],
  strawman: StrawmanOutput,
  steelman: SteelmanOutput,
): OracleOutput | undefined {
  if (!withinAiResponseBound(value)) return undefined;
  const checkedStrawman = parseStrawmanOutput(strawman, sources);
  if (checkedStrawman === undefined
    || parseSteelmanOutput(steelman, sources, checkedStrawman) === undefined) return undefined;
  const parsed = oracleOutputSchema.safeParse(value);
  if (!parsed.success || !resolutionsAreComplete(parsed.data, steelman)) return undefined;
  return oracleEvidenceExists(parsed.data, sources) ? parsed.data : undefined;
}
