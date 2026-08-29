import assert from "node:assert/strict";
import {
  createHash,
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
} from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { signExactPdf } from "../workers/trusted-runtime/src/hybrid-signing.ts";
import {
  Mldsa65,
  MLDSA65_PUBLIC_KEY_BYTES,
  MLDSA65_SIGNATURE_BYTES,
} from "../workers/trusted-runtime/src/mldsa65.ts";

const wasmUrl = new URL(
  "../workers/trusted-runtime/vendor/mldsa-native/mldsa65.wasm",
  import.meta.url,
);
const pdf = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n");

async function engine() {
  return new Mldsa65(await WebAssembly.compile(await readFile(wasmUrl)));
}

function mldsaPublicFromRaw(raw) {
  const template = generateKeyPairSync("ml-dsa-65").publicKey.export({ format: "der", type: "spki" });
  const prefix = template.subarray(0, template.byteLength - MLDSA65_PUBLIC_KEY_BYTES);
  return createPublicKey({ key: Buffer.concat([prefix, raw]), format: "der", type: "spki" });
}

test("hybrid signatures cover the exact final PDF bytes and reject one changed byte", async () => {
  const mldsa65 = await engine();
  const result = await signExactPdf(pdf, {
    ed25519SeedB64: Buffer.alloc(32, 0x31).toString("base64"),
    mldsa65SeedB64: Buffer.alloc(32, 0x52).toString("base64"),
  }, mldsa65);
  const digest = createHash("sha256").update(pdf).digest();
  assert.equal(result.manifest.pdf_sha256, digest.toString("hex"));
  assert.deepEqual(Object.keys(result.manifest).sort(), [
    "ed25519_algorithm",
    "ed25519_public_key_id",
    "ed25519_signature_b64",
    "mldsa65_algorithm",
    "mldsa65_public_key_id",
    "mldsa65_signature_b64",
    "pdf_sha256",
    "schema_version",
  ]);

  const edPublic = createPublicKey({
    key: result.publicKeys.ed25519Spki,
    format: "der",
    type: "spki",
  });
  const mlPublic = mldsaPublicFromRaw(result.publicKeys.mldsa65Raw);
  const edSignature = Buffer.from(result.manifest.ed25519_signature_b64, "base64");
  const mlSignature = Buffer.from(result.manifest.mldsa65_signature_b64, "base64");
  assert.equal(result.publicKeys.mldsa65Raw.byteLength, MLDSA65_PUBLIC_KEY_BYTES);
  assert.equal(mlSignature.byteLength, MLDSA65_SIGNATURE_BYTES);
  assert.equal(verify(null, digest, edPublic, edSignature), true);
  assert.equal(verify(null, digest, mlPublic, mlSignature), true);

  const changed = Uint8Array.from(pdf);
  changed[changed.byteLength - 1] ^= 1;
  const changedDigest = createHash("sha256").update(changed).digest();
  assert.equal(verify(null, changedDigest, edPublic, edSignature), false);
  assert.equal(verify(null, changedDigest, mlPublic, mlSignature), false);
  assert.equal(await mldsa65.verifyDigest(result.publicKeys.mldsa65Raw, changedDigest, mlSignature), false);
});

test("Node ML-DSA-65 signatures cross-verify in the pinned Wasm implementation", async () => {
  const mldsa65 = await engine();
  const digest = createHash("sha256").update("independent cross-check").digest();
  const native = generateKeyPairSync("ml-dsa-65");
  const publicDer = native.publicKey.export({ format: "der", type: "spki" });
  const publicRaw = publicDer.subarray(publicDer.byteLength - MLDSA65_PUBLIC_KEY_BYTES);
  const signature = sign(null, digest, native.privateKey);
  assert.equal(await mldsa65.verifyDigest(publicRaw, digest, signature), true);
  const changedDigest = Buffer.from(digest);
  changedDigest[0] ^= 1;
  assert.equal(await mldsa65.verifyDigest(publicRaw, changedDigest, signature), false);
});

test("signing rejects malformed PDFs and non-canonical or wrong-size seeds", async () => {
  const mldsa65 = await engine();
  const validSeeds = {
    ed25519SeedB64: Buffer.alloc(32, 1).toString("base64"),
    mldsa65SeedB64: Buffer.alloc(32, 2).toString("base64"),
  };
  await assert.rejects(() => signExactPdf(new TextEncoder().encode("not pdf"), validSeeds, mldsa65));
  await assert.rejects(() => signExactPdf(pdf, { ...validSeeds, ed25519SeedB64: "AA==" }, mldsa65));
  await assert.rejects(() => signExactPdf(pdf, { ...validSeeds, mldsa65SeedB64: "not base64" }, mldsa65));
});
