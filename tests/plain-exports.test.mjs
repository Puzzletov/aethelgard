import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { MAX_TEXT_OUTPUT_BYTES, writeReportMarkdown,
  writeReportText } from "../workers/trusted-runtime/src/plain-exports.ts";

const UTF8 = new TextDecoder();
const reference = Object.freeze({ kind: "txt_lines", line_start: 2, line_end: 4 });
function model() {
  return { schema_version: "1", focus: "strategic", title: "Review — 東京",
    executive_summary: "Evidence supports a careful choice.",
    findings: [{ id: "f1", title: "Finding", analysis: "Analysis.", confidence: "high", evidence: [reference] }],
    recommendations: [{ id: "r1", title: "Act", action: "Review.", priority: "high",
      confidence: "high", evidence: [reference] }],
    risks: [{ id: "risk1", text: "Delay.", confidence: "medium", evidence: [reference] }],
    charts: [{ schema_version: "1", id: "c1", title: "Value", unit: "GBP", kind: "bar",
      points: [{ label: "Current", value: 12.5, evidence: [reference] }] }],
    verification: { ed25519_key_id: `ed25519:${"a".repeat(32)}`,
      mldsa65_key_id: `mldsa65:${"b".repeat(32)}` } };
}

test("plain text and Markdown match deterministic golden UTF-8 bytes", () => {
  const text = writeReportText(model());
  const markdown = writeReportMarkdown(model());
  assert.ok(text instanceof Uint8Array && markdown instanceof Uint8Array);
  assert.equal(createHash("sha256").update(text).digest("hex"),
    "dc12b10eccfc02bcfa33b96430830123ddc6cfad62fd1c02dcb91da9b64e10e5");
  assert.equal(createHash("sha256").update(markdown).digest("hex"),
    "6a345cebc977cce6e05ea3aff6a76ee3708e1c710034f24360d4b7df55c078e1");
  assert.equal(UTF8.decode(text).includes("Review — 東京"), true);
  assert.deepEqual(writeReportText(structuredClone(model())), text);
  assert.deepEqual(writeReportMarkdown(structuredClone(model())), markdown);
});

test("fixed headings, order and structural references are preserved", () => {
  const text = UTF8.decode(writeReportText(model()));
  const headings = ["EXECUTIVE SUMMARY", "FINDINGS", "RECOMMENDATIONS", "RISKS",
    "QUANTITATIVE ANALYSIS", "VERIFICATION"];
  assert.deepEqual(headings.map((heading) => text.indexOf(heading)),
    [...headings.map((heading) => text.indexOf(heading))].sort((left, right) => left - right));
  assert.match(text, /Evidence: TXT lines 2–4/u);
  assert.match(text, /Current: 12\.5 GBP/u);
});

test("Markdown controls and URI schemes are escaped without HTML or links", () => {
  const value = model();
  value.title = "# [Review](javascript:alert) 5 < 7 > 3";
  value.findings[0].analysis = "*bold* https://invalid.example C:\\private\\file";
  const markdown = UTF8.decode(writeReportMarkdown(value));
  assert.ok(markdown.includes("\\# \\[Review\\]\\(javascript\\:alert\\) 5 \\< 7 \\> 3"));
  assert.ok(markdown.includes("\\*bold\\* https\\://invalid\\.example"));
  assert.ok(markdown.includes("C:\\\\private\\\\file"));
  assert.doesNotMatch(markdown, /\[Review\]\(javascript:|https:\/\/|5 < 7/iu);
});

test("invalid and oversized models fail closed atomically", () => {
  assert.equal(writeReportText({ ...model(), unknown: true }), undefined);
  assert.equal(writeReportMarkdown({ ...model(), executive_summary: "x".repeat(200_001) }), undefined);
  assert.ok(writeReportText(model()).byteLength <= MAX_TEXT_OUTPUT_BYTES);
  assert.ok(writeReportMarkdown(model()).byteLength <= MAX_TEXT_OUTPUT_BYTES);
});
