import type { HybridSignatureResult } from "./hybrid-signing.ts";

export const FOUNDATION_PROOF_KIND = "phase0-synthetic-pdf";

export interface FoundationProof {
  readonly schema_version: "1";
  readonly kind: typeof FOUNDATION_PROOF_KIND;
  readonly pdf_b64: string;
  readonly signature_manifest: HybridSignatureResult["manifest"];
  readonly public_keys: {
    readonly ed25519_spki_b64: string;
    readonly mldsa65_raw_b64: string;
  };
}

function base64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  const chunkBytes = 32_768;
  for (let offset = 0; offset < bytes.byteLength; offset += chunkBytes) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + chunkBytes)));
  }
  return btoa(chunks.join(""));
}

export function createFoundationProof(
  pdfBytes: Uint8Array,
  signed: HybridSignatureResult,
): FoundationProof {
  return Object.freeze({
    schema_version: "1",
    kind: FOUNDATION_PROOF_KIND,
    pdf_b64: base64(pdfBytes),
    signature_manifest: signed.manifest,
    public_keys: Object.freeze({
      ed25519_spki_b64: base64(signed.publicKeys.ed25519Spki),
      mldsa65_raw_b64: base64(signed.publicKeys.mldsa65Raw),
    }),
  });
}
