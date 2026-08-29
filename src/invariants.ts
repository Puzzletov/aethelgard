export const ARCHITECTURE_VERSION = "2.1";
export const BUILD_PHASE = "0";
export const PUBLIC_SERVICE_NAME = "aethelgard-edge";
export const EXPECTED_ALLOWED_ORIGIN = "https://aethelgard-3j9.pages.dev";
export const EXPECTED_PUBLIC_ROUTES = Object.freeze(["/analyze", "/health"] as const);
export const EXPECTED_PUBLIC_ENV_NAMES = Object.freeze([
  "ALLOWED_ORIGIN",
  "ANALYZE_RATE_LIMIT",
  "TRUSTED_RUNTIME",
] as const);
export const EXPECTED_TRUSTED_RUNTIME = Object.freeze({
  binding: "TRUSTED_RUNTIME",
  className: "TrustedRuntime",
  scriptName: "aethelgard-trusted-runtime",
});
export const REQUIRED_PRIVATE_SECRET_NAMES = Object.freeze([
  "TURNSTILE_SECRET",
  "SIGNING_ED25519_PRIVATE_B64",
  "SIGNING_MLDSA65_SEED_B64",
] as const);
export const EXPECTED_PRIVATE_BROWSER_BINDING = "BROWSER";
export const EXPECTED_MLDSA65_WASM_SHA256 = "960ea1d9ceb0449f91301cb4168db83ab1cba3f0a86fa1bed0515f880b85f802";
export const EXPECTED_MLDSA65_WASM_BYTES = 40_843;
export const FORBIDDEN_DEPENDENCIES = Object.freeze([
  "@google-cloud/secret-manager",
  "@sentry/cloudflare",
  "@sentry/nextjs",
  "express",
  "resend",
] as const);

interface PublicRuntimeShape {
  readonly ALLOWED_ORIGIN?: unknown;
  readonly ANALYZE_RATE_LIMIT?: unknown;
  readonly TRUSTED_RUNTIME?: unknown;
}

function hasMethod(value: unknown, method: string): boolean {
  return typeof value === "object" && value !== null && typeof Reflect.get(value, method) === "function";
}

export function publicRuntimeInvariantsPass(env: PublicRuntimeShape): boolean {
  const names = Object.keys(env).sort();
  const expectedNames = [...EXPECTED_PUBLIC_ENV_NAMES].sort();
  return (
    names.length === expectedNames.length &&
    names.every((name, index) => name === expectedNames[index]) &&
    env.ALLOWED_ORIGIN === EXPECTED_ALLOWED_ORIGIN &&
    hasMethod(env.ANALYZE_RATE_LIMIT, "limit") &&
    hasMethod(env.TRUSTED_RUNTIME, "getByName")
  );
}
