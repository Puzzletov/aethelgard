import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  detachedManifestBytes,
  MAX_SIGNATURE_MANIFEST_BYTES,
  parseDetachedManifest,
  pdfMatchesManifest,
} from "../verification/detached-manifest.ts";

const pdf = new TextEncoder().encode("%PDF-1.7\n%%EOF");
const manifest = Object.freeze({
  schema_version: "1",
  pdf_sha256: createHash("sha256").update(pdf).digest("hex"),
  ed25519_algorithm: "Ed25519",
  ed25519_public_key_id: `ed25519:${"a".repeat(32)}`,
  ed25519_signature_b64: btoa("e".repeat(64)),
  mldsa65_algorithm: "ML-DSA-65",
  mldsa65_public_key_id: `mldsa65:${"b".repeat(32)}`,
  mldsa65_signature_b64: btoa("m".repeat(3_309)),
});

test("detached manifest uses exact version-1 JSON and parses locally", async () => {
  const bytes = detachedManifestBytes(manifest);
  assert.ok(bytes);
  assert.ok(bytes.byteLength <= MAX_SIGNATURE_MANIFEST_BYTES);
  assert.equal(new TextDecoder().decode(bytes), `${JSON.stringify(manifest, null, 2)}\n`);
  assert.deepEqual(parseDetachedManifest(bytes), manifest);
  assert.equal(await pdfMatchesManifest(pdf, bytes), true);
});

test("local pairing rejects a changed PDF and malformed or oversized manifests", async () => {
  const bytes = detachedManifestBytes(manifest);
  assert.ok(bytes);
  const changed = Uint8Array.from(pdf);
  changed[7] ^= 1;
  assert.equal(await pdfMatchesManifest(changed, bytes), false);
  assert.equal(parseDetachedManifest(new TextEncoder().encode("{}")), undefined);
  assert.equal(parseDetachedManifest(new Uint8Array(MAX_SIGNATURE_MANIFEST_BYTES + 1)), undefined);
});
