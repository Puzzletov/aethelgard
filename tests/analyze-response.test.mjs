import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { MAX_ANALYSIS_RESPONSE_BYTES,
  createAnalyzeResponse } from "../workers/trusted-runtime/src/analyze-response.ts";

const reference = Object.freeze({ kind: "pdf_page", page: 1 });
function dashboard() {
  return { schema_version: "1", focus: "full", title: "Independent review", executive_summary: "Summary.",
    findings: [{ id: "f1", title: "Finding", analysis: "Analysis.", confidence: "high", evidence: [reference] }],
    recommendations: [{ id: "r1", title: "Act", action: "Review.", priority: "high",
      confidence: "high", evidence: [reference] }], risks: [], charts: [],
    verification: { ed25519_key_id: `ed25519:${"a".repeat(32)}`,
      mldsa65_key_id: `mldsa65:${"b".repeat(32)}` } };
}

function pdf(bytes = new TextEncoder().encode("%PDF-1.7\nproof\n%%EOF")) {
  return { bytes, signature_manifest: { schema_version: "1",
    pdf_sha256: createHash("sha256").update(bytes).digest("hex"), ed25519_algorithm: "Ed25519",
    ed25519_public_key_id: `ed25519:${"a".repeat(32)}`,
    ed25519_signature_b64: btoa("e".repeat(64)), mldsa65_algorithm: "ML-DSA-65",
    mldsa65_public_key_id: `mldsa65:${"b".repeat(32)}`,
    mldsa65_signature_b64: btoa("m".repeat(3_309)) } };
}

const xlsx = new TextEncoder().encode("PK deterministic XLSX");
const text = new TextEncoder().encode("Deterministic report text.\n");
async function body(response) { return JSON.parse(await response.text()); }

test("all canonical requested-part combinations contain exactly available requested parts", async () => {
  const combinations = [["pdf"], ["xlsx"], ["text"], ["pdf", "xlsx"], ["pdf", "text"],
    ["xlsx", "text"], ["pdf", "xlsx", "text"]];
  for (const requested_outputs of combinations) {
    const response = createAnalyzeResponse({ dashboard: dashboard(), requested_outputs, pdf: pdf(), xlsx, text });
    assert.ok(response instanceof Response);
    const value = await body(response);
    const expected = ["schema_version", "dashboard", ...requested_outputs.map((part) =>
      part === "pdf" ? "pdf" : part === "xlsx" ? "xlsx_b64" : "text_utf8")];
    assert.deepEqual(Object.keys(value), expected);
  }
});

test("response headers are private and envelope has no token, route or session", async () => {
  const response = createAnalyzeResponse({ dashboard: dashboard(), requested_outputs: ["text"], text,
    pdf: pdf(), xlsx });
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  const serialized = await response.text();
  assert.doesNotMatch(serialized, /download|token|route|session/iu);
  assert.equal(createAnalyzeResponse({ dashboard: dashboard(), requested_outputs: ["text"], text,
    download_token: "forbidden" }), undefined);
});

test("missing or failed PDF is omitted while safe available parts remain", async () => {
  const missing = createAnalyzeResponse({ dashboard: dashboard(), requested_outputs: ["pdf", "text"], text });
  assert.deepEqual(Object.keys(await body(missing)), ["schema_version", "dashboard", "text_utf8"]);
  const changed = pdf();
  changed.bytes = new TextEncoder().encode("%PDF-1.7\nchanged\n%%EOF");
  const invalid = createAnalyzeResponse({ dashboard: dashboard(), requested_outputs: ["pdf"], pdf: changed });
  assert.deepEqual(Object.keys(await body(invalid)), ["schema_version", "dashboard"]);
});

test("invalid requests and complete serialized response above the total bound fail atomically", () => {
  assert.equal(createAnalyzeResponse({ dashboard: dashboard(), requested_outputs: ["text", "pdf"], text }), undefined);
  assert.equal(createAnalyzeResponse({ dashboard: dashboard(), requested_outputs: ["pdf", "pdf"], pdf: pdf() }), undefined);
  const bytes = new Uint8Array(6_290_000);
  bytes.set(new TextEncoder().encode("%PDF-1.7"));
  bytes.set(new TextEncoder().encode("%%EOF"), bytes.byteLength - 5);
  assert.equal(createAnalyzeResponse({ dashboard: dashboard(), requested_outputs: ["pdf"], pdf: pdf(bytes) }), undefined);
  assert.equal(MAX_ANALYSIS_RESPONSE_BYTES, 8_388_608);
});

test("response implementation has no storage, retry, email or result route", async () => {
  const source = await readFile(new URL("../workers/trusted-runtime/src/analyze-response.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /storage|retry|email|download|session|result.route|localStorage|indexedDB/iu);
});
