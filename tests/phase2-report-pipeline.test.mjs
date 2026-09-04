import assert from "node:assert/strict";
import { createHash, createPublicKey, generateKeyPairSync, verify } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { analyzeResponseSchema } from "../src/contracts/analyze-response.ts";
import { integrateTrustedFinalPdf } from "../workers/trusted-runtime/src/final-signing.ts";
import { deriveSigningIdentity, signExactPdf } from "../workers/trusted-runtime/src/hybrid-signing.ts";
import { Mldsa65, MLDSA65_PUBLIC_KEY_BYTES } from "../workers/trusted-runtime/src/mldsa65.ts";
import { FinalPdfQueue } from "../workers/trusted-runtime/src/pdf-queue.ts";
import { createProductionReport } from "../workers/trusted-runtime/src/report-pipeline.ts";

const reference = Object.freeze({ kind: "txt_lines", line_start: 1, line_end: 1 });
const request = Object.freeze({ schema_version: "1", turnstile_token: "unused-after-verification",
  focus: "full", requested_outputs: ["pdf", "xlsx", "text"], sources: [{ schema_version: "1",
    ordinal: 1, reference, content: "[ORGANIZATION_1] has twelve controls and nine verified controls." }] });
const oracle = Object.freeze({ schema_version: "1", executive_summary: "Nine of twelve controls are verified.",
  findings: [{ id: "finding-1", title: "Control gap", analysis: "Three controls remain.",
    confidence: "high", evidence: [reference] }],
  recommendations: [{ id: "recommendation-1", title: "Complete controls", action: "Verify three controls.",
    priority: "high", confidence: "high", evidence: [reference] }], risks: [],
  quantitative_candidates: [{ id: "candidate-1", label: "Verified", value: 9, unit: "controls",
    context: "Control completion", evidence: [reference] }],
  critique_resolutions: [{ steelman_item_id: "critique-1", status: "resolved", explanation: "Resolved." }] });
const seeds = Object.freeze({ ed25519SeedB64: Buffer.alloc(32, 0x31).toString("base64"),
  mldsa65SeedB64: Buffer.alloc(32, 0x52).toString("base64") });
const enginePromise = readFile(new URL("../workers/trusted-runtime/vendor/mldsa-native/mldsa65.wasm", import.meta.url))
  .then((bytes) => WebAssembly.compile(bytes)).then((module) => new Mldsa65(module));

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { values, async get(keys) { return new Map(keys.map((key) => [key, values.get(key)])); },
    async put(entries) { for (const [key, value] of Object.entries(entries)) values.set(key, value); },
    async transaction(callback) { return callback(this); } };
}

function mlPublic(raw) {
  const template = generateKeyPairSync("ml-dsa-65").publicKey.export({ format: "der", type: "spki" });
  return createPublicKey({ key: Buffer.concat([
    template.subarray(0, template.byteLength - MLDSA65_PUBLIC_KEY_BYTES), raw,
  ]), format: "der", type: "spki" });
}

async function runtime(store, browser) {
  const engine = await enginePromise;
  return { browser, storage: store, queue: new FinalPdfQueue(async () => undefined, () => 0),
    identity: () => deriveSigningIdentity(seeds, engine),
    sign: (bytes) => integrateTrustedFinalPdf(bytes, seeds,
      (value, signingSecrets) => signExactPdf(value, signingSecrets, engine)) };
}

