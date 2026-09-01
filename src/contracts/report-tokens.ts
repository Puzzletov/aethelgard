import { z } from "zod";

import { visualTokens } from "../design/visual-tokens.ts";

export const MAX_REPORT_TOKEN_COUNT = 64;
const spacing = Object.freeze(Object.values(visualTokens.space).map((value) => Number.parseFloat(value)));
const spacingSchema = z.array(z.number().finite().positive()).max(MAX_REPORT_TOKEN_COUNT)
  .length(spacing.length).refine((values) => values.every((value, index) => value === spacing[index]));

export const reportTokenSchema = z.object({
  schema_version: z.literal("1"),
  paper: z.literal(visualTokens.color.paper),
  charcoal: z.literal(visualTokens.color.charcoal),
  terracotta: z.literal(visualTokens.color.terracotta),
  display_font: z.literal(visualTokens.font.display),
  body_font: z.literal(visualTokens.font.body),
  spacing: spacingSchema,
  rule_width: z.literal(visualTokens.ruleWidth),
}).strict();

export type ReportTokens = Readonly<z.output<typeof reportTokenSchema>>;

export const reportTokens: ReportTokens = Object.freeze(reportTokenSchema.parse({
  schema_version: "1",
  paper: visualTokens.color.paper,
  charcoal: visualTokens.color.charcoal,
  terracotta: visualTokens.color.terracotta,
  display_font: visualTokens.font.display,
  body_font: visualTokens.font.body,
  spacing,
  rule_width: visualTokens.ruleWidth,
}));
