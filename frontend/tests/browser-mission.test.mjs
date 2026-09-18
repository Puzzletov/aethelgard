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
const { ANALYZE_ENDPOINT, runBrowserMission } = await import(pathToFileURL(output));
test.after(async () => rm(directory, { recursive: true, force: true }));

test("production analysis targets only the approved public Worker", async () => {
  assert.equal(ANALYZE_ENDPOINT, "https://aethelgard.justbwas.workers.dev/analyze");
  const source = await import("node:fs/promises").then(({ readFile }) =>
    readFile(new URL("../analysis/browser-mission.ts", import.meta.url), "utf8"));
  assert.match(source, /fetch\(ANALYZE_ENDPOINT,/u);
  assert.doesNotMatch(source, /fetch\(["'`]\/analyze/u);
  assert.deepEqual(source.match(/https:\/\/[^"'`]+/gu), [ANALYZE_ENDPOINT,
    "https://aethelgard-managed-golden-edge.justbwas.workers.dev/analyze"]);
  assert.match(source, /NEXT_PUBLIC_AETHELGARD_SIMPLE_BETA === "1"/u);
});

const english = "This independent project analysis explains the evidence, material risks, controls, and practical recommendations clearly for careful executive review.";
const parsed = Object.freeze({ ok: true, value: { ok: true, schema_version: "1", format: "txt",
  sources: [{ line_start: 1, line_end: 1, content: english }] } });
const document = Object.freeze({ format: "txt", byteLength: 4,
  file: Object.freeze({ arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer }) });

function oracle(content = "A careful result.") {
  return { schema_version: "1", executive_summary: content,
    findings: ["Finding: Analysis"], risks: ["Material delivery risk"],
    recommendations: ["Review evidence"] };
}

test("valid local flow sends only canonical redacted sources and reports every stage", async () => {
  const stages = [];
  let request;
  const result = await runBrowserMission(document, "full", "fresh-token",
    (stage) => stages.push(stage), {
      parseDocument: async () => parsed,
      redact: async ({ sources }) => ({ schema_version: "1", sources: sources.map((source) =>
        ({ ...source, content: "[PERSON_1] provided a careful project analysis and clear recommendations for executive review." })),
      placeholder_count: 1, must_redact_leaks: 0 }),
      send: async (body) => { request = JSON.parse(new TextDecoder().decode(body)); return oracle(); },
    });
  assert.deepEqual(stages, ["preparing", "analyzing", "reporting", "complete"]);
  assert.equal(request.turnstile_token, "fresh-token");
  assert.equal(request.sources[0].content.includes("[PERSON_1]"), true);
  assert.equal(JSON.stringify(request).includes(english), false);
  assert.equal(result.result.executive_summary, "A careful result.");
  assert.equal(result.sources[0].content.includes("[PERSON_1]"), true);
});

test("zero-PII PDF and TXT content reaches exactly one analysis unchanged", async () => {
  for (const format of ["pdf", "txt"]) {
    const safe = "This independent business analysis explains revenue growth, supplier concentration, delivery risk, internal controls, and practical recommendations for executive review.";
    const parsedSafe = { ok: true, value: format === "pdf"
      ? { ok: true, schema_version: "1", format, pages: [{ page: 1, content: safe }] }
      : { ok: true, schema_version: "1", format, sources: [{ line_start: 1, line_end: 1, content: safe }] } };
    let sends = 0;
    let outbound;
    const result = await runBrowserMission({ ...document, format }, "full", "token", () => undefined, {
      parseDocument: async () => parsedSafe,
      redact: async ({ sources }) => ({ schema_version: "1", sources,
        placeholder_count: 0, must_redact_leaks: 0 }),
      send: async (body) => { sends += 1; outbound = JSON.parse(new TextDecoder().decode(body)); return oracle(); },
    });
    assert.equal(sends, 1);
    assert.equal(outbound.sources[0].content, safe);
    assert.equal(result.result.executive_summary, "A careful result.");
    assert.equal(result.diagnostic, undefined);
  }
});

test("PDF preparation failures expose only bounded local stage diagnostics", async () => {
  const pdfDocument = { ...document, format: "pdf" };
  const pdfValue = (content) => ({ ok: true, value: { ok: true, schema_version: "1",
    format: "pdf", pages: [{ page: 2, content }] } });
  const french = "Cette analyse indépendante explique clairement les preuves, les risques matériels, les contrôles internes et les recommandations pratiques pour une décision prudente.";
  const cases = [
    { stage: "EXTRACTION", reason: "pdf_parse_failed",
      parseDocument: async () => ({ ok: true, value: { ok: false, code: "pdf_parse_failed" } }) },
    { stage: "NORMALIZATION", reason: "invalid_document",
      parseDocument: async () => pdfValue("") },
    { stage: "LANGUAGE", reason: "non_english", parseDocument: async () => pdfValue(french) },
    { stage: "REDACTION", reason: "transformation_error", parseDocument: async () => pdfValue(english),
      redact: async () => ({ schema_version: "1", ok: false, category: "privacy",
        code: "redaction_failed", message: "Private information could not be removed safely.",
        retry: "fresh_document", diagnostic_reason: "transformation_error" }) },
    { stage: "OUTBOUND_PREPARATION", reason: "redaction_failed", parseDocument: async () => pdfValue(english),
      redact: async ({ sources }) => ({ schema_version: "1", sources: sources.map((source) =>
        ({ ...source, content: "unsafe@example.invalid" })), placeholder_count: 1, must_redact_leaks: 0 }) },
  ];
  for (const item of cases) {
    let sends = 0;
    const result = await runBrowserMission(pdfDocument, "full", "token", () => undefined, {
      parseDocument: item.parseDocument,
      redact: item.redact ?? (async () => { throw new Error("not_reached"); }),
      send: async () => { sends += 1; return oracle(); },
    });
    assert.equal(result.diagnostic.stage, item.stage);
    assert.equal(result.diagnostic.reason_code, item.reason);
    assert.equal(result.diagnostic.file_type, "PDF");
    assert.equal(result.diagnostic.file_size_bytes, 4);
    assert.deepEqual(Object.keys(result.diagnostic).sort(), ["completed_replacement_count",
      "extracted_char_count", "extracted_word_count", "file_size_bytes", "file_type", "language_gate", "language_top_rank",
      "match_representation", "must_redact_origin", "must_redact_rule", "outbound_ready",
      "pdf_nonempty_pages", "pdf_page_count", "pii_detected_count", "planned_replacement_count",
      "post_transform_match_count", "pre_transform_match_count", "reason_code", "redaction_status",
      "source_record_count", "span_alignment", "stage"]);
    assert.doesNotMatch(JSON.stringify(result.diagnostic), /filename|content|mapping|token|prompt|response/iu);
    assert.equal(sends, 0);
  }
});

test("local document and privacy failures forbid the network", async () => {
  let sends = 0;
  const common = { redact: async () => { throw new Error("unreached"); },
    send: async () => { sends += 1; return oracle(); } };
  const invalid = await runBrowserMission(document, "full", "token", () => undefined,
    { ...common, parseDocument: async () => ({ ok: false, reason: "invalid" }) });
  assert.equal(invalid.result.category, "document");
  const privacy = await runBrowserMission(document, "full", "token", () => undefined, {
    parseDocument: async () => parsed,
    redact: async () => ({ schema_version: "1", ok: false, category: "privacy", code: "redaction_failed",
      message: "Private information could not be removed safely.", retry: "fresh_document",
      diagnostic_reason: "transformation_error" }),
    send: common.send,
  });
  assert.equal(privacy.result.category, "privacy");
  assert.equal(sends, 0);
});

for (const reason of ["crash", "timeout", "allocation"]) {
  test(`one fresh parser Worker recovers after ${reason}`, async () => {
    let attempts = 0;
    let sends = 0;
    const result = await runBrowserMission(document, "full", "token", () => undefined, {
      parseDocument: async () => (++attempts === 1 ? { ok: false, reason } : parsed),
      redact: async ({ sources }) => ({ schema_version: "1", sources,
        placeholder_count: 0, must_redact_leaks: 0 }),
      send: async () => { sends += 1; return oracle(); },
    });
    assert.equal(result.result.executive_summary, "A careful result.");
    assert.equal(attempts, 2);
    assert.equal(sends, 1);
  });
}

for (const reason of ["crash", "timeout", "allocation"]) {
  test(`a second ${reason} stops in labelled client-resource Safe Mode`, async () => {
    let attempts = 0;
    let redactions = 0;
    let sends = 0;
    const result = await runBrowserMission(document, "full", "token", () => undefined, {
      parseDocument: async () => { attempts += 1; return { ok: false, reason }; },
      redact: async () => { redactions += 1; throw new Error("forbidden"); },
      send: async () => { sends += 1; return oracle(); },
    });
    assert.equal(result.result.category, "client_resource");
    assert.equal(result.result.code, "parser_resource_failed");
    assert.equal(attempts, 2);
    assert.equal(redactions, 0);
    assert.equal(sends, 0);
  });
}

test("invalid documents do not consume the resource retry", async () => {
  let attempts = 0;
  const result = await runBrowserMission(document, "full", "token", () => undefined, {
    parseDocument: async () => { attempts += 1; return { ok: false, reason: "invalid" }; },
    redact: async () => { throw new Error("forbidden"); }, send: async () => oracle(),
  });
  assert.equal(result.result.category, "document");
  assert.equal(attempts, 1);
});

test("redaction and analysis exceptions have zero local retry and fixed Safe Mode", async () => {
  let redactions = 0;
  let sends = 0;
  const privacy = await runBrowserMission(document, "full", "token", () => undefined, {
    parseDocument: async () => parsed,
    redact: async () => { redactions += 1; throw new Error("private value"); },
    send: async () => { sends += 1; return oracle(); },
  });
  assert.equal(privacy.result.category, "privacy");
  assert.equal(redactions, 1);
  assert.equal(sends, 0);
  const analysis = await runBrowserMission(document, "full", "token", () => undefined, {
    parseDocument: async () => parsed,
    redact: async ({ sources }) => ({ schema_version: "1", sources,
      placeholder_count: 0, must_redact_leaks: 0 }),
    send: async () => { sends += 1; throw new Error("provider secret"); },
  });
  assert.equal(analysis.result.category, "analysis");
  assert.equal(analysis.result.message, "Analysis temporarily unavailable.");
  assert.equal(sends, 1);
});
