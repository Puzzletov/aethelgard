import assert from "node:assert/strict";
import {
  createHash,
  createPublicKey,
  generateKeyPairSync,
  verify,
} from "node:crypto";
import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import test from "node:test";

import {
  integrateTrustedFinalPdf,
  MAX_SIGNATURE_MANIFEST_BYTES,
  SIGNING_MEDIAN_TARGET_MS,
} from "../workers/trusted-runtime/src/final-signing.ts";
import { signExactPdf } from "../workers/trusted-runtime/src/hybrid-signing.ts";
import {
  Mldsa65,
  MLDSA65_PUBLIC_KEY_BYTES,
} from "../workers/trusted-runtime/src/mldsa65.ts";

const PDF_TEXT = "%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n";
const EXPECTED_DIGEST = "904636248025ad20fb9c6bd8b700179a2a42edb5df3636e926c7e09055ee3f75";
const seeds = Object.freeze({
  ed25519SeedB64: Buffer.alloc(32, 0x31).toString("base64"),
  mldsa65SeedB64: Buffer.alloc(32, 0x52).toString("base64"),
});
const wasmUrl = new URL(
  "../workers/trusted-runtime/vendor/mldsa-native/mldsa65.wasm",
  import.meta.url,
);
const enginePromise = readFile(wasmUrl)
  .then((bytes) => WebAssembly.compile(bytes))
  .then((module) => new Mldsa65(module));

async function actualSigner(bytes, signingSecrets) {
  return signExactPdf(bytes, signingSecrets, await enginePromise);
}

function mldsaPublicFromRaw(raw) {
  const template = generateKeyPairSync("ml-dsa-65").publicKey.export({ format: "der", type: "spki" });
  const prefix = template.subarray(0, template.byteLength - MLDSA65_PUBLIC_KEY_BYTES);
  return createPublicKey({ key: Buffer.concat([prefix, raw]), format: "der", type: "spki" });
}

test("production integration signs and returns the exact unchanged PDF bytes", async () => {
  const pdf = new TextEncoder().encode(PDF_TEXT);
  const before = Uint8Array.from(pdf);
  const result = await integrateTrustedFinalPdf(pdf, seeds, actualSigner);
  assert.ok(result);
  assert.equal(result.bytes, pdf);
  assert.deepEqual(pdf, before);
  assert.equal(result.manifest.pdf_sha256, EXPECTED_DIGEST);
  assert.ok(Buffer.byteLength(JSON.stringify(result.manifest)) <= MAX_SIGNATURE_MANIFEST_BYTES);

  const digest = createHash("sha256").update(pdf).digest();
  const edPublic = createPublicKey({ key: result.publicKeys.ed25519Spki, format: "der", type: "spki" });
  const mlPublic = mldsaPublicFromRaw(result.publicKeys.mldsa65Raw);
  const edSignature = Buffer.from(result.manifest.ed25519_signature_b64, "base64");
  const mlSignature = Buffer.from(result.manifest.mldsa65_signature_b64, "base64");
  assert.equal(verify(null, digest, edPublic, edSignature), true);
  assert.equal(verify(null, digest, mlPublic, mlSignature), true);

  const changed = Uint8Array.from(pdf);
  changed[8] ^= 1;
  const changedDigest = createHash("sha256").update(changed).digest();
  assert.equal(verify(null, changedDigest, edPublic, edSignature), false);
  assert.equal(verify(null, changedDigest, mlPublic, mlSignature), false);
});

test("production integration fails closed and restores signer mutations", async () => {
  const malformed = new TextEncoder().encode("not a PDF");
  assert.equal(await integrateTrustedFinalPdf(malformed, seeds, actualSigner), undefined);

  const pdf = new TextEncoder().encode(PDF_TEXT);
  const before = Uint8Array.from(pdf);
  const result = await integrateTrustedFinalPdf(pdf, seeds, async (bytes, signingSecrets) => {
    const signed = await actualSigner(bytes, signingSecrets);
    bytes[7] ^= 1;
    return signed;
  });
  assert.equal(result, undefined);
  assert.deepEqual(pdf, before);

  const signed = await actualSigner(pdf, seeds);
  const partial = { ...signed, manifest: { ...signed.manifest, mldsa65_signature_b64: "" } };
  assert.equal(await integrateTrustedFinalPdf(pdf, seeds, async () => partial), undefined);
});

test("production hybrid signing meets the median runtime target", async () => {
  const timings = [];
  for (let index = 0; index < 7; index += 1) {
    const pdf = new TextEncoder().encode(PDF_TEXT);
    const started = performance.now();
    assert.ok(await integrateTrustedFinalPdf(pdf, seeds, actualSigner));
    timings.push(performance.now() - started);
  }
  timings.sort((left, right) => left - right);
  assert.ok(timings[3] <= SIGNING_MEDIAN_TARGET_MS, `median ${timings[3].toFixed(2)} ms`);
});
