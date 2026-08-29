import mldsaModule from "../vendor/mldsa-native/mldsa65.wasm";

import { signExactPdf, type HybridSignatureResult } from "./hybrid-signing.ts";
import { Mldsa65 } from "./mldsa65.ts";

const mldsa65 = new Mldsa65(mldsaModule);

export function signTrustedFinalPdf(
  pdfBytes: Uint8Array,
  ed25519SeedB64: string,
  mldsa65SeedB64: string,
): Promise<HybridSignatureResult> {
  return signExactPdf(pdfBytes, { ed25519SeedB64, mldsa65SeedB64 }, mldsa65);
}
