export const ANALYSIS_SCHEMA_VERSION = "1";
export const ALLOWED_FOCUS = Object.freeze([
  "full",
  "financial",
  "strategic",
  "security",
] as const);
export const ALLOWED_OUTPUTS = Object.freeze(["pdf", "xlsx", "text"] as const);
export const BODY_READ_TIMEOUT_MS = 5_000;
export const MAX_ANALYSIS_BODY_BYTES = 512 * 1024;
export const MAX_BODY_CHUNKS = 1_024;
export const MAX_REQUESTED_OUTPUTS = 3;
export const MAX_SOURCE_RECORDS = 512;
export const MAX_TURNSTILE_TOKEN_CHARS = 2_048;
export const TRUSTED_RUNTIME_INSTANCE = "global";

export interface RateLimiter {
  limit(input: Readonly<{ key: string }>): Promise<Readonly<{ success: boolean }>>;
}

export interface PublicEdgeEnv {
  readonly ALLOWED_ORIGIN: string;
  readonly ANALYZE_RATE_LIMIT: RateLimiter;
  readonly TRUSTED_RUNTIME: DurableObjectNamespace;
}
