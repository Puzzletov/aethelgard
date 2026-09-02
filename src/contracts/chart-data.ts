import { z } from "zod";

import { evidenceSchema, modelTextSchema } from "./ai-output.ts";

export const MAX_CHARTS = 8;
export const MAX_CHART_POINTS = 64;

const chartPointSchema = z.strictObject({
  label: modelTextSchema,
  value: z.number().finite(),
  evidence: evidenceSchema(1),
});

export const chartDataSchema = z.strictObject({
  schema_version: z.literal("1"),
  id: modelTextSchema,
  title: modelTextSchema,
  unit: modelTextSchema,
  kind: z.enum(["bar", "line"]),
  points: z.array(chartPointSchema).min(1).max(MAX_CHART_POINTS),
});

export type ChartData = z.output<typeof chartDataSchema>;

export function parseChartData(value: unknown): ChartData | undefined {
  const parsed = chartDataSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

export function parseChartCollection(value: unknown): readonly ChartData[] {
  if (!Array.isArray(value) || value.length > MAX_CHARTS) return [];
  const parsed = value.map(parseChartData);
  return parsed.every((item) => item !== undefined) ? parsed : [];
}
