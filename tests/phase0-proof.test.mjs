import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createFoundationProof } from "../workers/trusted-runtime/src/foundation-proof.ts";
import { signExactPdf } from "../workers/trusted-runtime/src/hybrid-signing.ts";
import { Mldsa65 } from "../workers/trusted-runtime/src/mldsa65.ts";
import { verifyPhase0Proof } from "../scripts/phase0-proof-verifier.mjs";

const wasmUrl = new URL("../workers/trusted-runtime/vendor/mldsa-native/mldsa65.wasm", import.meta.url);
const pdf = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n");

async function proof() {
  const engine = new Mldsa65(await WebAssembly.compile(await readFile(wasmUrl)));
  const signed = await signExactPdf(pdf, {
    ed25519SeedB64: Buffer.alloc(32, 0x13).toString("base64"),
    mldsa65SeedB64: Buffer.alloc(32, 0x27).toString("base64"),
  }, engine);
  return { ok: true, output: createFoundationProof(pdf, signed) };
}

test("the Phase 0 proof independently verifies both signatures and rejects a changed byte", async () => {
  const result = verifyPhase0Proof(await proof());
  assert.deepEqual(result, {
    pdf_bytes: pdf.byteLength,
    pdf_sha256: result.pdf_sha256,
    ed25519_verified: true,
    mldsa65_verified: true,
    changed_byte_rejected: true,
  });
});

test("the independent verifier rejects a changed PDF response", async () => {
  const valid = await proof();
  const bytes = Buffer.from(valid.output.pdf_b64, "base64");
  bytes[bytes.byteLength - 1] ^= 1;
  const response = {
    ...valid,
    output: { ...valid.output, pdf_b64: bytes.toString("base64") },
  };
  assert.throws(() => verifyPhase0Proof(response), /digest/);
});
