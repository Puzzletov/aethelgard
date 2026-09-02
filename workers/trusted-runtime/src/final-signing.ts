import { signatureManifestSchema, type SignatureManifest } from "../../../src/contracts/signature-manifest.ts";
import type { HybridSignatureResult, SigningSecrets } from "./hybrid-signing.ts";
import { MAX_FINAL_PDF_BYTES } from "./browser-pdf.ts";

export const MAX_SIGNATURE_MANIFEST_BYTES = 32_768;
export const SIGNING_MEDIAN_TARGET_MS = 50;
const UTF8 = new TextEncoder();
type Signer = (bytes: Uint8Array, secrets: SigningSecrets) => Promise<HybridSignatureResult>;

export interface SignedFinalPdf {
  readonly bytes: Uint8Array;
  readonly manifest: SignatureManifest;
  readonly publicKeys: HybridSignatureResult["publicKeys"];
}

function validPdf(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 8 || bytes.byteLength > MAX_FINAL_PDF_BYTES) return false;
  const header = new TextDecoder("ascii").decode(bytes.subarray(0, 5));
  const trailer = new TextDecoder("ascii").decode(bytes.subarray(Math.max(0, bytes.byteLength - 1_024)));
  return header === "%PDF-" && trailer.includes("%%EOF");
}

function unchanged(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

export async function integrateTrustedFinalPdf(
  pdfBytes: Uint8Array,
  secrets: SigningSecrets,
  signer: Signer,
): Promise<SignedFinalPdf | undefined> {
  if (!(pdfBytes instanceof Uint8Array) || !validPdf(pdfBytes)) return undefined;
  const snapshot = Uint8Array.from(pdfBytes);
  try {
    const signed = await signer(pdfBytes, secrets);
    if (!unchanged(pdfBytes, snapshot)) {
      pdfBytes.set(snapshot);
      return undefined;
    }
    const manifest = signatureManifestSchema.safeParse(signed.manifest);
    if (!manifest.success
      || UTF8.encode(JSON.stringify(manifest.data)).byteLength > MAX_SIGNATURE_MANIFEST_BYTES) return undefined;
    return Object.freeze({ bytes: pdfBytes, manifest: manifest.data, publicKeys: signed.publicKeys });
  } catch {
    if (!unchanged(pdfBytes, snapshot)) pdfBytes.set(snapshot);
    return undefined;
  } finally {
    snapshot.fill(0);
  }
}
