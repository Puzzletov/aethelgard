import { signatureManifestSchema, type SignatureManifest } from "../../src/contracts/signature-manifest.ts";

export const MAX_SIGNATURE_MANIFEST_BYTES = 32_768;
const UTF8 = new TextEncoder();

export function detachedManifestBytes(manifest: SignatureManifest): Uint8Array | undefined {
  const parsed = signatureManifestSchema.safeParse(manifest);
  if (!parsed.success) return undefined;
  const bytes = UTF8.encode(`${JSON.stringify(parsed.data, null, 2)}\n`);
  return bytes.byteLength <= MAX_SIGNATURE_MANIFEST_BYTES ? bytes : undefined;
}

export function parseDetachedManifest(bytes: Uint8Array): SignatureManifest | undefined {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0
    || bytes.byteLength > MAX_SIGNATURE_MANIFEST_BYTES) return undefined;
  try {
    const value: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    const parsed = signatureManifestSchema.safeParse(value);
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (value) => value.toString(16).padStart(2, "0")).join("");
}

export async function pdfMatchesManifest(
  pdfBytes: Uint8Array, manifestBytes: Uint8Array,
): Promise<boolean> {
  const manifest = parseDetachedManifest(manifestBytes);
  if (manifest === undefined || !(pdfBytes instanceof Uint8Array) || pdfBytes.byteLength < 8) return false;
  const digest = await crypto.subtle.digest("SHA-256", Uint8Array.from(pdfBytes).buffer);
  return hex(digest) === manifest.pdf_sha256;
}
