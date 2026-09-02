import { z } from "zod";

const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;
const keyId = (algorithm: "ed25519" | "mldsa65") =>
  z.string().regex(new RegExp(`^${algorithm}:[0-9a-f]{32}$`, "u"));

function canonicalBase64(bytes: number) {
  return z.string().regex(BASE64).refine((value) => {
    try {
      const decoded = atob(value);
      return decoded.length === bytes && btoa(decoded) === value;
    } catch {
      return false;
    }
  }, "noncanonical_signature");
}

export const signatureManifestSchema = z.strictObject({
  schema_version: z.literal("1"),
  pdf_sha256: z.string().regex(/^[0-9a-f]{64}$/u),
  ed25519_algorithm: z.literal("Ed25519"),
  ed25519_public_key_id: keyId("ed25519"),
  ed25519_signature_b64: canonicalBase64(64),
  mldsa65_algorithm: z.literal("ML-DSA-65"),
  mldsa65_public_key_id: keyId("mldsa65"),
  mldsa65_signature_b64: canonicalBase64(3_309),
});

export type SignatureManifest = z.output<typeof signatureManifestSchema>;
