import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { build } from "esbuild";

const directory = await mkdtemp(path.join(tmpdir(), "aethelgard-mission-test-"));
const output = path.join(directory, "mission.mjs");
const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
await build({ absWorkingDir: repository, entryPoints: ["./frontend/analysis/browser-mission.ts"],
  bundle: true, platform: "node", format: "esm", target: "node22", outfile: output, logLevel: "silent" });
const { runBrowserMission } = await import(pathToFileURL(output));
test.after(async () => rm(directory, { recursive: true, force: true }));

const reference = Object.freeze({ kind: "txt_lines", line_start: 1, line_end: 1 });
const english = "This independent project analysis explains the evidence, material risks, controls, and practical recommendations clearly for careful executive review.";
const parsed = Object.freeze({ ok: true, value: { ok: true, schema_version: "1", format: "txt",
  sources: [{ line_start: 1, line_end: 1, content: english }] } });
const document = Object.freeze({ format: "txt", byteLength: 4,
  file: Object.freeze({ arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer }) });

function oracle(content = "A careful result.") {
  return { schema_version: "1", executive_summary: content,
    findings: [{ id: "finding-1", title: "Finding", analysis: "Analysis", confidence: "high", evidence: [reference] }],
    recommendations: [{ id: "recommendation-1", title: "Act", action: "Review evidence", priority: "high",
      confidence: "high", evidence: [reference] }], risks: [], quantitative_candidates: [],
    critique_resolutions: [{ steelman_item_id: "critique-1", status: "resolved", explanation: "Resolved" }] };
}

test("valid local flow sends only canonical redacted sources and reports every stage", async () => {
  const stages = [];
  let request;
  const result = await runBrowserMission(document, "full", ["pdf"], "fresh-token",
    (stage) => stages.push(stage), {
      parseDocument: async () => parsed,
      redact: async ({ sources }) => ({ schema_version: "1", sources: sources.map((source) =>
        ({ ...source, content: "[PERSON_1] provided a careful project analysis and clear recommendations for executive review." })),
      placeholder_count: 1, must_redact_leaks: 0 }),
      send: async (body) => { request = JSON.parse(new TextDecoder().decode(body)); return oracle(); },
    });
  assert.deepEqual(stages, ["local_parse", "language", "redaction", "verification", "analysis", "complete"]);
  assert.equal(request.turnstile_token, "fresh-token");
  assert.equal(request.sources[0].content.includes("[PERSON_1]"), true);
  assert.equal(JSON.stringify(request).includes(english), false);
  assert.equal(result.result.executive_summary, "A careful result.");
  assert.equal(result.sources[0].content.includes("[PERSON_1]"), true);
});

test("local document and privacy failures forbid the network", async () => {
  let sends = 0;
  const common = { redact: async () => { throw new Error("unreached"); },
    send: async () => { sends += 1; return oracle(); } };
  const invalid = await runBrowserMission(document, "full", ["pdf"], "token", () => undefined,
    { ...common, parseDocument: async () => ({ ok: false, reason: "crash" }) });
  assert.equal(invalid.result.category, "document");
  const privacy = await runBrowserMission(document, "full", ["pdf"], "token", () => undefined, {
    parseDocument: async () => parsed,
    redact: async () => ({ schema_version: "1", ok: false, category: "privacy", code: "redaction_failed",
      message: "Private information could not be removed safely.", retry: "fresh_document" }),
    send: common.send,
  });
  assert.equal(privacy.result.category, "privacy");
  assert.equal(sends, 0);
});
