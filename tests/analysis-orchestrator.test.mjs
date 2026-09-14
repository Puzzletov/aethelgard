import assert from "node:assert/strict";
import test from "node:test";

import { ANALYSIS_WALL_MS, MAX_PROVIDER_ATTEMPTS_PER_STAGE,
  MAX_PROVIDER_ATTEMPTS_TOTAL, runAnalysis } from
  "../workers/trusted-runtime/src/analysis-orchestrator.ts";

const sources = Object.freeze([Object.freeze({ schema_version: "1", ordinal: 1,
  reference: { kind: "txt_lines", line_start: 1, line_end: 1 },
  content: "Revenue rose while one delivery control remained incomplete." })]);
const request = (focus = "full") => Object.freeze({ schema_version: "1", turnstile_token: "fresh-token",
  focus, requested_outputs: ["text"], sources });
const output = Object.freeze({ executive_summary: "Growth is positive but delivery needs attention.",
  findings: ["Revenue improved."], risks: ["One delivery control remains incomplete."],
  recommendations: ["Assign and verify the remaining control work."] });

function success(value = output) {
  return { ok: true, provider: "groq",
    body: { choices: [{ message: { content: JSON.stringify(value) } }] } };
}

test("normal analysis makes exactly one Groq call and returns one cohesive result", async () => {
  const calls = [];
  const result = await runAnalysis(request(), "private-groq", async (providerRequest, key, signal) => {
    calls.push({ providerRequest, key, signal }); return success();
  });
  assert.deepEqual(result, { schema_version: "1", ...output });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].providerRequest.stage, "analysis");
  assert.equal(calls[0].providerRequest.provider, "groq");
  assert.equal(calls[0].key, "private-groq");
  assert.equal(calls[0].signal instanceof AbortSignal, true);
  assert.equal(MAX_PROVIDER_ATTEMPTS_PER_STAGE, 1);
  assert.equal(MAX_PROVIDER_ATTEMPTS_TOTAL, 1);
});

test("all four focuses change the fixed one-call prompt without changing its schema", async () => {
  const prompts = new Map();
  for (const focus of ["full", "financial", "strategic", "security"]) {
    await runAnalysis(request(focus), "key", async (providerRequest) => {
      prompts.set(focus, providerRequest.messages[0].content); return success();
    });
  }
  assert.equal(new Set(prompts.values()).size, 4);
  assert.match(prompts.get("financial"), /financial and operational/iu);
  assert.match(prompts.get("strategic"), /strategic and competitive/iu);
  assert.match(prompts.get("security"), /security, privacy, and compliance/iu);
  assert.match(prompts.get("full"), /financial, operational, strategic/iu);
});

test("provider and schema failures stop after one attempt with no partial result", async () => {
  for (const outcome of [
    { ok: false, provider: "groq", reason: "network" },
    { ok: false, provider: "groq", reason: "rate_limit" },
    { ok: false, provider: "groq", reason: "unavailable" },
    { ok: false, provider: "groq", reason: "policy" },
    { ok: false, provider: "groq", reason: "timeout" },
    success({ extra: true }),
  ]) {
    let calls = 0;
    const result = await runAnalysis(request(), "key", async () => { calls += 1; return outcome; });
    assert.equal(result.code, "analysis_unavailable");
    assert.equal(calls, 1);
    assert.equal("findings" in result, false);
  }
});

test("wall timeout and invalid input forbid additional provider work", async () => {
  const controller = new AbortController();
  let calls = 0;
  const pending = runAnalysis(request(), "key", async (_value, _key, signal) => new Promise((resolve) => {
    calls += 1;
    signal.addEventListener("abort", () => resolve({ ok: false, provider: "groq", reason: "timeout" }), { once: true });
    queueMicrotask(() => controller.abort());
  }), controller.signal);
  assert.equal((await pending).code, "analysis_timeout");
  assert.equal(calls, 1);
  assert.equal(ANALYSIS_WALL_MS, 180_000);
  assert.equal((await runAnalysis({ ...request(), prompt: "override" }, "key", async () => {
    calls += 1; return success();
  })).code, "analysis_invalid");
  assert.equal(calls, 1);
});

test("orchestrator contains no fallback, persistence, logging, or retry machinery", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(
    new URL("../workers/trusted-runtime/src/analysis-orchestrator.ts", import.meta.url), "utf8"));
  assert.doesNotMatch(source, /openrouter|ctx\.storage|localStorage|indexedDB|console\.|while\s*\(|retry/iu);
  assert.equal((source.match(/await transport\(/gu) ?? []).length, 1);
});
