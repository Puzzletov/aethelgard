import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = new URL("../", import.meta.url);
const sample = new URL("../frontend/public/sample/", import.meta.url);
const files = ["aethelgard-synthetic-sample.pdf", "aethelgard-synthetic-sample.sig.json",
  "aethelgard-synthetic-sample.signing-keys.json"];
const run = (paths) => spawnSync(process.execPath, ["scripts/verify-report.mjs", ...paths], {
  cwd: root, encoding: "utf8", timeout: 12_000,
});

test("independent CLI verifies the static sample with exact fixed output", () => {
  const result = run(files.map((name) => fileURLToPath(new URL(name, sample))));
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { schema_version: "1", digest_matches: true,
    ed25519_verified: true, mldsa65_verified: true, valid: true });
});

test("independent CLI rejects changed, malformed, key and signature cases", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "aethelgard-cli-verifier-"));
  try {
    const [pdf, manifestText, keysText] = await Promise.all(files.map((name) => readFile(new URL(name, sample))));
    const variants = [];
    const changed = Buffer.from(pdf); changed[changed.length - 32] ^= 1;
    variants.push(["changed.pdf", changed, manifestText, keysText]);
    variants.push(["malformed.pdf", pdf, Buffer.from("{}"), keysText]);
    const keys = JSON.parse(keysText); keys.ed25519.public_key_id = `ed25519:${"0".repeat(32)}`;
    variants.push(["keys.pdf", pdf, manifestText, Buffer.from(JSON.stringify(keys))]);
    const manifest = JSON.parse(manifestText); manifest.ed25519_signature_b64 = `${"A".repeat(84)}====`;
    variants.push(["signature.pdf", pdf, Buffer.from(JSON.stringify(manifest)), keysText]);
    for (const [name, pdfBytes, manifestBytes, keyBytes] of variants) {
      const paths = [path.join(directory, name), path.join(directory, `${name}.json`),
        path.join(directory, `${name}.keys.json`)];
      await Promise.all([writeFile(paths[0], pdfBytes), writeFile(paths[1], manifestBytes), writeFile(paths[2], keyBytes)]);
      const result = run(paths); assert.equal(result.status, 1, name);
      assert.equal(JSON.parse(result.stdout).valid, false, name);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("CLI has no network, private key, partial-success or unbounded input path", async () => {
  const source = await readFile(new URL("../scripts/verify-report.mjs", import.meta.url), "utf8");
  assert.match(source, /PDF_MAX = 8_388_608/);
  assert.match(source, /JSON_MAX = 32_768/);
  assert.match(source, /TIMEOUT_MS = 10_000/);
  assert.match(source, /valid: digestMatches && edValid && mlValid/);
  assert.doesNotMatch(source, /fetch|https?:|createPrivateKey|private_key|generateKeyPair/iu);
});

test("CLI verifies from a disposable dependency-free directory", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "aethelgard-cli-clean-"));
  try {
    const script = path.join(directory, "verify-report.mjs");
    await copyFile(fileURLToPath(new URL("../scripts/verify-report.mjs", import.meta.url)), script);
    const paths = files.map((name) => path.join(directory, name));
    await Promise.all(files.map((name, index) =>
      copyFile(fileURLToPath(new URL(name, sample)), paths[index])));
    const result = spawnSync(process.execPath, [script, ...paths], {
      cwd: directory, encoding: "utf8", timeout: 12_000, env: { PATH: process.env.PATH },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).valid, true);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
