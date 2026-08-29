import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { createHash, createPrivateKey, createPublicKey, randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Mldsa65 } from "../workers/trusted-runtime/src/mldsa65.ts";

const ED25519_PKCS8_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");
const expectedWasmHash = "960ea1d9ceb0449f91301cb4168db83ab1cba3f0a86fa1bed0515f880b85f802";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wasmPath = path.join(root, "workers", "trusted-runtime", "vendor", "mldsa-native", "mldsa65.wasm");
const wranglerPath = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");
const privateConfig = path.join(root, "workers", "trusted-runtime", "wrangler.toml");

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function keyId(algorithm, publicKey) {
  return `${algorithm}:${createHash("sha256").update(publicKey).digest("hex").slice(0, 32)}`;
}

function ed25519PublicKey(seed) {
  const der = Buffer.concat([ED25519_PKCS8_PREFIX, seed]);
  try {
    const privateKey = createPrivateKey({ key: der, format: "der", type: "pkcs8" });
    return Buffer.from(createPublicKey(privateKey).export({ format: "der", type: "spki" }));
  } finally {
    der.fill(0);
  }
}

async function uploadSecrets(edSeed, mlSeed) {
  const child = spawn(process.execPath, [
    wranglerPath,
    "secret",
    "bulk",
    "--config",
    privateConfig,
  ], { cwd: root, stdio: ["pipe", "ignore", "ignore"], windowsHide: true });
  child.stdin.end(JSON.stringify({
    SIGNING_ED25519_PRIVATE_B64: edSeed.toString("base64"),
    SIGNING_MLDSA65_SEED_B64: mlSeed.toString("base64"),
  }));
  const status = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", resolve);
  });
  if (status !== 0) throw new Error("Reviewed secret upload failed; no secret value was printed.");
}

const disposable = process.argv.includes("--disposable");
const uploadReviewed = process.argv.includes("--upload-reviewed");
const publicOutput = argument("--public-output");
if (disposable === uploadReviewed || publicOutput === undefined || publicOutput.startsWith("-")) {
  throw new Error("Use exactly one of --disposable or --upload-reviewed and provide --public-output <new-file>.");
}

const wasmBytes = await readFile(wasmPath);
if (createHash("sha256").update(wasmBytes).digest("hex") !== expectedWasmHash) {
  throw new Error("Pinned ML-DSA-65 Wasm hash check failed.");
}
const mldsa65 = new Mldsa65(await WebAssembly.compile(wasmBytes));
const edSeed = randomBytes(32);
const mlSeed = randomBytes(32);
try {
  const edPublic = ed25519PublicKey(edSeed);
  const mlPublic = await mldsa65.publicKeyFromSeed(mlSeed);
  const publicRecord = {
    schema_version: "1",
    ed25519: {
      algorithm: "Ed25519",
      public_key_id: keyId("ed25519", edPublic),
      public_key_spki_b64: edPublic.toString("base64"),
    },
    mldsa65: {
      algorithm: "ML-DSA-65",
      public_key_id: keyId("mldsa65", mlPublic),
      public_key_raw_b64: Buffer.from(mlPublic).toString("base64"),
    },
  };
  const resolvedPublicOutput = path.resolve(publicOutput);
  await writeFile(resolvedPublicOutput, `${JSON.stringify(publicRecord, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
    mode: 0o600,
  });
  if (uploadReviewed) await uploadSecrets(edSeed, mlSeed);
  process.stdout.write(JSON.stringify({
    status: "ok",
    mode: disposable ? "disposable" : "reviewed-production-upload",
    public_key_file: resolvedPublicOutput,
    private_values_printed: false,
    secret_upload_instruction: disposable
      ? "After owner review, rerun with --upload-reviewed and a new --public-output file."
      : "Upload completed through wrangler secret bulk; verify both private-runtime slots before rotation.",
  }) + "\n");
} finally {
  edSeed.fill(0);
  mlSeed.fill(0);
  wasmBytes.fill(0);
}
