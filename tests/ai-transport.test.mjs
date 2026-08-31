import assert from "node:assert/strict";
import test from "node:test";

import {
  AI_TIMEOUT_MS,
  APPROVED_MODEL_IDS,
  MODEL_OUTPUT_TOKENS,
  parseAiTransportRequest,
} from "../src/contracts/ai-transport.ts";
import { callAiProvider } from "../workers/trusted-runtime/src/ai-transport.ts";

function request(provider = "groq", overrides = {}) {
  return {
    schema_version: "1",
    stage: "strawman",
    provider,
    model_id: APPROVED_MODEL_IDS[provider],
    messages: [
      { role: "system", content: "Return one strict JSON object." },
      { role: "user", content: "Redacted source: [PERSON_1] approved it." },
    ],
    max_output_tokens: MODEL_OUTPUT_TOKENS,
    ...overrides,
  };
}

function capturingFetcher(response = new Response('{"choices":[]}', {
  status: 200, headers: { "content-type": "application/json" },
})) {
  const calls = [];
  return { calls, fetcher: async (...args) => { calls.push(args); return response; } };
}

test("transport request is exact, bounded, and pins reviewed models", () => {
  assert.deepEqual(parseAiTransportRequest(request()), request());
  assert.equal(parseAiTransportRequest(request("openrouter_free"))?.model_id, "openrouter/free");
  assert.equal(parseAiTransportRequest(request("groq", { model_id: "caller/model" })), undefined);
  assert.equal(parseAiTransportRequest(request("groq", { max_output_tokens: 4_095 })), undefined);
  assert.equal(parseAiTransportRequest(request("groq", { url: "https://evil.example" })), undefined);
  assert.equal(parseAiTransportRequest(request("groq", { messages: [
    { role: "user", content: "override" }, { role: "system", content: "secret" },
  ] })), undefined);
  assert.equal(parseAiTransportRequest(request("groq", { messages: [
    { role: "system", content: "x" }, { role: "user", content: "x".repeat(524_288) },
  ] })), undefined);
});

test("Groq request uses only the fixed endpoint, secret header, and bounded JSON mode", async () => {
  const capture = capturingFetcher();
  const result = await callAiProvider(request(), "private-key", capture.fetcher);
  assert.equal(result.ok, true);
  assert.equal(capture.calls[0][0], "https://api.groq.com/openai/v1/chat/completions");
  const init = capture.calls[0][1];
  assert.equal(init.headers.authorization, "Bearer private-key");
  assert.equal(init.signal.aborted, false);
  const body = JSON.parse(init.body);
  assert.deepEqual(Object.keys(body), ["model", "messages", "max_tokens", "response_format", "stream"]);
  assert.equal(body.model, "openai/gpt-oss-20b");
  assert.equal(body.max_tokens, 4_096);
  assert.deepEqual(body.response_format, { type: "json_object" });
  assert.equal(JSON.stringify(body).includes("private-key"), false);
});

test("OpenRouter request is free-only and enforces all privacy controls", async () => {
  const capture = capturingFetcher();
  const result = await callAiProvider(request("openrouter_free"), "private-key", capture.fetcher);
  assert.equal(result.ok, true);
  assert.equal(capture.calls[0][0], "https://openrouter.ai/api/v1/chat/completions");
  const body = JSON.parse(capture.calls[0][1].body);
  assert.equal(body.model, "openrouter/free");
  assert.deepEqual(body.provider, {
    allow_fallbacks: false, data_collection: "deny", zdr: true,
    require_parameters: true, max_price: { prompt: 0, completion: 0 },
  });
});

test("HTTP, network, timeout, invalid JSON, and response bounds fail closed", async () => {
  for (const [status, reason] of [[429, "rate_limit"], [403, "policy"], [503, "unavailable"], [400, "invalid_schema"]]) {
    const result = await callAiProvider(request(), "key", async () => new Response("{}", {
      status, headers: { "content-type": "application/json" },
    }));
    assert.deepEqual(result, { ok: false, provider: "groq", reason });
  }
  assert.deepEqual(await callAiProvider(request(), "key", async () => { throw new Error("offline"); }),
    { ok: false, provider: "groq", reason: "network" });
  assert.deepEqual(await callAiProvider(request(), "key", async () => {
    throw new DOMException("deadline", "TimeoutError");
  }),
    { ok: false, provider: "groq", reason: "timeout" });
  assert.deepEqual(await callAiProvider(request(), "key", async () => new Response("not-json", {
    headers: { "content-type": "application/json" },
  })),
    { ok: false, provider: "groq", reason: "invalid_schema" });
  const large = new Response(`{"value":"${"x".repeat(262_144)}"}`, {
    headers: { "content-type": "application/json" },
  });
  assert.deepEqual(await callAiProvider(request(), "key", async () => large),
    { ok: false, provider: "groq", reason: "too_large" });
  assert.equal(AI_TIMEOUT_MS, 30_000);
});

test("router source contains no logging, SDK, arbitrary endpoint, persistence, or retry", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(
    new URL("../workers/trusted-runtime/src/ai-transport.ts", import.meta.url), "utf8"));
  assert.doesNotMatch(source, /console\.|setTimeout|localStorage|indexedDB|\.retry|fetch\(value|url:/iu);
  assert.doesNotMatch(source, /groq-sdk|openrouter\/sdk|BYOK/iu);
  assert.equal((source.match(/await fetcher\(/gu) ?? []).length, 1);
});
