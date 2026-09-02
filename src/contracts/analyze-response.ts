import { z } from "zod";

import { reportModelSchema } from "./report-model.ts";
import { signatureManifestSchema } from "./signature-manifest.ts";

const MAX_PDF_B64_CHARS = Math.ceil(8_388_608 / 3) * 4;
const MAX_XLSX_B64_CHARS = Math.ceil(4_194_304 / 3) * 4;
const UTF8 = new TextEncoder();
function isBase64(value: string): boolean {
  if (value.length % 4 !== 0) return false;
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  for (let index = 0; index < value.length - padding; index += 1) {
    const code = value.charCodeAt(index);
    const allowed = code >= 65 && code <= 90 || code >= 97 && code <= 122
      || code >= 48 && code <= 57 || code === 43 || code === 47;
    if (!allowed) return false;
  }
  return !value.slice(0, -padding || undefined).includes("=");
}

export const analyzeResponseSchema = z.strictObject({
  schema_version: z.literal("1"),
  dashboard: reportModelSchema,
  pdf: z.strictObject({
    bytes_b64: z.string().max(MAX_PDF_B64_CHARS).refine(isBase64),
    signature_manifest: signatureManifestSchema,
  }).optional(),
  xlsx_b64: z.string().max(MAX_XLSX_B64_CHARS).refine(isBase64).optional(),
  text_utf8: z.string().refine((value) => UTF8.encode(value).byteLength <= 1_048_576).optional(),
});

export type AnalyzeResponse = z.output<typeof analyzeResponseSchema>;
