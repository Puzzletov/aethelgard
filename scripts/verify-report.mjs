import { createHash, createPublicKey, verify } from "node:crypto";
import { readFile, stat } from "node:fs/promises";

const PDF_MAX = 8_388_608;
const JSON_MAX = 32_768;
const TIMEOUT_MS = 10_000;
const ML_PUBLIC_BYTES = 1_952;
const ML_SIGNATURE_BYTES = 3_309;
const ML_SPKI_PREFIX = Buffer.from("308207b2300b0609608648016503040312038207a100", "hex");
const B64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;
const FALSE_RESULT = Object.freeze({ schema_version: "1", digest_matches: false,
  ed25519_verified: false, mldsa65_verified: false, valid: false });

function exact(value, keys) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
}

function base64(value, bytes) {
  if (typeof value !== "string" || !B64.test(value)) return undefined;
  const decoded = Buffer.from(value, "base64");
  return decoded.byteLength === bytes && decoded.toString("base64") === value ? decoded : undefined;
}

async function bounded(path, maximum, minimum = 1) {
  const size = (await stat(path)).size;
  if (size < minimum || size > maximum) throw new Error("bound");
  const bytes = await readFile(path);
  if (bytes.byteLength !== size) throw new Error("changed_input");
  return bytes;
}

function parseJson(bytes) {
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

function manifest(value) {
  const fields = ["schema_version", "pdf_sha256", "ed25519_algorithm", "ed25519_public_key_id",
    "ed25519_signature_b64", "mldsa65_algorithm", "mldsa65_public_key_id", "mldsa65_signature_b64"];
  return exact(value, fields) && value.schema_version === "1"
    && /^[0-9a-f]{64}$/u.test(value.pdf_sha256) && value.ed25519_algorithm === "Ed25519"
    && /^ed25519:[0-9a-f]{32}$/u.test(value.ed25519_public_key_id)
    && value.mldsa65_algorithm === "ML-DSA-65"
    && /^mldsa65:[0-9a-f]{32}$/u.test(value.mldsa65_public_key_id) ? value : undefined;
}

function publicKeys(value) {
  const ed = value?.ed25519; const ml = value?.mldsa65;
  return exact(value, ["schema_version", "ed25519", "mldsa65"]) && value.schema_version === "1"
    && Array.isArray(ed) && Array.isArray(ml) && ed.length > 0 && ml.length > 0
    && ed.length + ml.length <= 16 && ed.every((item) => exact(item,
      ["algorithm", "public_key_id", "public_key_spki_b64", "status"])
      && item.algorithm === "Ed25519" && /^(?:current|retired)$/u.test(item.status)
      && /^ed25519:[0-9a-f]{32}$/u.test(item.public_key_id))
    && ml.every((item) => exact(item, ["algorithm", "public_key_id", "public_key_raw_b64", "status"])
      && item.algorithm === "ML-DSA-65" && /^(?:current|retired)$/u.test(item.status)
      && /^mldsa65:[0-9a-f]{32}$/u.test(item.public_key_id)) ? value : undefined;
}

function keyId(algorithm, bytes) {
  return `${algorithm}:${createHash("sha256").update(bytes).digest("hex").slice(0, 32)}`;
}

async function verifyFiles(paths) {
  const [pdf, manifestBytes, keyBytes] = await Promise.all([
    bounded(paths[0], PDF_MAX, 8), bounded(paths[1], JSON_MAX), bounded(paths[2], JSON_MAX),
  ]);
  if (pdf.subarray(0, 5).toString("ascii") !== "%PDF-") return FALSE_RESULT;
  const record = manifest(parseJson(manifestBytes)); const keys = publicKeys(parseJson(keyBytes));
  if (record === undefined || keys === undefined) return FALSE_RESULT;
  const edRecord = keys.ed25519.find((item) => item.public_key_id === record.ed25519_public_key_id);
  const mlRecord = keys.mldsa65.find((item) => item.public_key_id === record.mldsa65_public_key_id);
  if (edRecord === undefined || mlRecord === undefined) return FALSE_RESULT;
  const edKey = base64(edRecord.public_key_spki_b64, 44);
  const mlKey = base64(mlRecord.public_key_raw_b64, ML_PUBLIC_BYTES);
  const edSig = base64(record.ed25519_signature_b64, 64);
  const mlSig = base64(record.mldsa65_signature_b64, ML_SIGNATURE_BYTES);
  if (edKey === undefined || mlKey === undefined || edSig === undefined || mlSig === undefined) return FALSE_RESULT;
  const digest = createHash("sha256").update(pdf).digest();
  const digestMatches = digest.toString("hex") === record.pdf_sha256;
  const idsMatch = keyId("ed25519", edKey) === edRecord.public_key_id
    && keyId("mldsa65", mlKey) === mlRecord.public_key_id;
  if (!idsMatch) return { ...FALSE_RESULT, digest_matches: digestMatches };
  const ed = createPublicKey({ key: edKey, format: "der", type: "spki" });
  const ml = createPublicKey({ key: Buffer.concat([ML_SPKI_PREFIX, mlKey]), format: "der", type: "spki" });
  const edValid = verify(null, digest, ed, edSig); const mlValid = verify(null, digest, ml, mlSig);
  return { schema_version: "1", digest_matches: digestMatches, ed25519_verified: edValid,
    mldsa65_verified: mlValid, valid: digestMatches && edValid && mlValid };
}

async function main() {
  const paths = process.argv.slice(2);
  if (paths.length !== 3) throw new Error("arguments");
  let timer;
  const result = await Promise.race([verifyFiles(paths), new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS);
  })]);
  clearTimeout(timer);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!result.valid) process.exitCode = 1;
}

main().catch(() => {
  process.stdout.write(`${JSON.stringify(FALSE_RESULT)}\n`);
  process.stderr.write('{"schema_version":"1","error":"verification_failed"}\n');
  process.exitCode = 1;
});
