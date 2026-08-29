import {
  createHash,
  createPublicKey,
  generateKeyPairSync,
  verify,
} from "node:crypto";

const MLDSA65_PUBLIC_KEY_BYTES = 1_952;
const MLDSA65_SIGNATURE_BYTES = 3_309;
const ED25519_SIGNATURE_BYTES = 64;
const STRICT_BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value, expected) {
  return isRecord(value) &&
    Object.keys(value).sort().join("\0") === [...expected].sort().join("\0");
}

function decodeBase64(value, expectedBytes) {
  if (typeof value !== "string" || !STRICT_BASE64.test(value)) throw new Error("Proof base64 is invalid.");
  const bytes = Buffer.from(value, "base64");
  if (bytes.byteLength !== expectedBytes || bytes.toString("base64") !== value) {
    throw new Error("Proof base64 length is invalid.");
  }
  return bytes;
}

function keyId(algorithm, publicKey) {
  return `${algorithm}:${createHash("sha256").update(publicKey).digest("hex").slice(0, 32)}`;
}

function mldsaPublicKey(raw) {
  const template = generateKeyPairSync("ml-dsa-65").publicKey.export({ format: "der", type: "spki" });
  const prefix = template.subarray(0, template.byteLength - MLDSA65_PUBLIC_KEY_BYTES);
  return createPublicKey({ key: Buffer.concat([prefix, raw]), format: "der", type: "spki" });
}

export function verifyPhase0Proof(responseBody) {
  if (!exactKeys(responseBody, ["ok", "output"]) || responseBody.ok !== true) {
    throw new Error("Phase 0 response envelope is invalid.");
  }
  const output = responseBody.output;
  if (!exactKeys(output, ["schema_version", "kind", "pdf_b64", "signature_manifest", "public_keys"]) ||
      output.schema_version !== "1" || output.kind !== "phase0-synthetic-pdf") {
    throw new Error("Phase 0 proof envelope is invalid.");
  }
  if (!exactKeys(output.public_keys, ["ed25519_spki_b64", "mldsa65_raw_b64"])) {
    throw new Error("Phase 0 public keys are invalid.");
  }
  const manifest = output.signature_manifest;
  const manifestKeys = [
    "schema_version",
    "pdf_sha256",
    "ed25519_algorithm",
    "ed25519_public_key_id",
    "ed25519_signature_b64",
    "mldsa65_algorithm",
    "mldsa65_public_key_id",
    "mldsa65_signature_b64",
  ];
  if (!exactKeys(manifest, manifestKeys) || manifest.schema_version !== "1" ||
      manifest.ed25519_algorithm !== "Ed25519" || manifest.mldsa65_algorithm !== "ML-DSA-65") {
    throw new Error("Phase 0 signature manifest is invalid.");
  }

  const pdf = Buffer.from(output.pdf_b64, "base64");
  if (!STRICT_BASE64.test(output.pdf_b64) || pdf.toString("base64") !== output.pdf_b64 ||
      pdf.byteLength < 8 || pdf.byteLength > 8 * 1024 * 1024 || pdf.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("Phase 0 PDF is invalid.");
  }
  const edPublicDer = Buffer.from(output.public_keys.ed25519_spki_b64, "base64");
  if (!STRICT_BASE64.test(output.public_keys.ed25519_spki_b64) ||
      edPublicDer.toString("base64") !== output.public_keys.ed25519_spki_b64) {
    throw new Error("Ed25519 public key is invalid.");
  }
  const edPublic = createPublicKey({ key: edPublicDer, format: "der", type: "spki" });
  if (edPublic.asymmetricKeyType !== "ed25519") throw new Error("Ed25519 public key type is invalid.");
  const mlPublicRaw = decodeBase64(output.public_keys.mldsa65_raw_b64, MLDSA65_PUBLIC_KEY_BYTES);
  const edSignature = decodeBase64(manifest.ed25519_signature_b64, ED25519_SIGNATURE_BYTES);
  const mlSignature = decodeBase64(manifest.mldsa65_signature_b64, MLDSA65_SIGNATURE_BYTES);
  const digest = createHash("sha256").update(pdf).digest();
  if (!/^[0-9a-f]{64}$/.test(manifest.pdf_sha256) || digest.toString("hex") !== manifest.pdf_sha256) {
    throw new Error("PDF digest does not match the manifest.");
  }
  if (manifest.ed25519_public_key_id !== keyId("ed25519", edPublicDer) ||
      manifest.mldsa65_public_key_id !== keyId("mldsa65", mlPublicRaw)) {
    throw new Error("Public key IDs do not match the supplied keys.");
  }
  const mlPublic = mldsaPublicKey(mlPublicRaw);
  if (!verify(null, digest, edPublic, edSignature) || !verify(null, digest, mlPublic, mlSignature)) {
    throw new Error("A Phase 0 signature did not verify.");
  }
  const changed = Buffer.from(pdf);
  changed[changed.byteLength - 1] ^= 1;
  const changedDigest = createHash("sha256").update(changed).digest();
  if (verify(null, changedDigest, edPublic, edSignature) || verify(null, changedDigest, mlPublic, mlSignature)) {
    throw new Error("A changed PDF byte was accepted.");
  }
  return Object.freeze({
    pdf_bytes: pdf.byteLength,
    pdf_sha256: manifest.pdf_sha256,
    ed25519_verified: true,
    mldsa65_verified: true,
    changed_byte_rejected: true,
  });
}
