import { z } from "zod";

export const safeModeSchema = z.strictObject({
  schema_version: z.literal("1"),
  ok: z.literal(false),
  category: z.enum(["document", "language", "privacy", "verification", "analysis",
    "quota", "pdf", "signing", "client_resource", "service"]),
  code: z.string().min(1),
  message: z.string().min(1),
  retry: z.enum(["none", "fresh_document", "fresh_turnstile", "later"]),
});

export type SafeMode = z.output<typeof safeModeSchema>;

export const ANALYSIS_UNAVAILABLE = Object.freeze({
  schema_version: "1", ok: false, category: "analysis",
  code: "analysis_unavailable", message: "Analysis is unavailable. Try again later.", retry: "later",
} as const satisfies SafeMode);

export const ANALYSIS_TIMEOUT = Object.freeze({
  schema_version: "1", ok: false, category: "analysis",
  code: "analysis_timeout", message: "Analysis reached its time limit. Try again later.", retry: "later",
} as const satisfies SafeMode);

export const ANALYSIS_INVALID = Object.freeze({
  schema_version: "1", ok: false, category: "analysis",
  code: "analysis_invalid", message: "Analysis input is invalid.", retry: "none",
} as const satisfies SafeMode);
