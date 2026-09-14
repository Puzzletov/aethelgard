import { z } from "zod";
import { modelTextSchema } from "./ai-output.ts";

export const MAX_FINISHED_SUMMARY_CODE_POINTS = 2_000;
export const MAX_FINISHED_ITEMS = 12;
export const MAX_FINISHED_ITEM_CODE_POINTS = 1_200;

function boundedText(maximum: number) {
  return modelTextSchema.refine((value) => [...value].length <= maximum, "text_too_long");
}

const itemsSchema = z.array(boundedText(MAX_FINISHED_ITEM_CODE_POINTS))
  .min(1).max(MAX_FINISHED_ITEMS);

export const finishedAnalysisSchema = z.strictObject({
  schema_version: z.literal("1"),
  executive_summary: boundedText(MAX_FINISHED_SUMMARY_CODE_POINTS),
  findings: itemsSchema,
  risks: itemsSchema,
  recommendations: itemsSchema,
});

export type FinishedAnalysis = z.output<typeof finishedAnalysisSchema>;

export function parseFinishedAnalysis(value: unknown): FinishedAnalysis | undefined {
  const parsed = finishedAnalysisSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}
