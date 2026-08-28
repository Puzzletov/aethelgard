import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const root = new URL("../", import.meta.url);
const wasmUrl = new URL(
  "../workers/trusted-runtime/vendor/mldsa-native/mldsa65.wasm",
  import.meta.url,
);

test("the committed ML-DSA-65 module has the approved bytes, hash, and surface", async () => {
  const bytes = await readFile(wasmUrl);
  assert.equal(bytes.byteLength, 40_843);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    "960ea1d9ceb0449f91301cb4168db83ab1cba3f0a86fa1bed0515f880b85f802",
  );
  const module = await WebAssembly.compile(bytes);
  assert.deepEqual(WebAssembly.Module.imports(module), []);
  assert.deepEqual(WebAssembly.Module.exports(module).map((item) => item.name).sort(), [
    "memory",
    "phase1d_arena_ptr",
    "phase1d_keypair",
    "phase1d_sign",
    "phase1d_verify",
    "phase1d_wipe",
  ]);
});

test("the key generator uses disposable keys without printing private material", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "aethelgard-keygen-test-"));
  const output = path.join(directory, "public-keys.json");
  try {
    const result = spawnSync(process.execPath, [
      "scripts/generate-signing-keys.mjs",
      "--disposable",
      "--public-output",
      output,
    ], { cwd: root, encoding: "utf8", timeout: 30_000 });
    assert.equal(result.status, 0, result.stderr);
    const status = JSON.parse(result.stdout);
    assert.equal(status.status, "ok");
    assert.equal(status.mode, "disposable");
    assert.equal(status.private_values_printed, false);
    assert.doesNotMatch(result.stdout, /SIGNING_.*_B64|private.*seed/i);
    const publicKeys = JSON.parse(await readFile(output, "utf8"));
    assert.equal(publicKeys.ed25519.algorithm, "Ed25519");
    assert.equal(publicKeys.mldsa65.algorithm, "ML-DSA-65");
    assert.match(publicKeys.ed25519.public_key_id, /^ed25519:[0-9a-f]{32}$/);
    assert.match(publicKeys.mldsa65.public_key_id, /^mldsa65:[0-9a-f]{32}$/);
    assert.equal(Buffer.from(publicKeys.mldsa65.public_key_raw_b64, "base64").byteLength, 1_952);
    assert.deepEqual(Object.keys(publicKeys).sort(), ["ed25519", "mldsa65", "schema_version"]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
