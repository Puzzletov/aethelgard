import { z } from "zod";

import { AI_RESPONSE_MAX_BYTES } from "./ai-transport.ts";
import {
  type NormalizedSourceRecord,
  sourceReferenceSchema,
} from "./analyze.ts";

export const MAX_EVIDENCE_REFERENCES = 8;

export const modelTextSchema = z.string().min(1).refine(
  (value) => !/<\/?[A-Za-z][^>]*>/u.test(value),
  "html_forbidden",
);

export function evidenceSchema(minimum: 0 | 1 = 1) {
  return z.array(sourceReferenceSchema).min(minimum).max(MAX_EVIDENCE_REFERENCES)
    .refine((values) => uniqueJson(values), "duplicate_evidence");
}

export function uniqueJson(values: readonly unknown[]): boolean {
  return new Set(values.map((value) => JSON.stringify(value))).size === values.length;
}

export function withinAiResponseBound(value: unknown): boolean {
  try {
    const encoded = new TextEncoder().encode(JSON.stringify(value));
    return encoded.byteLength <= AI_RESPONSE_MAX_BYTES;
  } catch {
    return false;
  }
}

export function referencesExist(
  references: readonly (readonly z.output<typeof sourceReferenceSchema>[])[],
  sources: readonly NormalizedSourceRecord[],
): boolean {
  const allowed = new Set(sources.map((source) => JSON.stringify(source.reference)));
  return references.flat().every((reference) => allowed.has(JSON.stringify(reference)));
}
