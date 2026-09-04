import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

import { runBrowserPageProof, supportedBrowserExecutables } from "./browser-parser-proof.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sample = path.join(root, "frontend", "public", "sample");
const [pdf, manifest, keys] = await Promise.all([
  readFile(path.join(sample, "aethelgard-synthetic-sample.pdf")),
  readFile(path.join(sample, "aethelgard-synthetic-sample.sig.json"), "utf8"),
  readFile(path.join(sample, "aethelgard-synthetic-sample.signing-keys.json"), "utf8"),
]);
const entry = `
import { verifyReport } from "./verification/local-verifier.ts";
const pdf = Uint8Array.from(atob("${pdf.toString("base64")}"), c => c.charCodeAt(0));
const originalManifest = ${manifest.trim()};
const originalKeys = ${keys.trim()};
const encode = value => new TextEncoder().encode(JSON.stringify(value));
const mutateB64 = value => { const bytes = Uint8Array.from(atob(value), c => c.charCodeAt(0));
  bytes[0] ^= 1; return btoa(String.fromCharCode(...bytes)); };
const expected = {
  valid: [true, true, true, true], changed_pdf: [false, false, false, false],
  changed_digest: [false, true, true, false], changed_ed25519: [true, false, true, false],
  changed_mldsa65: [true, true, false, false], changed_keys: [true, false, false, false],
  malformed_manifest: [false, false, false, false],
};
const vector = result => [result.digest_matches, result.ed25519_verified,
  result.mldsa65_verified, result.valid];
function variants() {
  const changedPdf = pdf.slice(); changedPdf[changedPdf.length - 32] ^= 1;
  const changedDigest = { ...originalManifest, pdf_sha256: "0".repeat(64) };
  const changedEd = { ...originalManifest,
    ed25519_signature_b64: mutateB64(originalManifest.ed25519_signature_b64) };
  const changedMl = { ...originalManifest,
    mldsa65_signature_b64: mutateB64(originalManifest.mldsa65_signature_b64) };
  const changedKeys = structuredClone(originalKeys);
  changedKeys.ed25519[0].public_key_spki_b64 = mutateB64(changedKeys.ed25519[0].public_key_spki_b64);
  changedKeys.mldsa65[0].public_key_raw_b64 = mutateB64(changedKeys.mldsa65[0].public_key_raw_b64);
  return { valid: [pdf, originalManifest, originalKeys], changed_pdf: [changedPdf, originalManifest, originalKeys],
    changed_digest: [pdf, changedDigest, originalKeys], changed_ed25519: [pdf, changedEd, originalKeys],
    changed_mldsa65: [pdf, changedMl, originalKeys], changed_keys: [pdf, originalManifest, changedKeys],
    malformed_manifest: [pdf, { ...originalManifest, extra: true }, originalKeys] };
}
export async function runProof() {
  let network = 0; let storage = 0;
  globalThis.fetch = async () => { network += 1; throw new Error("network_forbidden"); };
  const nativeSet = Storage.prototype.setItem;
  Storage.prototype.setItem = function(...args) { storage += 1; return nativeSet.apply(this, args); };
  const results = {};
  for (const [name, [candidatePdf, candidateManifest, candidateKeys]] of Object.entries(variants())) {
    results[name] = vector(await verifyReport(candidatePdf, encode(candidateManifest), [candidateKeys]));
  }
  const passed = Object.entries(expected).every(([name, value]) =>
    JSON.stringify(results[name]) === JSON.stringify(value)) && network === 0 && storage === 0;
  return { status: passed ? "ok" : "failed", results, network_requests: network, storage_writes: storage };
}`;

const built = await build({ absWorkingDir: root, stdin: { contents: entry,
  resolveDir: path.join(root, "frontend"), sourcefile: "local-verifier-proof.ts", loader: "ts" },
bundle: true, minify: true, write: false, format: "esm", platform: "browser",
target: ["chrome120"], logLevel: "silent" });
const results = [];
for (const browser of supportedBrowserExecutables()) {
  results.push({ browser: browser.name,
    ...await runBrowserPageProof(built.outputFiles[0].text, browser.executable) });
}
if (results.some((result) => result.status !== "ok")) throw new Error(JSON.stringify(results));
process.stdout.write(`${JSON.stringify({ status: "ok", results })}\n`);
