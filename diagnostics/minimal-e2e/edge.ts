import { parseAnalyzeRequest, type AnalyzeRequest } from "../../src/contracts/analyze.ts";
import { MAX_ANALYSIS_BODY_BYTES } from "../../src/public-edge/config.ts";
import { baselineAnalysisSchema, baselineRequestSchema } from "./contracts.ts";

interface Env {
  readonly ALLOWED_ORIGIN: string;
  readonly BETA_ALLOWED_ORIGIN?: string;
  readonly MINIMAL_RUNTIME: DurableObjectNamespace;
}

const HEADERS = Object.freeze({ "cache-control": "no-store", "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff" });

function response(status: number, value: unknown, origin?: string): Response {
  const headers = new Headers(HEADERS);
  if (origin !== undefined) headers.set("access-control-allow-origin", origin);
  return new Response(JSON.stringify(value), { status, headers });
}

function allowedOrigin(request: Request, env: Env): string | undefined {
  const origin = request.headers.get("origin");
  return origin === env.ALLOWED_ORIGIN || origin === env.BETA_ALLOWED_ORIGIN ? origin : undefined;
}

async function body(request: Request): Promise<Uint8Array | undefined> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_ANALYSIS_BODY_BYTES) return undefined;
  const bytes = new Uint8Array(await request.arrayBuffer());
  return bytes.byteLength <= MAX_ANALYSIS_BODY_BYTES ? bytes : undefined;
}

function runtimeRequest(value: unknown): { body: Uint8Array; canonical: boolean } | undefined {
  const baseline = baselineRequestSchema.safeParse(value);
  if (baseline.success) return { body: new TextEncoder().encode(JSON.stringify(baseline.data)), canonical: false };
  const canonical = parseAnalyzeRequest(value);
  if (canonical === undefined) return undefined;
  return canonicalRuntimeRequest(canonical);
}

function canonicalRuntimeRequest(value: AnalyzeRequest) {
  const converted = baselineRequestSchema.safeParse({ schema_version: "baseline-1",
    turnstile_token: value.turnstile_token, focus: value.focus,
    redacted_text: value.sources.map((source) => source.content).join("\n") });
  return converted.success
    ? { body: new TextEncoder().encode(JSON.stringify(converted.data)), canonical: true } : undefined;
}

async function analyze(request: Request, env: Env, origin: string): Promise<Response> {
  const started = Date.now();
  const bytes = await body(request);
  if (bytes === undefined) return response(413, { schema_version: "baseline-error-1", stage: "EDGE_RECEIVED" }, origin);
  let value: unknown;
  try { value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { return response(400, { schema_version: "baseline-error-1", stage: "EDGE_RECEIVED" }, origin); }
  const runtime = runtimeRequest(value);
  if (runtime === undefined) return response(400,
    { schema_version: "baseline-error-1", stage: "EDGE_RECEIVED" }, origin);
  const stub = env.MINIMAL_RUNTIME.getByName("minimal-golden-path");
  const upstream = await stub.fetch(new Request("https://minimal-runtime.internal/analyze", {
    method: "POST", headers: { "content-type": "application/json" }, body: runtime.body,
  }));
  const headers = new Headers(upstream.headers);
  headers.set("access-control-allow-origin", origin);
  headers.set("cache-control", "no-store");
  if (!upstream.ok) return new Response(upstream.body, { status: upstream.status, headers });
  const upstreamValue = await upstream.json() as Record<string, unknown>;
  if (runtime.canonical) {
    const analysis = baselineAnalysisSchema.safeParse(upstreamValue.analysis);
    if (!analysis.success) return response(502,
      { schema_version: "baseline-error-1", stage: "AI_SCHEMA_VALID" }, origin);
    return response(200, { ...analysis.data, schema_version: "1" }, origin);
  }
  return new Response(JSON.stringify({ ...upstreamValue, edge_elapsed_ms: Date.now() - started }),
    { status: upstream.status, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = allowedOrigin(request, env);
    if (url.pathname !== "/analyze" || url.search !== "" || origin === undefined) return response(404,
      { schema_version: "baseline-error-1", stage: "EDGE_RECEIVED" });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: {
      "access-control-allow-origin": origin, "access-control-allow-methods": "POST",
      "access-control-allow-headers": "content-type", "access-control-max-age": "600",
    } });
    if (request.method !== "POST" || request.headers.get("content-type") !== "application/json") {
      return response(405, { schema_version: "baseline-error-1", stage: "EDGE_RECEIVED" }, origin);
    }
    return analyze(request, env, origin);
  },
} satisfies ExportedHandler<Env>;
