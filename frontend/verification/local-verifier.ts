import { signatureManifestSchema } from "../../src/contracts/signature-manifest.ts";
import { Mldsa65, MLDSA65_PUBLIC_KEY_BYTES, MLDSA65_SIGNATURE_BYTES } from "../../workers/trusted-runtime/src/mldsa65.ts";
import { MLDSA65_WASM_B64 } from "./mldsa65-wasm";
import { parseDetachedManifest } from "./detached-manifest";

const MAX_PDF_BYTES = 8_388_608;
const VERIFY_TIMEOUT_MS = 10_000;
const FALSE_RESULT = Object.freeze({ schema_version: "1", digest_matches: false,
  ed25519_verified: false, mldsa65_verified: false, valid: false } as const);

export interface PublicKeyDocument {
  readonly schema_version: "1";
  readonly ed25519: readonly { readonly algorithm: "Ed25519"; readonly public_key_id: string;
    readonly public_key_spki_b64: string; readonly status: "current" | "retired" }[];
  readonly mldsa65: readonly { readonly algorithm: "ML-DSA-65"; readonly public_key_id: string;
    readonly public_key_raw_b64: string; readonly status: "current" | "retired" }[];
}

export interface VerificationResult {
  readonly schema_version: "1";
  readonly digest_matches: boolean;
  readonly ed25519_verified: boolean;
  readonly mldsa65_verified: boolean;
  readonly valid: boolean;
}

function decodeBase64(value: string, expected: number): Uint8Array | undefined {
  try {
    const binary = atob(value);
    if (binary.length !== expected || btoa(binary) !== value) return undefined;
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch { return undefined; }
}

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (value) => value.toString(16).padStart(2, "0")).join("");
}

async function keyId(prefix: "ed25519" | "mldsa65", bytes: Uint8Array): Promise<string> {
  return `${prefix}:${hex(await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes).buffer)).slice(0, 32)}`;
}

function matchingKeys(manifest: ReturnType<typeof parseDetachedManifest>, documents: readonly PublicKeyDocument[]) {
  if (manifest === undefined) return undefined;
  const ed25519 = documents.flatMap((item) => item.ed25519).find((item) =>
    item.algorithm === "Ed25519" && item.public_key_id === manifest.ed25519_public_key_id);
  const mldsa65 = documents.flatMap((item) => item.mldsa65).find((item) =>
    item.algorithm === "ML-DSA-65" && item.public_key_id === manifest.mldsa65_public_key_id);
  return ed25519 === undefined || mldsa65 === undefined ? undefined : { ed25519, mldsa65 };
}

async function verifyEd25519(spki: Uint8Array, digest: Uint8Array, signature: Uint8Array) {
  try {
    const key = await crypto.subtle.importKey("spki", Uint8Array.from(spki).buffer,
      { name: "Ed25519" }, false, ["verify"]);
    return crypto.subtle.verify("Ed25519", key, Uint8Array.from(signature).buffer,
      Uint8Array.from(digest).buffer);
  } catch { return false; }
}

async function verifyUnchecked(pdf: Uint8Array, manifestBytes: Uint8Array,
  documents: readonly PublicKeyDocument[]): Promise<VerificationResult> {
  const manifest = parseDetachedManifest(manifestBytes);
  if (manifest === undefined) return FALSE_RESULT;
  const digestBuffer = await crypto.subtle.digest("SHA-256", Uint8Array.from(pdf).buffer);
  const digest = new Uint8Array(digestBuffer);
  const digestMatches = hex(digestBuffer) === manifest.pdf_sha256;
  const keys = matchingKeys(manifest, documents);
  if (keys === undefined) return { ...FALSE_RESULT, digest_matches: digestMatches };
  const edKey = decodeBase64(keys.ed25519.public_key_spki_b64, 44);
  const mlKey = decodeBase64(keys.mldsa65.public_key_raw_b64, MLDSA65_PUBLIC_KEY_BYTES);
  const edSignature = decodeBase64(manifest.ed25519_signature_b64, 64);
  const mlSignature = decodeBase64(manifest.mldsa65_signature_b64, MLDSA65_SIGNATURE_BYTES);
  const edUsable = edKey !== undefined && edSignature !== undefined
    && await keyId("ed25519", edKey) === keys.ed25519.public_key_id;
  const mlUsable = mlKey !== undefined && mlSignature !== undefined
    && await keyId("mldsa65", mlKey) === keys.mldsa65.public_key_id;
  const wasm = decodeBase64(MLDSA65_WASM_B64, 40_843);
  if (wasm === undefined) return FALSE_RESULT;
  const engine = new Mldsa65(await WebAssembly.compile(Uint8Array.from(wasm).buffer));
  const [ed25519, mldsa65] = await Promise.all([
    edUsable ? verifyEd25519(edKey, digest, edSignature) : false,
    mlUsable ? engine.verifyDigest(mlKey, digest, mlSignature) : false,
  ]);
  return { schema_version: "1", digest_matches: digestMatches, ed25519_verified: ed25519,
    mldsa65_verified: mldsa65, valid: digestMatches && ed25519 && mldsa65 };
}

export async function verifyReport(pdf: Uint8Array, manifestBytes: Uint8Array,
  documents: readonly PublicKeyDocument[]): Promise<VerificationResult> {
  if (!(pdf instanceof Uint8Array) || pdf.byteLength < 8 || pdf.byteLength > MAX_PDF_BYTES
    || !signatureManifestSchema.safeParse(parseDetachedManifest(manifestBytes)).success) return FALSE_RESULT;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([verifyUnchecked(pdf, manifestBytes, documents),
      new Promise<VerificationResult>((resolve) => {
        timeout = setTimeout(() => resolve(FALSE_RESULT), VERIFY_TIMEOUT_MS);
      })]);
  } catch { return FALSE_RESULT; }
  finally { if (timeout !== undefined) clearTimeout(timeout); }
}
