import {
  createHash,
  createPrivateKey,
  createPublicKey,
  randomBytes,
  sign,
  verify,
} from "node:crypto";

import { Mldsa65, MLDSA65_SEED_BYTES } from "./mldsa65.ts";
import type { SignatureManifest } from "../../../src/contracts/signature-manifest.ts";

const ED25519_SEED_BYTES = 32;
const ED25519_PKCS8_PREFIX = Uint8Array.from([
  0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06,
  0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20,
]);
const STRICT_BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export interface SigningSecrets {
  readonly ed25519SeedB64: string;
  readonly mldsa65SeedB64: string;
}

export type DetachedSignatureManifest = SignatureManifest;

export interface HybridSignatureResult {
  readonly manifest: DetachedSignatureManifest;
  readonly publicKeys: {
    readonly ed25519Spki: Uint8Array;
    readonly mldsa65Raw: Uint8Array;
  };
}

export interface SigningIdentity {
  readonly ed25519KeyId: string;
  readonly mldsa65KeyId: string;
}

function decodeSeed(name: string, encoded: string, expectedBytes: number): Uint8Array {
  if (!STRICT_BASE64.test(encoded) || encoded.length > 64) throw new Error(`${name} is invalid.`);
  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    throw new Error(`${name} is invalid.`);
  }
  const bytes = Uint8Array.from(decoded, (value) => value.charCodeAt(0));
  if (bytes.byteLength !== expectedBytes || base64(bytes) !== encoded) {
    bytes.fill(0);
    throw new Error(`${name} is invalid.`);
  }
  return bytes;
}

function base64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function keyId(algorithm: "ed25519" | "mldsa65", publicKey: Uint8Array): string {
  return `${algorithm}:${createHash("sha256").update(publicKey).digest("hex").slice(0, 32)}`;
}

function ed25519PrivateKey(seed: Uint8Array): ReturnType<typeof createPrivateKey> {
  const der = new Uint8Array(ED25519_PKCS8_PREFIX.byteLength + seed.byteLength);
  der.set(ED25519_PKCS8_PREFIX);
  der.set(seed, ED25519_PKCS8_PREFIX.byteLength);
  try {
    return createPrivateKey({ key: der, format: "der", type: "pkcs8" });
  } finally {
    der.fill(0);
  }
}

export async function deriveSigningIdentity(
  secrets: SigningSecrets,
  mldsa65: Mldsa65,
): Promise<SigningIdentity> {
  const edSeed = decodeSeed("Ed25519 seed", secrets.ed25519SeedB64, ED25519_SEED_BYTES);
  const mlSeed = decodeSeed("ML-DSA-65 seed", secrets.mldsa65SeedB64, MLDSA65_SEED_BYTES);
  try {
    const edPublic = Uint8Array.from(createPublicKey(ed25519PrivateKey(edSeed))
      .export({ format: "der", type: "spki" }));
    const mlPublic = await mldsa65.publicKeyFromSeed(mlSeed);
    return Object.freeze({ ed25519KeyId: keyId("ed25519", edPublic),
      mldsa65KeyId: keyId("mldsa65", mlPublic) });
  } finally {
    edSeed.fill(0);
    mlSeed.fill(0);
  }
}

export async function signExactPdf(
  pdfBytes: Uint8Array,
  secrets: SigningSecrets,
  mldsa65: Mldsa65,
): Promise<HybridSignatureResult> {
  if (pdfBytes.byteLength < 8 || new TextDecoder("ascii").decode(pdfBytes.subarray(0, 5)) !== "%PDF-") {
    throw new Error("The final PDF is invalid.");
  }
  const digest = Uint8Array.from(createHash("sha256").update(pdfBytes).digest());
  const edSeed = decodeSeed("Ed25519 seed", secrets.ed25519SeedB64, ED25519_SEED_BYTES);
  const mlSeed = decodeSeed("ML-DSA-65 seed", secrets.mldsa65SeedB64, MLDSA65_SEED_BYTES);
  const mlRandom = Uint8Array.from(randomBytes(32));
  try {
    const edPrivate = ed25519PrivateKey(edSeed);
    const edPublic = createPublicKey(edPrivate);
    const edPublicSpki = Uint8Array.from(edPublic.export({ format: "der", type: "spki" }));
    const edSignature = Uint8Array.from(sign(null, digest, edPrivate));
    if (!verify(null, digest, edPublic, edSignature)) throw new Error("Ed25519 self-check failed.");

    const ml = await mldsa65.signDigest(mlSeed, digest, mlRandom);
    return {
      manifest: Object.freeze({
        schema_version: "1",
        pdf_sha256: Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join(""),
        ed25519_algorithm: "Ed25519",
        ed25519_public_key_id: keyId("ed25519", edPublicSpki),
        ed25519_signature_b64: base64(edSignature),
        mldsa65_algorithm: "ML-DSA-65",
        mldsa65_public_key_id: keyId("mldsa65", ml.publicKey),
        mldsa65_signature_b64: base64(ml.signature),
      }),
      publicKeys: { ed25519Spki: edPublicSpki, mldsa65Raw: ml.publicKey },
    };
  } finally {
    digest.fill(0);
    edSeed.fill(0);
    mlSeed.fill(0);
    mlRandom.fill(0);
  }
}