test("private premium journey returns dashboard and every requested in-memory output", async () => {
  const pdf = new TextEncoder().encode("%PDF-1.7\nproduction report\n%%EOF\n");
  const store = storage();
  const response = await createProductionReport(request, oracle, await runtime(store, {
    async quickAction() { return new Response(pdf, { headers: { "content-type": "application/pdf",
      "x-browser-ms-used": "125" } }); },
  }));
  assert.ok(response instanceof Response);
  const parsed = analyzeResponseSchema.safeParse(await response.json());
  assert.ok(parsed.success);
  assert.ok(parsed.data.pdf); assert.ok(parsed.data.xlsx_b64); assert.ok(parsed.data.text_utf8);
  assert.equal(parsed.data.dashboard.charts[0].points[0].value, 9);
  const exact = Buffer.from(parsed.data.pdf.bytes_b64, "base64");
  assert.deepEqual([...exact], [...pdf]);
  assert.equal(parsed.data.pdf.signature_manifest.pdf_sha256,
    createHash("sha256").update(exact).digest("hex"));
  assert.deepEqual([...store.values.keys()].sort(), ["aggregate_browser_run_ms", "utc_date"]);
  assert.equal(store.values.get("aggregate_browser_run_ms"), 125);
  assert.doesNotMatch(JSON.stringify(parsed.data), /turnstile|prompt|token|session|email/iu);
});

test("quota exhaustion inside the report layer omits PDF and signing without an unsigned substitute", async () => {
  const today = new Date().toISOString().slice(0, 10); let browserCalls = 0; let signCalls = 0;
  const store = storage({ utc_date: today, aggregate_browser_run_ms: 480_000 });
  const base = await runtime(store, { async quickAction() { browserCalls += 1; throw new Error("forbidden"); } });
  const response = await createProductionReport(request, oracle, { ...base,
    sign: async () => { signCalls += 1; return undefined; } });
  assert.ok(response instanceof Response);
  const parsed = analyzeResponseSchema.parse(await response.json());
  assert.equal(parsed.pdf, undefined);
  assert.ok(parsed.xlsx_b64); assert.ok(parsed.text_utf8);
  assert.equal(browserCalls, 0); assert.equal(signCalls, 0);
  assert.equal(store.values.get("aggregate_browser_run_ms"), 480_000);
});

test("invalid Browser Run outputs never reach signing or the PDF response", async () => {
  const cases = [
    ["non_pdf", new Response("not pdf", { headers: { "content-type": "text/plain",
      "x-browser-ms-used": "20" } })],
    ["truncated", new Response("%PDF-1.7 truncated", { headers: { "content-type": "application/pdf",
      "x-browser-ms-used": "20" } })],
    ["over_bound", new Response("", { headers: { "content-type": "application/pdf",
      "content-length": "8388609", "x-browser-ms-used": "20" } })],
  ];
  for (const [name, browserResponse] of cases) {
    let signCalls = 0;
    const base = await runtime(storage(), { async quickAction() { return browserResponse.clone(); } });
    const response = await createProductionReport(request, oracle, { ...base,
      sign: async () => { signCalls += 1; return undefined; } });
    const parsed = analyzeResponseSchema.parse(await response.json());
    assert.equal(parsed.pdf, undefined, name);
    assert.equal(signCalls, 0, name);
  }
});

test("hybrid output from the composed journey independently verifies", async () => {
  const pdf = new TextEncoder().encode("%PDF-1.7\nexact report\n%%EOF\n");
  let publicKeys;
  const base = await runtime(storage(), { async quickAction() {
    return new Response(pdf, { headers: { "content-type": "application/pdf", "x-browser-ms-used": "1" } });
  } });
  const response = await createProductionReport(request, oracle, { ...base, sign: async (bytes) => {
    const signed = await base.sign(bytes); publicKeys = signed?.publicKeys; return signed;
  } });
  const result = analyzeResponseSchema.parse(await response.json());
  const digest = createHash("sha256").update(Buffer.from(result.pdf.bytes_b64, "base64")).digest();
  assert.equal(verify(null, digest, createPublicKey({ key: publicKeys.ed25519Spki,
    format: "der", type: "spki" }), Buffer.from(result.pdf.signature_manifest.ed25519_signature_b64, "base64")), true);
  assert.equal(verify(null, digest, mlPublic(publicKeys.mldsa65Raw),
    Buffer.from(result.pdf.signature_manifest.mldsa65_signature_b64, "base64")), true);
});
