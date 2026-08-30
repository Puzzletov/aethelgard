import { z } from "zod";

export const AI_REQUEST_MAX_BYTES = 524_288;
export const AI_RESPONSE_MAX_BYTES = 262_144;
export const AI_TIMEOUT_MS = 30_000;
export const MODEL_OUTPUT_TOKENS = 4_096;
export const APPROVED_MODEL_IDS = Object.freeze({
  groq: "openai/gpt-oss-20b",
  openrouter_free: "openrouter/free",
} as const);

const stageSchema = z.enum(["strawman", "steelman", "oracle"]);
const providerSchema = z.enum(["groq", "openrouter_free"]);
const messageSchema = <T extends "system" | "user">(role: T) => z.strictObject({
  role: z.literal(role),
  content: z.string().min(1),
});

export const aiTransportRequestSchema = z.strictObject({
  schema_version: z.literal("1"),
  stage: stageSchema,
  provider: providerSchema,
  model_id: z.string().min(1),
  messages: z.tuple([messageSchema("system"), messageSchema("user")]),
  max_output_tokens: z.literal(MODEL_OUTPUT_TOKENS),
}).refine((value) => value.model_id === APPROVED_MODEL_IDS[value.provider], "model_not_approved");

export const aiTransportResultSchema = z.discriminatedUnion("ok", [
  z.strictObject({ ok: z.literal(true), provider: providerSchema, body: z.unknown() }),
  z.strictObject({
    ok: z.literal(false),
    provider: providerSchema,
    reason: z.enum(["network", "rate_limit", "unavailable", "policy", "timeout",
      "too_large", "invalid_schema"]),
  }),
]);

export type AiTransportRequest = z.output<typeof aiTransportRequestSchema>;
export type AiTransportResult = z.output<typeof aiTransportResultSchema>;

export function parseAiTransportRequest(value: unknown): AiTransportRequest | undefined {
  const parsed = aiTransportRequestSchema.safeParse(value);
  if (!parsed.success) return undefined;
  const bytes = new TextEncoder().encode(JSON.stringify(parsed.data)).byteLength;
  return bytes <= AI_REQUEST_MAX_BYTES ? parsed.data : undefined;
}
