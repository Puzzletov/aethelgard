import { z } from "zod";

export const BASELINE_MODEL = "openai/gpt-oss-20b";
export const BASELINE_BODY_BYTES = 131_072;

export const MINIMAL_RESPONSE_FORMAT = Object.freeze({ type: "json_schema", json_schema: {
  name: "minimal_analysis", strict: true, schema: {
    type: "object", additionalProperties: false,
    properties: {
      executive_summary: { type: "string" },
      findings: { type: "array", items: { type: "string" } },
      risks: { type: "array", items: { type: "string" } },
      recommendations: { type: "array", items: { type: "string" } },
    },
    required: ["executive_summary", "findings", "risks", "recommendations"],
  },
} });

export const baselineRequestSchema = z.strictObject({
  schema_version: z.literal("baseline-1"),
  turnstile_token: z.string().min(1).max(2_048),
  focus: z.enum(["full", "financial", "strategic", "security"]),
  redacted_text: z.string().min(1).max(100_000),
});

const boundedItems = z.array(z.string().min(1).max(1_200)).min(1).max(12);

export const baselineAnalysisSchema = z.strictObject({
  executive_summary: z.string().min(1).max(2_000),
  findings: boundedItems,
  risks: boundedItems,
  recommendations: boundedItems,
});

export const baselineTelemetrySchema = z.strictObject({
  model: z.literal(BASELINE_MODEL),
  http_status: z.number().int().min(100).max(599),
  latency_ms: z.number().int().nonnegative(),
  input_tokens: z.number().int().nonnegative().nullable(),
  output_tokens: z.number().int().nonnegative().nullable(),
  remaining_requests: z.string().max(64).nullable(),
  remaining_tokens: z.string().max(64).nullable(),
  stages: z.array(z.strictObject({
    stage: z.enum(["TRUSTED_RUNTIME_RECEIVED", "TURNSTILE_VERIFIED", "GROQ_REQUESTED",
      "GROQ_RESPONDED", "AI_SCHEMA_VALID", "RESPONSE_SENT"]),
    elapsed_ms: z.number().int().nonnegative(),
  })).length(6),
});

export const baselineResponseSchema = z.strictObject({
  schema_version: z.literal("baseline-1"),
  analysis: baselineAnalysisSchema,
  telemetry: baselineTelemetrySchema,
  edge_elapsed_ms: z.number().int().nonnegative(),
});

export type BaselineRequest = z.output<typeof baselineRequestSchema>;
export type BaselineAnalysis = z.output<typeof baselineAnalysisSchema>;
