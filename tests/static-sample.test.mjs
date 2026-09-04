import assert from "node:assert/strict";
import { createHash, createPublicKey, generateKeyPairSync, verify } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { reportModelSchema } from "../src/contracts/report-model.ts";
import { signatureManifestSchema } from "../src/contracts/signature-manifest.ts";
import { MLDSA65_PUBLIC_KEY_BYTES } from "../workers/trusted-runtime/src/mldsa65.ts";

const directory = new URL("../frontend/public/sample/", import.meta.url);
const names = Object.freeze({ pdf: "aethelgard-synthetic-sample.pdf",
  manifest: "aethelgard-synthetic-sample.sig.json", report: "aethelgard-synthetic-sample.report.json",
  source: "aethelgard-synthetic-sample.source.txt",
  keys: "aethelgard-synthetic-sample.signing-keys.json" });

async function json(name) {
  return JSON.parse(await readFile(new URL(name, directory), "utf8"));
}

function mlPublic(raw) {
  const template = generateKeyPairSync("ml-dsa-65").publicKey.export({ format: "der", type: "spki" });
  return createPublicKey({ key: Buffer.concat([
    template.subarray(0, template.byteLength - MLDSA65_PUBLIC_KEY_BYTES), raw,
  ]), format: "der", type: "spki" });
}

test("static sample is bounded, explicitly synthetic, and linked from Pages", async () => {
  const [pdf, manifestBytes, report, source, keys, page] = await Promise.all([
    readFile(new URL(names.pdf, directory)), readFile(new URL(names.manifest, directory)),
    json(names.report), readFile(new URL(names.source, directory), "utf8"), json(names.keys),
    readFile(new URL("../frontend/app/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.ok(pdf.byteLength <= 8_388_608);
  assert.ok(manifestBytes.byteLength <= 32_768);
  assert.ok(Buffer.byteLength(source) <= 15_728_640);
  assert.ok(reportModelSchema.safeParse(report).success);
  assert.equal(source.split(/\r?\n/u)[0], "SYNTHETIC STATIC SAMPLE — NOT A LIVE ANALYSIS");
  assert.doesNotMatch(source, /@|https?:|\+?\d[\d ()-]{7,}\d|Puzzletov|possi/iu);
  assert.match(page, /Synthetic static sample — not a live analysis/u);
  for (const name of Object.values(names)) assert.match(page, new RegExp(name.replaceAll(".", "\\."), "u"));
  assert.match(page, /href="\/sample"/u);
  assert.equal(report.verification.ed25519_key_id, keys.ed25519[0].public_key_id);
  assert.equal(report.verification.mldsa65_key_id, keys.mldsa65[0].public_key_id);
});

test("sample presentation is static, accessible and links both verification paths", async () => {
  const page = await readFile(new URL("../frontend/app/sample/page.tsx", import.meta.url), "utf8");
  assert.match(page, /Synthetic sample — not a live analysis/);
  assert.match(page, /requires no live AI, Worker or Browser Run capacity/);
  assert.match(page, /<AnalysisDashboard result=/);
  assert.match(page, /href="\/verify"/);
  assert.match(page, /aethelgard-synthetic-sample\.pdf/);
  assert.match(page, /aethelgard-synthetic-sample\.sig\.json/);
  assert.match(page, /aethelgard-synthetic-sample\.signing-keys\.json/);
  assert.match(page, /href="#sample-content"/);
  assert.doesNotMatch(page, /fetch|\/analyze|Turnstile|dangerouslySetInnerHTML/u);
});

test("static sample verifies independently and one changed byte fails both signatures", async () => {
  const [pdf, manifestValue, keys] = await Promise.all([
    readFile(new URL(names.pdf, directory)), json(names.manifest), json(names.keys),
  ]);
  const parsed = signatureManifestSchema.safeParse(manifestValue);
  assert.ok(parsed.success);
  const digest = createHash("sha256").update(pdf).digest();
  assert.equal(digest.toString("hex"), parsed.data.pdf_sha256);
  const ed = createPublicKey({ key: Buffer.from(keys.ed25519[0].public_key_spki_b64, "base64"),
    format: "der", type: "spki" });
  const ml = mlPublic(Buffer.from(keys.mldsa65[0].public_key_raw_b64, "base64"));
  const edSig = Buffer.from(parsed.data.ed25519_signature_b64, "base64");
  const mlSig = Buffer.from(parsed.data.mldsa65_signature_b64, "base64");
  assert.equal(verify(null, digest, ed, edSig), true);
  assert.equal(verify(null, digest, ml, mlSig), true);
  const changed = Buffer.from(pdf); changed[changed.byteLength - 32] ^= 1;
  const changedDigest = createHash("sha256").update(changed).digest();
  assert.equal(verify(null, changedDigest, ed, edSig), false);
  assert.equal(verify(null, changedDigest, ml, mlSig), false);
});
