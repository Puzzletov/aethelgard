import assert from "node:assert/strict";
import test from "node:test";

import {
  ANALYSIS_WALL_MS,
  MAX_PROVIDER_ATTEMPTS_PER_STAGE,
  MAX_PROVIDER_ATTEMPTS_TOTAL,
  runAnalysis,
} from "../workers/trusted-runtime/src/analysis-orchestrator.ts";

const reference = Object.freeze({ kind: "pdf_page", page: 1 });
const sources = Object.freeze([Object.freeze({
  schema_version: "1", ordinal: 1, reference,
  content: "Revenue rose by 12 percent while one control remained incomplete.",
})]);
const request = Object.freeze({
  schema_version: "1", turnstile_token: "fresh-token", focus: "full",
  requested_outputs: ["pdf"], sources,
});
const keys = Object.freeze({ groq: "private-groq", openrouter_free: "private-openrouter" });

const stageOutputs = Object.freeze({
  strawman: {
    schema_version: "1",
    findings: [{ id: "finding-1", title: "Revenue rose", analysis: "Revenue rose.",
      confidence: "high", evidence: [reference] }],
    risks: [], assumptions: [], quantitative_candidates: [],
  },
  steelman: {
    schema_version: "1",
    items: [{ id: "critique-1", strawman_finding_ids: ["finding-1"], kind: "nuance",
      critique: "The control gap qualifies the finding.", evidence: [reference] }],
  },
  oracle: {
    schema_version: "1",
    executive_summary: "Growth is positive but control execution needs attention.",
    findings: [{ id: "oracle-finding-1", title: "Qualified growth",
      analysis: "Growth is supported while the control gap remains material.",
      confidence: "high", evidence: [reference] }],
    recommendations: [{ id: "recommendation-1", title: "Close the control gap",
      action: "Assign and verify the remaining control work.", priority: "high",
      confidence: "high", evidence: [reference] }],
    risks: [], quantitative_candidates: [],
    critique_resolutions: [{ steelman_item_id: "critique-1", status: "resolved",
      explanation: "The final finding states the control qualification." }],
  },
});

function success(provider, stage, value = stageOutputs[stage]) {
  return {
    ok: true,
    provider,
    body: { choices: [{ message: { content: JSON.stringify(value) } }] },
  };
}

function scheduledTransport(outcomes = {}) {
  const calls = [];
  return {
    calls,
    transport: async (stageRequest, _key, signal) => {
      calls.push({ stage: stageRequest.stage, provider: stageRequest.provider, signal });
      const key = `${stageRequest.stage}:${stageRequest.provider}`;
      const outcome = outcomes[key] ?? "success";
      if (outcome === "failure") {
        return { ok: false, provider: stageRequest.provider, reason: "unavailable" };
      }
      if (["timeout", "network", "rate_limit", "unavailable", "policy"].includes(outcome)) {
        return { ok: false, provider: stageRequest.provider, reason: outcome };
      }
      if (outcome === "invalid") return success(stageRequest.provider, stageRequest.stage, { invalid: true });
      if (outcome === "throw") throw new Error("transport failure");
      return success(stageRequest.provider, stageRequest.stage);
    },
  };
}

const outageReasons = Object.freeze(["timeout", "network", "rate_limit", "unavailable", "policy", "invalid"]);
const stages = Object.freeze(["strawman", "steelman", "oracle"]);
const analysisSafeMode = Object.freeze({ schema_version: "1", ok: false, category: "analysis",
  code: "analysis_unavailable", message: "Analysis is unavailable. Try again later.", retry: "later" });

function routes(calls) {
  return calls.map(({ stage, provider }) => `${stage}:${provider}`);
}

test("normal analysis uses exactly three Groq calls and returns only Oracle", async () => {
  const harness = scheduledTransport();
  const result = await runAnalysis(request, keys, harness.transport);
  assert.deepEqual(result, stageOutputs.oracle);
  assert.deepEqual(harness.calls.map(({ stage, provider }) => `${stage}:${provider}`), [
    "strawman:groq", "steelman:groq", "oracle:groq",
  ]);
  assert.equal(harness.calls.every((call) => call.signal instanceof AbortSignal), true);
});

test("a failed Groq provider is never resurrected during the request", async () => {
  const harness = scheduledTransport({ "strawman:groq": "failure" });
  assert.deepEqual(await runAnalysis(request, keys, harness.transport), stageOutputs.oracle);
  assert.deepEqual(harness.calls.map(({ stage, provider }) => `${stage}:${provider}`), [
    "strawman:groq", "strawman:openrouter_free",
    "steelman:openrouter_free", "oracle:openrouter_free",
  ]);
});

