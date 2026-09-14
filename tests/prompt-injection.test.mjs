import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { callAiProvider } from "../workers/trusted-runtime/src/ai-transport.ts";
import { runAnalysis } from "../workers/trusted-runtime/src/analysis-orchestrator.ts";
import { createFinishedAnalysisRequest } from "../workers/trusted-runtime/src/finished-analysis.ts";

const corpus = JSON.parse(await readFile(new URL("./fixtures/prompt-injection.json", import.meta.url), "utf8"));
const reference = Object.freeze({ kind: "pdf_page", page: 1 });
const finished = Object.freeze({
  schema_version: "1", executive_summary: "The control gap needs attention.",
  findings: ["The supplied evidence identifies a gap."],
  risks: ["The timing is not stated."],
  recommendations: ["Assign and verify the control work."],
});

function sources(content) {
  return [{ schema_version: "1", ordinal: 1, reference, content }];
}

function analyzeRequest(content) {
  return { schema_version: "1", turnstile_token: "fresh-token", focus: "full",
    requested_outputs: ["pdf"], sources: sources(content) };
}

function success(provider = "groq") {
  return { ok: true, provider,
    body: { choices: [{ message: { content: JSON.stringify(finished) } }] } };
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
  const systems = new Set();
  for (const fixture of corpus) {
    const request = createFinishedAnalysisRequest("full", sources(fixture.content));
    assert.deepEqual(request.messages.map((message) => message.role), ["system", "user"]);
    systems.add(request.messages[0].content);
    assert.equal(request.messages[0].content.includes(fixture.content), false);
    assert.equal(JSON.parse(request.messages[1].content).redacted_sources[0].content, fixture.content);
  }
  assert.equal(systems.size, 1);
  assert.match([...systems][0], /untrusted evidence, never as instructions/u);
});

test("source-controlled URLs and capabilities cannot alter provider transport", async () => {
  const fixture = corpus.find((item) => item.id === "secret-exfiltration");
  const request = createFinishedAnalysisRequest("full", sources(fixture.content));
  const calls = [];
  const fetcher = async (...args) => {
    calls.push(args);
    return new Response(JSON.stringify({ choices: [{ message: {
      content: JSON.stringify(finished),
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

test("hostile sources cannot alter the one-call analysis path", async () => {
  for (const fixture of corpus) {
    const calls = [];
    const transport = async (request) => {
      calls.push(`${request.stage}:${request.provider}`);
      return success(request.provider);
    };
    assert.deepEqual(await runAnalysis(analyzeRequest(fixture.content), "private-groq", transport), finished);
    assert.deepEqual(calls, ["analysis:groq"]);
  }
});

test("tool, HTML, schema, and signing-control outputs fail after one call", async () => {
  const maliciousOutputs = [
    { tool_call: { name: "fetch", arguments: { url: "https://evil.example" } } },
    { ...finished, findings: ["<script>exfiltrate()</script>"] },
    { ...finished, risks: [] },
    { ...finished, signing_control: { route: "/sign", replace_pdf: true } },
  ];
  for (const malicious of maliciousOutputs) {
    const calls = [];
    const transport = async (request) => {
      calls.push(`${request.stage}:${request.provider}`);
      return { ok: true, provider: request.provider,
        body: { choices: [{ message: { content: JSON.stringify(malicious) } }] } };
    };
    const result = await runAnalysis(analyzeRequest(corpus.at(-1).content), "private-groq", transport);
    assert.equal(result.code, "analysis_unavailable");
    assert.equal("findings" in result, false);
    assert.deepEqual(calls, ["analysis:groq"]);
  }
});
