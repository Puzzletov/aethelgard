import { z } from "zod";

import {
  evidenceSchema,
  modelTextSchema,
  referencesExist,
  uniqueJson,
  withinAiResponseBound,
} from "./ai-output.ts";
import type { NormalizedSourceRecord } from "./analyze.ts";
import type { StrawmanOutput } from "./strawman.ts";

export const MAX_STEELMAN_ITEMS = 24;
const MAX_STRAWMAN_FINDING_LINKS = 24;

const critiqueSchema = z.strictObject({
  id: modelTextSchema,
  strawman_finding_ids: z.array(modelTextSchema).max(MAX_STRAWMAN_FINDING_LINKS)
    .refine(uniqueJson, "duplicate_finding_id"),
  kind: z.enum(["omission", "contradiction", "counter_evidence", "unsupported",
    "nuance", "missed_connection"]),
  critique: modelTextSchema,
  evidence: evidenceSchema(0),
});

const steelmanOutputBaseSchema = z.strictObject({
  schema_version: z.literal("1"),
  items: z.array(critiqueSchema).min(1).max(MAX_STEELMAN_ITEMS),
});

export type SteelmanOutput = z.output<typeof steelmanOutputBaseSchema>;

export const steelmanOutputSchema = steelmanOutputBaseSchema.refine(
  (value) => uniqueJson(value.items.map((item) => item.id)),
  "duplicate_id",
);

function findingIdsExist(output: SteelmanOutput, strawman: StrawmanOutput): boolean {
  const allowed = new Set(strawman.findings.map((finding) => finding.id));
  return output.items.every((item) => item.strawman_finding_ids.every((id) => allowed.has(id)));
}

export function parseSteelmanOutput(
  value: unknown,
  sources: readonly NormalizedSourceRecord[],
  strawman: StrawmanOutput,
): SteelmanOutput | undefined {
  if (!withinAiResponseBound(value)) return undefined;
  const parsed = steelmanOutputSchema.safeParse(value);
  if (!parsed.success || !findingIdsExist(parsed.data, strawman)) return undefined;
  if (!referencesExist(parsed.data.items.map((item) => item.evidence), sources)) return undefined;
  return parsed.data;
}