test("each stage failure permutation remains finite and ordered", async () => {
  const cases = [
    { "strawman:groq": "failure" },
    { "steelman:groq": "failure" },
    { "oracle:groq": "failure" },
    { "strawman:groq": "invalid" },
    { "steelman:groq": "invalid" },
    { "oracle:groq": "invalid" },
  ];
  for (const outcomes of cases) {
    const harness = scheduledTransport(outcomes);
    assert.deepEqual(await runAnalysis(request, keys, harness.transport), stageOutputs.oracle);
    assert.ok(harness.calls.length <= MAX_PROVIDER_ATTEMPTS_TOTAL);
    for (const stage of ["strawman", "steelman", "oracle"]) {
      assert.ok(harness.calls.filter((call) => call.stage === stage).length <= MAX_PROVIDER_ATTEMPTS_PER_STAGE);
    }
  }
});

test("every provider outage class at every stage obeys exact fallback and terminal policy", async () => {
  for (const stage of stages) {
    for (const reason of outageReasons) {
      const groq = scheduledTransport({ [`${stage}:groq`]: reason });
      assert.deepEqual(await runAnalysis(request, keys, groq.transport), stageOutputs.oracle);
      const groqRoutes = routes(groq.calls);
      const failedIndex = groqRoutes.indexOf(`${stage}:groq`);
      assert.equal(groqRoutes[failedIndex + 1], `${stage}:openrouter_free`);
      assert.equal(groqRoutes.slice(failedIndex + 1).some((route) => route.endsWith(":groq")), false);
      assert.ok(groq.calls.length <= MAX_PROVIDER_ATTEMPTS_TOTAL);

      const terminal = scheduledTransport({ [`${stage}:groq`]: reason, [`${stage}:openrouter_free`]: reason });
      assert.deepEqual(await runAnalysis(request, keys, terminal.transport), analysisSafeMode);
      const terminalRoutes = routes(terminal.calls);
      assert.deepEqual(terminalRoutes.slice(-2), [`${stage}:groq`, `${stage}:openrouter_free`]);
      assert.equal(terminalRoutes.some((route) => stages.indexOf(route.split(":")[0]) > stages.indexOf(stage)), false);
      assert.ok(terminal.calls.length <= MAX_PROVIDER_ATTEMPTS_TOTAL);
      for (const current of stages) {
        assert.ok(terminal.calls.filter((call) => call.stage === current).length <= MAX_PROVIDER_ATTEMPTS_PER_STAGE);
      }
    }
  }
});

test("invalid schema is a hard provider failure and fallback is validated", async () => {
  const harness = scheduledTransport({ "strawman:groq": "invalid" });
  assert.deepEqual(await runAnalysis(request, keys, harness.transport), stageOutputs.oracle);
  assert.deepEqual(harness.calls.slice(0, 2).map((call) => call.provider),
    ["groq", "openrouter_free"]);
  assert.equal(harness.calls.filter((call) => call.provider === "groq").length, 1);
});

test("terminal provider faults stop later stages without partial output", async () => {
  for (const outcomes of [
    { "strawman:groq": "failure", "strawman:openrouter_free": "failure" },
    { "steelman:groq": "failure", "steelman:openrouter_free": "failure" },
    { "strawman:groq": "failure", "steelman:openrouter_free": "failure" },
    { "oracle:groq": "throw", "oracle:openrouter_free": "failure" },
  ]) {
    const harness = scheduledTransport(outcomes);
    const result = await runAnalysis(request, keys, harness.transport);
    assert.deepEqual(result, {
      schema_version: "1", ok: false, category: "analysis",
      code: "analysis_unavailable", message: "Analysis is unavailable. Try again later.", retry: "later",
    });
    const failedStage = Object.keys(outcomes).at(-1).split(":")[0];
    const failedIndex = ["strawman", "steelman", "oracle"].indexOf(failedStage);
    assert.equal(harness.calls.some((call) =>
      ["strawman", "steelman", "oracle"].indexOf(call.stage) > failedIndex), false);
    assert.ok(harness.calls.length <= MAX_PROVIDER_ATTEMPTS_TOTAL);
  }
});

test("the 180-second wall signal cancels analysis and forbids later stages", async () => {
  const controller = new AbortController();
  const calls = [];
  const transport = (_stageRequest, _key, signal) => new Promise((resolve) => {
    calls.push(signal);
    signal.addEventListener("abort", () => resolve({
      ok: false, provider: "groq", reason: "timeout",
    }), { once: true });
    queueMicrotask(() => controller.abort());
  });
  const result = await runAnalysis(request, keys, transport, controller.signal);
  assert.equal(ANALYSIS_WALL_MS, 180_000);
  assert.equal(calls.length, 1);
  assert.equal(result.code, "analysis_timeout");
  assert.equal("findings" in result, false);
});

test("invalid input stops before providers and request state is never persisted", async () => {
  const harness = scheduledTransport();
  const result = await runAnalysis({ ...request, prompt: "override" }, keys, harness.transport);
  assert.equal(result.code, "analysis_invalid");
  assert.equal(harness.calls.length, 0);
  const source = await import("node:fs/promises").then((fs) => fs.readFile(
    new URL("../workers/trusted-runtime/src/analysis-orchestrator.ts", import.meta.url), "utf8"));
  assert.doesNotMatch(source, /ctx\.storage|localStorage|indexedDB|console\.|setTimeout|while\s*\(/iu);
  assert.doesNotMatch(source, /paid|BYOK|retry/iu);
});
