import {
  MAX_ANALYSIS_BODY_BYTES,
  TRUSTED_RUNTIME_INSTANCE,
  type PublicEdgeEnv,
} from "./public-edge/config.ts";
import { readBoundedBody } from "./public-edge/body.ts";
import { isBasicAnalysisEnvelope } from "./public-edge/envelope.ts";
import {
  jsonResponse,
  methodNotAllowed,
  passThroughResponse,
  preflightResponse,
  safeError,
} from "./public-edge/responses.ts";
import {
  ARCHITECTURE_VERSION,
  PUBLIC_SERVICE_NAME,
  publicRuntimeInvariantsPass,
} from "./invariants.ts";

function allowedOrigin(request: Request, env: PublicEdgeEnv): string | undefined {
  const origin = request.headers.get("origin");
  return origin === env.ALLOWED_ORIGIN ? origin : undefined;
}

function hasJsonContentType(request: Request): boolean {
  const contentType = request.headers.get("content-type");
  return contentType?.split(";", 1)[0]?.trim().toLowerCase() === "application/json";
}

function contentLengthIsAllowed(request: Request): boolean {
  const value = request.headers.get("content-length");
  if (value === null) return true;
  if (!/^\d{1,9}$/.test(value)) return false;
  return Number(value) <= MAX_ANALYSIS_BODY_BYTES;
}

function parseJson(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes));
  } catch {
    return undefined;
  }
}

async function passesRateLimit(request: Request, env: PublicEdgeEnv): Promise<boolean | undefined> {
  const clientKey = request.headers.get("cf-connecting-ip") ?? "unknown-source";
  try {
    const result = await env.ANALYZE_RATE_LIMIT.limit({ key: clientKey });
    return result.success;
  } catch {
    return undefined;
  }
}

async function callTrustedRuntime(
  bytes: Uint8Array,
  env: PublicEdgeEnv,
  origin: string,
): Promise<Response> {
  try {
    const stub = env.TRUSTED_RUNTIME.getByName(TRUSTED_RUNTIME_INSTANCE);
    const ownedBody = new Uint8Array(bytes.byteLength);
    ownedBody.set(bytes);
    const request = new Request("https://trusted-runtime.internal/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: ownedBody.buffer,
    });
    return passThroughResponse(await stub.fetch(request), origin);
  } catch {
    return safeError(503, "trusted_runtime_unavailable", "Analysis is not available yet.", origin);
  }
}

function handlePreflight(request: Request, env: PublicEdgeEnv): Response {
  const origin = allowedOrigin(request, env);
  if (origin === undefined) return safeError(403, "origin_denied", "Origin is not allowed.");
  const method = request.headers.get("access-control-request-method");
  const headers = request.headers.get("access-control-request-headers")?.toLowerCase() ?? "";
  if (method !== "POST" || headers !== "content-type") {
    return safeError(400, "invalid_preflight", "Preflight request is invalid.", origin);
  }
  return preflightResponse(origin);
}

async function handleAnalyze(request: Request, env: PublicEdgeEnv): Promise<Response> {
  const origin = allowedOrigin(request, env);
  if (origin === undefined) return safeError(403, "origin_denied", "Origin is not allowed.");
  if (!hasJsonContentType(request)) {
    return safeError(415, "content_type_invalid", "Content type must be application/json.", origin);
  }
  if (!contentLengthIsAllowed(request)) {
    return safeError(413, "body_too_large", "Request body is too large.", origin);
  }
  const rateLimit = await passesRateLimit(request, env);
  if (rateLimit === undefined) return safeError(503, "rate_limit_unavailable", "Service is unavailable.", origin);
  if (!rateLimit) return safeError(429, "rate_limited", "Try again later.", origin);
  const body = await readBoundedBody(request);
  if (!body.ok) {
    const status = body.reason === "too_large" ? 413 : 400;
    return safeError(status, body.reason, "Request body is invalid.", origin);
  }
  if (!isBasicAnalysisEnvelope(parseJson(body.bytes))) {
    return safeError(400, "envelope_invalid", "Request body is invalid.", origin);
  }
  return callTrustedRuntime(body.bytes, env, origin);
}

async function routeRequest(request: Request, env: PublicEdgeEnv): Promise<Response> {
  const url = new URL(request.url);
  if (url.search !== "") return safeError(404, "not_found", "Route not found.");
  if (url.pathname === "/health") {
    if (request.method !== "GET") return methodNotAllowed("GET");
    if (!publicRuntimeInvariantsPass(env)) {
      return jsonResponse(503, { status: "unavailable", service: PUBLIC_SERVICE_NAME });
    }
    return jsonResponse(200, {
      status: "ok",
      service: PUBLIC_SERVICE_NAME,
      architecture: ARCHITECTURE_VERSION,
    });
  }
  if (url.pathname !== "/analyze") return safeError(404, "not_found", "Route not found.");
  if (request.method === "OPTIONS") return handlePreflight(request, env);
  if (request.method !== "POST") return methodNotAllowed("POST, OPTIONS", allowedOrigin(request, env));
  return handleAnalyze(request, env);
}

export default {
  fetch(request: Request, env: PublicEdgeEnv): Promise<Response> {
    return routeRequest(request, env);
  },
} satisfies ExportedHandler<PublicEdgeEnv>;
