import assert from "node:assert/strict";
import test from "node:test";

import {
  BROWSER_DAILY_CEILING_MS,
  BROWSER_QUOTA_DATE_KEY,
  BROWSER_QUOTA_TOTAL_KEY,
} from "../workers/trusted-runtime/src/browser-quota.ts";
import {
  MAX_FINAL_PDF_BYTES,
  PDF_RENDER_TIMEOUT_MS,
  PdfRenderTimeoutError,
  renderReportPdf,
} from "../workers/trusted-runtime/src/browser-pdf.ts";
import { FinalPdfQueue } from "../workers/trusted-runtime/src/pdf-queue.ts";
import { produceProductionPdf } from "../workers/trusted-runtime/src/production-pdf.ts";
import { renderReportHtml } from "../workers/trusted-runtime/src/report-html.ts";

class FakeStorage {
  values = new Map();
  events = [];
  async get(keys) {
    this.events.push("quota:get");
    return new Map(keys.filter((key) => this.values.has(key)).map((key) => [key, this.values.get(key)]));
  }
  async put(entries) {
    this.events.push("quota:put");
    for (const [key, value] of Object.entries(entries)) this.values.set(key, value);
  }
  async transaction(callback) { return callback(this); }
}

const reference = Object.freeze({ kind: "pdf_page", page: 1 });
function reportHtml() {
  return renderReportHtml({
    schema_version: "1", focus: "full", title: "Independent review", executive_summary: "Summary.",
    findings: [{ id: "f1", title: "Finding", analysis: "Analysis.", confidence: "high", evidence: [reference] }],
    recommendations: [{ id: "r1", title: "Act", action: "Review.", priority: "high",
      confidence: "high", evidence: [reference] }],
    risks: [], charts: [], verification: { ed25519_key_id: `ed25519:${"a".repeat(32)}`,
      mldsa65_key_id: `mldsa65:${"b".repeat(32)}` },
  });
}

const exactPdf = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF");
function browser(body = exactPdf, options = {}) {
  const calls = [];
  return { calls, binding: { async quickAction(action, input) {
    calls.push({ action, input });
    if (options.error) throw options.error;
    return new Response(body, { status: options.status ?? 200, headers: {
      "content-type": options.contentType ?? "application/pdf",
      "x-browser-ms-used": options.browserMs ?? "3200",
      ...options.headers,
    } });
  } } };
}

test("quota preflight precedes HTML/AI work and exact PDF bytes remain unchanged", async () => {
  const storage = new FakeStorage();
  const target = browser();
  const result = await produceProductionPdf(storage, new FinalPdfQueue(), target.binding, async () => {
    storage.events.push("html:build");
    return reportHtml();
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.bytes, exactPdf);
  assert.deepEqual(storage.events.slice(0, 3), ["quota:get", "quota:put", "html:build"]);
  assert.deepEqual([...storage.values.keys()].sort(), [BROWSER_QUOTA_DATE_KEY, BROWSER_QUOTA_TOTAL_KEY].sort());
  assert.equal(storage.values.get(BROWSER_QUOTA_TOTAL_KEY), 3_200);
  assert.equal(target.calls[0].action, "pdf");
  assert.equal(target.calls[0].input.html, reportHtml());
  assert.equal(target.calls[0].input.actionTimeout, PDF_RENDER_TIMEOUT_MS);
  assert.equal(target.calls[0].input.pdfOptions.timeout, PDF_RENDER_TIMEOUT_MS);
  assert.equal(target.calls[0].input.cacheTTL, 0);
  assert.equal(target.calls[0].input.setJavaScriptEnabled, false);
});

test("malformed, oversized and timeout outputs fail closed", async () => {
  const malformed = browser("%PDF-1.7 without trailer");
  assert.deepEqual(await renderReportPdf(malformed.binding, reportHtml()),
    { ok: false, reason: "invalid_output", browserMs: 3200 });
  const oversized = browser(exactPdf, { headers: { "content-length": String(MAX_FINAL_PDF_BYTES + 1) } });
  assert.deepEqual(await renderReportPdf(oversized.binding, reportHtml()),
    { ok: false, reason: "invalid_output", browserMs: 3200 });
  const timeout = await renderReportPdf(browser().binding, reportHtml(), async () => {
    throw new PdfRenderTimeoutError("deadline");
  });
  assert.deepEqual(timeout, { ok: false, reason: "timeout" });
});

test("quota exhaustion and queue saturation do not call Browser Run", async () => {
  const storage = new FakeStorage();
  storage.values.set(BROWSER_QUOTA_DATE_KEY, new Date().toISOString().slice(0, 10));
  storage.values.set(BROWSER_QUOTA_TOTAL_KEY, BROWSER_DAILY_CEILING_MS);
  const target = browser();
  let htmlCalls = 0;
  const exhausted = await produceProductionPdf(storage, new FinalPdfQueue(), target.binding, async () => {
    htmlCalls += 1; return reportHtml();
  });
  assert.deepEqual(exhausted, { ok: false, reason: "quota" });
  assert.equal(htmlCalls, 0);
  const fresh = new FakeStorage();
  const fullQueue = { async run() { return { ok: false, reason: "full" }; } };
  assert.deepEqual(await produceProductionPdf(fresh, fullQueue, target.binding, async () => reportHtml()),
    { ok: false, reason: "busy" });
  assert.equal(target.calls.length, 0);
  assert.equal(fresh.values.get(BROWSER_QUOTA_TOTAL_KEY), 0);
});

test("a crashed Browser Run conservatively settles the full reservation", async () => {
  const storage = new FakeStorage();
  const crashed = browser(exactPdf, { error: new Error("browser crashed") });
  assert.deepEqual(await produceProductionPdf(storage, new FinalPdfQueue(), crashed.binding,
    async () => reportHtml()), { ok: false, reason: "render" });
  assert.equal(storage.values.get(BROWSER_QUOTA_TOTAL_KEY), 60_000);
  assert.deepEqual([...storage.values.keys()].sort(), [BROWSER_QUOTA_DATE_KEY, BROWSER_QUOTA_TOTAL_KEY].sort());
});

test("measured Browser Run timing corpus remains below the five-second median target", async () => {
  const timings = [166, 458, 106, 99, 182];
  const measured = [];
  for (const browserMs of timings) {
    const result = await renderReportPdf(browser(exactPdf, { browserMs: String(browserMs) }).binding, reportHtml());
    assert.equal(result.ok, true);
    measured.push(result.browserMs);
  }
  measured.sort((left, right) => left - right);
  assert.equal(measured[Math.floor(measured.length / 2)], 166);
  assert.ok(measured[Math.floor(measured.length / 2)] <= 5_000);
});
