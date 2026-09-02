import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { callAiProvider } from "../workers/trusted-runtime/src/ai-transport.ts";
import { runAnalysis } from "../workers/trusted-runtime/src/analysis-orchestrator.ts";
import { createOracleRequest } from "../workers/trusted-runtime/src/oracle.ts";
import {
  PROMPT_SECURITY_RULES,
  UNTRUSTED_DATA_BEGIN,
  UNTRUSTED_DATA_END,
} from "../workers/trusted-runtime/src/prompt-boundary.ts";
import { createSteelmanRequest } from "../workers/trusted-runtime/src/steelman.ts";
import { createStrawmanRequest } from "../workers/trusted-runtime/src/strawman.ts";

const corpus = JSON.parse(await readFile(new URL("./fixtures/prompt-injection.json", import.meta.url), "utf8"));
const reference = Object.freeze({ kind: "pdf_page", page: 1 });
const keys = Object.freeze({ groq: "private-groq", openrouter_free: "private-openrouter" });
const strawman = Object.freeze({
  schema_version: "1",
  findings: [{ id: "finding-1", title: "Control gap", analysis: "A control gap remains.",
    confidence: "high", evidence: [reference] }],
  risks: [], assumptions: [], quantitative_candidates: [],
});
const steelman = Object.freeze({
  schema_version: "1",
  items: [{ id: "critique-1", strawman_finding_ids: ["finding-1"], kind: "nuance",
    critique: "The timing is not stated.", evidence: [reference] }],
});
const oracle = Object.freeze({
  schema_version: "1", executive_summary: "The control gap needs attention.",
  findings: [{ id: "oracle-finding-1", title: "Control gap",
    analysis: "The supplied evidence identifies a gap.", confidence: "high", evidence: [reference] }],
  recommendations: [{ id: "recommendation-1", title: "Close the gap",
    action: "Assign and verify the control work.", priority: "high",
    confidence: "high", evidence: [reference] }],
  risks: [], quantitative_candidates: [],
  critique_resolutions: [{ steelman_item_id: "critique-1", status: "unresolved",
    explanation: "The evidence does not state timing." }],
});

function sources(content) {
  return [{ schema_version: "1", ordinal: 1, reference, content }];
}

function analyzeRequest(content) {
  return { schema_version: "1", turnstile_token: "fresh-token", focus: "full",
    requested_outputs: ["pdf"], sources: sources(content) };
}

function promptPayload(content) {
  const prefix = `${UNTRUSTED_DATA_BEGIN}\n`;
  const suffix = `\n${UNTRUSTED_DATA_END}`;
  assert.equal(content.startsWith(prefix) && content.endsWith(suffix), true);
  return JSON.parse(content.slice(prefix.length, -suffix.length));
}

function stageSuccess(provider, stage) {
  const outputs = { strawman, steelman, oracle };
  return { ok: true, provider,
    body: { choices: [{ message: { content: JSON.stringify(outputs[stage]) } }] } };
}

test("the seven-class injection corpus is frozen", () => {
  assert.deepEqual(corpus.map((item) => item.id), [
    "direct-role-override", "indirect-delimiter-escape", "secret-exfiltration",
    "tool-and-control", "html-and-schema", "role-confusion", "signing-control",
  ]);
  const hash = createHash("sha256").update(JSON.stringify(corpus)).digest("hex");
  assert.equal(hash, "da270a2108e9454d6fa10a01bd645378bec28725bbbb71d3d8a55f6065a8affc");
});

test("hostile records remain inert inside one fixed user-data message", () => {
  const systems = { strawman: new Set(), steelman: new Set(), oracle: new Set() };
  for (const fixture of corpus) {
    const stageRequests = {
      strawman: createStrawmanRequest("groq", "full", sources(fixture.content)),
      steelman: createSteelmanRequest("groq", sources(fixture.content), strawman),
      oracle: createOracleRequest("groq", sources(fixture.content), strawman, steelman),
    };
    for (const [stage, request] of Object.entries(stageRequests)) {
      assert.ok(request);
      assert.deepEqual(Object.keys(request), [
        "schema_version", "stage", "provider", "model_id", "messages", "max_output_tokens",
      ]);
      assert.deepEqual(request.messages.map((message) => message.role), ["system", "user"]);
      systems[stage].add(request.messages[0].content);
      assert.equal(request.messages[0].content.includes(fixture.content), false);
      const payload = promptPayload(request.messages[1].content);
      assert.equal(payload.untrusted_sources[0].content, fixture.content);
    }
  }
  assert.deepEqual(Object.values(systems).map((values) => values.size), [1, 1, 1]);
  assert.match(PROMPT_SECURITY_RULES, /no tool, route, network, file, storage, signing, email, or deployment capability/u);
});

test("source-controlled URLs and capabilities cannot alter provider transport", async () => {
  const fixture = corpus.find((item) => item.id === "secret-exfiltration");
  const request = createStrawmanRequest("groq", "full", sources(fixture.content));
  const calls = [];
  const fetcher = async (...args) => {
    calls.push(args);
    return new Response(JSON.stringify({ choices: [{ message: {
      content: JSON.stringify(strawman),
    } }] }), { headers: { "content-type": "application/json" } });
  };
  assert.equal((await callAiProvider(request, "private-key", fetcher)).ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "https://api.groq.com/openai/v1/chat/completions");
  assert.deepEqual(Object.keys(calls[0][1].headers), ["authorization", "content-type"]);
  const body = JSON.parse(calls[0][1].body);
  assert.deepEqual(Object.keys(body), ["model", "messages", "max_tokens", "response_format", "stream"]);
  assert.equal("tools" in body || "url" in body || "route" in body, false);
});

test("hostile sources cannot alter Strawman-Steelman-Oracle order", async () => {
  for (const fixture of corpus) {
    const calls = [];
    const transport = async (request) => {
      calls.push(`${request.stage}:${request.provider}`);
      return stageSuccess(request.provider, request.stage);
    };
    assert.deepEqual(await runAnalysis(analyzeRequest(fixture.content), keys, transport), oracle);
    assert.deepEqual(calls, ["strawman:groq", "steelman:groq", "oracle:groq"]);
  }
});

test("tool, HTML, schema, and signing-control outputs fail at every stage", async () => {
  const maliciousOutputs = {
    strawman: { tool_call: { name: "fetch", arguments: { url: "https://evil.example" } } },
    steelman: { ...steelman, items: [{ ...steelman.items[0], critique: "<script>exfiltrate()</script>" }] },
    oracle: { ...oracle, signing_control: { route: "/sign", replace_pdf: true } },
  };
  const expectedCalls = {
    strawman: ["strawman:groq", "strawman:openrouter_free"],
    steelman: ["strawman:groq", "steelman:groq", "steelman:openrouter_free"],
    oracle: ["strawman:groq", "steelman:groq", "oracle:groq", "oracle:openrouter_free"],
  };
  for (const [attackedStage, malicious] of Object.entries(maliciousOutputs)) {
    const calls = [];
    const transport = async (request) => {
      calls.push(`${request.stage}:${request.provider}`);
      if (request.stage !== attackedStage) return stageSuccess(request.provider, request.stage);
      return { ok: true, provider: request.provider,
        body: { choices: [{ message: { content: JSON.stringify(malicious) } }] } };
    };
    const result = await runAnalysis(analyzeRequest(corpus.at(-1).content), keys, transport);
    assert.equal(result.code, "analysis_unavailable");
    assert.equal("findings" in result, false);
    assert.deepEqual(calls, expectedCalls[attackedStage]);
  }
});
