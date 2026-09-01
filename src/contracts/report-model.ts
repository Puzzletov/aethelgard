import { z } from "zod";

import { focusSchema } from "./analyze.ts";
import { chartDataSchema, MAX_CHARTS } from "./chart-data.ts";
import { modelTextSchema } from "./ai-output.ts";
import {
  MAX_ORACLE_FINDINGS,
  MAX_ORACLE_RISKS,
  MAX_RECOMMENDATIONS,
  recommendationSchema,
} from "./oracle.ts";
import { evidenceItemSchema, findingSchema } from "./strawman.ts";

export const MAX_REPORT_SECTIONS = 32;
export const MAX_UI_TEXT_CODE_POINTS = 200_000;
const KEY_ID = {
  ed25519: /^ed25519:[0-9a-f]{32}$/u,
  mldsa65: /^mldsa65:[0-9a-f]{32}$/u,
} as const;

const verificationSchema = z.strictObject({
  ed25519_key_id: z.string().regex(KEY_ID.ed25519),
  mldsa65_key_id: z.string().regex(KEY_ID.mldsa65),
});

const reportModelBaseSchema = z.strictObject({
  schema_version: z.literal("1"),
  focus: focusSchema,
  title: modelTextSchema,
  executive_summary: modelTextSchema,
  findings: z.array(findingSchema).min(1).max(MAX_ORACLE_FINDINGS),
  recommendations: z.array(recommendationSchema).min(1).max(MAX_RECOMMENDATIONS),
  risks: z.array(evidenceItemSchema).max(MAX_ORACLE_RISKS),
  charts: z.array(chartDataSchema).max(MAX_CHARTS),
  verification: verificationSchema,
});

function codePoints(value: unknown): number {
  if (typeof value === "string") return [...value].length;
  if (Array.isArray(value)) return value.reduce((total, item) => total + codePoints(item), 0);
  if (typeof value !== "object" || value === null) return 0;
  return Object.values(value).reduce((total, item) => total + codePoints(item), 0);
}

export const reportModelSchema = reportModelBaseSchema
  .refine((value) => codePoints(value) <= MAX_UI_TEXT_CODE_POINTS, "report_text_too_large");

export type ReportModel = z.output<typeof reportModelSchema>;

export function parseReportModel(value: unknown): ReportModel | undefined {
  const parsed = reportModelSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}
