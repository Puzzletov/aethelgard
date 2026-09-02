import mldsaModule from "../vendor/mldsa-native/mldsa65.wasm";

import { deriveSigningIdentity, signExactPdf, type HybridSignatureResult,
  type SigningIdentity } from "./hybrid-signing.ts";
import { integrateTrustedFinalPdf, type SignedFinalPdf } from "./final-signing.ts";
import { Mldsa65 } from "./mldsa65.ts";

const mldsa65 = new Mldsa65(mldsaModule);

export function signTrustedFinalPdf(
  pdfBytes: Uint8Array,
  ed25519SeedB64: string,
  mldsa65SeedB64: string,
): Promise<HybridSignatureResult> {
  return signExactPdf(pdfBytes, { ed25519SeedB64, mldsa65SeedB64 }, mldsa65);
}

export function signProductionFinalPdf(
  pdfBytes: Uint8Array,
  ed25519SeedB64: string,
  mldsa65SeedB64: string,
): Promise<SignedFinalPdf | undefined> {
  const secrets = { ed25519SeedB64, mldsa65SeedB64 };
  return integrateTrustedFinalPdf(pdfBytes, secrets,
    (bytes, signingSecrets) => signExactPdf(bytes, signingSecrets, mldsa65));
}

export function productionSigningIdentity(
  ed25519SeedB64: string,
  mldsa65SeedB64: string,
): Promise<SigningIdentity> {
  return deriveSigningIdentity({ ed25519SeedB64, mldsa65SeedB64 }, mldsa65);
}
