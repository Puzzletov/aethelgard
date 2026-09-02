import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { availableDownloads, MAX_OBJECT_URL_LIFETIME_MS,
  ObjectUrlDownloads } from "../downloads/object-downloads.ts";

function response() {
  const reference = { kind: "pdf_page", page: 1 };
  return { schema_version: "1", dashboard: { schema_version: "1", focus: "full", title: "Review",
    executive_summary: "Summary.", findings: [{ id: "f1", title: "Finding", analysis: "Analysis.",
      confidence: "high", evidence: [reference] }], recommendations: [{ id: "r1", title: "Act",
      action: "Review.", priority: "high", confidence: "high", evidence: [reference] }], risks: [], charts: [],
    verification: { ed25519_key_id: `ed25519:${"a".repeat(32)}`,
      mldsa65_key_id: `mldsa65:${"b".repeat(32)}` } },
  pdf: { bytes_b64: btoa("%PDF-1.7\n%%EOF"), signature_manifest: { schema_version: "1",
    pdf_sha256: "c".repeat(64), ed25519_algorithm: "Ed25519",
    ed25519_public_key_id: `ed25519:${"a".repeat(32)}`, ed25519_signature_b64: btoa("e".repeat(64)),
    mldsa65_algorithm: "ML-DSA-65", mldsa65_public_key_id: `mldsa65:${"b".repeat(32)}`,
    mldsa65_signature_b64: btoa("m".repeat(3_309)) } },
  xlsx_b64: btoa("PK workbook"), text_utf8: "Report text.\n" };
}

function harness(triggerFailure = false) {
  const blobs = new Map(); const revoked = []; const triggered = []; const scheduled = []; const afterUse = [];
  let next = 0;
  const urls = { createObjectURL(blob) { const url = `blob:proof-${++next}`; blobs.set(url, blob); return url; },
    revokeObjectURL(url) { revoked.push(url); } };
  const timers = { afterUse(callback) { afterUse.push(callback); }, cancel(handle) { handle.cancelled = true; },
    schedule(callback, milliseconds) { const handle = { callback, milliseconds, cancelled: false };
      scheduled.push(handle); return handle; } };
  const trigger = (url, name) => { if (triggerFailure) throw new Error("click failed"); triggered.push({ url, name }); };
  return { afterUse, blobs, manager: new ObjectUrlDownloads(urls, trigger, timers), revoked, scheduled, triggered };
}

test("downloads are created only on explicit use with fixed names, types and bytes", async () => {
  const proof = harness();
  assert.deepEqual(availableDownloads(response()), ["pdf", "signature", "xlsx", "text"]);
  assert.equal(proof.blobs.size, 0);
  for (const kind of ["pdf", "signature", "xlsx", "text"]) assert.equal(proof.manager.download(response(), kind), true);
  assert.deepEqual(proof.triggered.map((item) => item.name), ["aethelgard-report.pdf",
    "aethelgard-report.sig.json", "aethelgard-report.xlsx", "aethelgard-report.txt"]);
  assert.deepEqual([...proof.blobs.values()].map((blob) => blob.type), ["application/pdf", "application/json",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain;charset=utf-8"]);
  assert.equal(await [...proof.blobs.values()][0].text(), "%PDF-1.7\n%%EOF");
  assert.equal(await [...proof.blobs.values()][2].text(), "PK workbook");
  assert.equal(await [...proof.blobs.values()][3].text(), "Report text.\n");
  assert.ok((await [...proof.blobs.values()][1].text()).endsWith("}\n"));
  assert.deepEqual(JSON.parse(await [...proof.blobs.values()][1].text()), response().pdf.signature_manifest);
  assert.deepEqual(proof.scheduled.map((item) => item.milliseconds), Array(4).fill(MAX_OBJECT_URL_LIFETIME_MS));
});

test("object URLs revoke after use, at lifetime, on exit and on trigger failure", () => {
  const used = harness();
  used.manager.download(response(), "pdf");
  used.afterUse[0]();
  assert.deepEqual(used.revoked, ["blob:proof-1"]);
  assert.equal(used.scheduled[0].cancelled, true);

  const expired = harness();
  expired.manager.download(response(), "xlsx");
  expired.scheduled[0].callback();
  assert.deepEqual(expired.revoked, ["blob:proof-1"]);

  const exiting = harness();
  exiting.manager.download(response(), "text");
  exiting.manager.dispose();
  assert.deepEqual(exiting.revoked, ["blob:proof-1"]);

  const failed = harness(true);
  assert.equal(failed.manager.download(response(), "pdf"), false);
  assert.deepEqual(failed.revoked, ["blob:proof-1"]);
  assert.equal(failed.scheduled[0].cancelled, true);
});

test("missing and invalid parts create no object URL", () => {
  const proof = harness();
  assert.equal(proof.manager.download({ ...response(), pdf: undefined }, "pdf"), false);
  assert.equal(proof.manager.download({ ...response(), token: "forbidden" }, "text"), false);
  assert.equal(proof.blobs.size, 0);
});

test("download implementation has no network, service worker, cache or storage path", async () => {
  const source = await readFile(new URL("../downloads/object-downloads.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /fetch|XMLHttpRequest|serviceWorker|CacheStorage|localStorage|sessionStorage|indexedDB/iu);
});

test("trust affordance states exact key IDs and bounded verification claims", async () => {
  const source = await readFile(new URL("../components/download-controls.tsx", import.meta.url), "utf8");
  assert.match(source, /Ed25519 key ID/);
  assert.match(source, /ML-DSA-65 key ID/);
  assert.match(source, /does not prove that the source or analysis is correct/);
  assert.match(source, /href="#verification-limits"/);
  assert.match(source, /no unsigned or unverifiable PDF was offered/);
  assert.doesNotMatch(source, /authentic|trusted|guarantee/iu);
});
