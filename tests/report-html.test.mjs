import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { MAX_REPORT_SECTIONS } from "../src/contracts/report-model.ts";
import { renderReportHtml } from "../workers/trusted-runtime/src/report-html.ts";

const reference = Object.freeze({ kind: "pdf_page", page: 2 });
const verification = Object.freeze({
  ed25519_key_id: `ed25519:${"a".repeat(32)}`,
  mldsa65_key_id: `mldsa65:${"b".repeat(32)}`,
});

function model() {
  return {
    schema_version: "1", focus: "full", title: "Independent project review",
    executive_summary: "Evidence supports a careful decision.",
    findings: [{ id: "finding-1", title: "Material finding", analysis: "The evidence is consistent.",
      confidence: "high", evidence: [reference] }],
    recommendations: [{ id: "recommendation-1", title: "Act carefully", action: "Verify the evidence.",
      priority: "high", confidence: "high", evidence: [reference] }],
    risks: [{ id: "risk-1", text: "Execution may be delayed.", confidence: "medium", evidence: [reference] }],
    charts: [{ schema_version: "1", id: "chart-1", title: "Annual value", unit: "GBP", kind: "bar",
      points: [{ label: "Current", value: 12.5, evidence: [reference] }] }],
    verification,
  };
}

test("report HTML matches golden bytes and deterministic section order", () => {
  const first = renderReportHtml(model());
  const second = renderReportHtml(structuredClone(model()));
  assert.equal(first, second);
  assert.equal(createHash("sha256").update(first).digest("hex"),
    "7a1eb1a3d91a980b75ddcbaac161eebee2fc1ad062ad7c784c83926033c1c9a7");
  const headings = [...first.matchAll(/<h2>([^<]+)<\/h2>/gu)].map((match) => match[1]);
  assert.deepEqual(headings, ["Executive summary", "Findings", "Recommendations", "Risks", "Quantitative analysis"]);
  assert.ok((first.match(/<section>/gu) ?? []).length <= MAX_REPORT_SECTIONS);
  assert.match(first, /@page\{size:A4;margin:18mm\}/u);
});

test("every caller string is escaped and caller HTML is rejected", () => {
  const value = model();
  value.title = `5 < 7 & "quoted" 'exact'`;
  value.charts[0].points[0].label = "A < B & C";
  const html = renderReportHtml(value);
  assert.match(html, /5 &lt; 7 &amp; &quot;quoted&quot; &#39;exact&#39;/u);
  assert.match(html, /A &lt; B &amp; C/u);
  assert.doesNotMatch(html, /5 < 7|A < B/u);
  assert.equal(renderReportHtml({ ...model(), title: "<script>alert(1)</script>" }), undefined);
  assert.equal(renderReportHtml({ ...model(), caller_html: "<p>unsafe</p>" }), undefined);
});

test("template has fixed CSP and no script, remote resource, or arbitrary URL path", () => {
  const html = renderReportHtml(model());
  assert.match(html, /Content-Security-Policy/u);
  assert.match(html, /default-src 'none'; style-src 'unsafe-inline'/u);
  assert.doesNotMatch(html, /<script|<link|<img|src=|href=|https?:|@import|url\(/iu);
  assert.match(html, /Ed25519: ed25519:a{32}/u);
  assert.match(html, /ML-DSA-65: mldsa65:b{32}/u);
});

test("schema and byte bounds fail closed atomically", () => {
  assert.equal(renderReportHtml({ ...model(), focus: "custom" }), undefined);
  assert.equal(renderReportHtml({ ...model(), charts: Array.from({ length: 9 }, () => model().charts[0]) }), undefined);
  const oversized = model();
  oversized.executive_summary = '"'.repeat(199_000);
  assert.equal(renderReportHtml(oversized), undefined);
});
