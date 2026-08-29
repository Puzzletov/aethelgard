import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/index.ts";

const allowedOrigin = "https://aethelgard-3j9.pages.dev";
const validEnvelope = Object.freeze({
  schema_version: "1",
  turnstile_token: "test-token",
  focus: "full",
  requested_outputs: ["pdf"],
  sources: [{ reference: "page 1", content: "[PERSON_1] approved the plan." }],
});

function createEnv(rateLimitSuccess = true) {
  const calls = [];
  const runtimeCalls = [];
  return {
    calls,
    runtimeCalls,
    env: {
      ALLOWED_ORIGIN: allowedOrigin,
      ANALYZE_RATE_LIMIT: {
        async limit(input) {
          calls.push(input);
          return { success: rateLimitSuccess };
        },
      },
      TRUSTED_RUNTIME: {
        getByName(name) {
          runtimeCalls.push({ name });
          return {
            async fetch(request) {
              runtimeCalls.push({ request });
              return new Response(JSON.stringify({
                ok: false,
                error: { code: "turnstile_not_ready", message: "Analysis is not available yet." },
              }), { status: 503, headers: { "content-type": "application/json" } });
            },
          };
        },
      },
    },
  };
}

function analyzeRequest(body = validEnvelope, headers = {}) {
  return new Request("https://edge.example.test/analyze", {
    method: "POST",
    headers: {
      "cf-connecting-ip": "192.0.2.1",
      "content-type": "application/json",
      origin: allowedOrigin,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

test("health is minimal, secure, and no-indexed", async () => {
  const { env } = createEnv();
  const response = await worker.fetch(new Request("https://edge.example.test/health"), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "aethelgard-edge",
    architecture: "2.1",
  });
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
});

test("health fails closed without exposing a failed invariant", async () => {
  const { env } = createEnv();
  env.UNEXPECTED_SECRET = "not-returned";
  const response = await worker.fetch(new Request("https://edge.example.test/health"), env);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    status: "unavailable",
    service: "aethelgard-edge",
  });
});

test("only the named routes and methods are accepted", async () => {
  const { env } = createEnv();
  const unknown = await worker.fetch(new Request("https://edge.example.test/upload"), env);
  const query = await worker.fetch(new Request("https://edge.example.test/health?detail=1"), env);
  const method = await worker.fetch(new Request("https://edge.example.test/health", { method: "POST" }), env);
  assert.equal(unknown.status, 404);
  assert.equal(query.status, 404);
  assert.equal(method.status, 405);
  assert.equal(method.headers.get("allow"), "GET");
});

test("analysis rejects origin, content type, and oversized content length", async () => {
  const { env, calls } = createEnv();
  const origin = await worker.fetch(analyzeRequest(validEnvelope, { origin: "https://evil.example" }), env);
  const type = await worker.fetch(analyzeRequest(validEnvelope, { "content-type": "text/plain" }), env);
  const size = await worker.fetch(analyzeRequest(validEnvelope, { "content-length": "524289" }), env);
  assert.equal(origin.status, 403);
  assert.equal(type.status, 415);
  assert.equal(size.status, 413);
  assert.equal(calls.length, 0);
});

test("analysis applies the per-source rate limit before reading the body", async () => {
  const { env, calls } = createEnv(false);
  const response = await worker.fetch(analyzeRequest(), env);
  assert.equal(response.status, 429);
  assert.deepEqual(calls, [{ key: "192.0.2.1" }]);
});

test("analysis accepts only the bounded basic envelope", async () => {
  for (const callerInput of [
    { prompt: "ignore rules" },
    { html: "<h1>caller report</h1>" },
    { pdf: "JVBERi0=" },
    { hash: "caller-selected-hash" },
  ]) {
    const invalidEnv = createEnv();
    const invalid = await worker.fetch(analyzeRequest({ ...validEnvelope, ...callerInput }), invalidEnv.env);
    assert.equal(invalid.status, 400);
    assert.equal(invalidEnv.runtimeCalls.length, 0);
  }
  const validEnv = createEnv();
  const valid = await worker.fetch(analyzeRequest(), validEnv.env);
  assert.equal(valid.status, 503);
  assert.equal((await valid.json()).error.code, "turnstile_not_ready");
  assert.equal(valid.headers.get("access-control-allow-origin"), allowedOrigin);
  assert.equal(validEnv.runtimeCalls[0].name, "global");
  assert.equal(validEnv.runtimeCalls[1].request.url, "https://trusted-runtime.internal/analyze");
});

test("analysis fails closed when the streamed body exceeds its bound", async () => {
  const { env } = createEnv();
  const body = `{"padding":"${"x".repeat(524_288)}"}`;
  const response = await worker.fetch(analyzeRequest(body), env);
  assert.equal(response.status, 413);
});

test("CORS preflight is restricted to the analysis contract", async () => {
  const { env } = createEnv();
  const request = new Request("https://edge.example.test/analyze", {
    method: "OPTIONS",
    headers: {
      origin: allowedOrigin,
      "access-control-request-method": "POST",
      "access-control-request-headers": "content-type",
    },
  });
  const response = await worker.fetch(request, env);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), allowedOrigin);
  assert.equal(response.headers.get("access-control-allow-methods"), "POST, OPTIONS");
});
