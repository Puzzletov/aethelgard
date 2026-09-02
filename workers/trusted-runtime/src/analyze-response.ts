import { createHash } from "node:crypto";

import { analyzeResponseSchema, MAX_ANALYZE_RESPONSE_BYTES,
  type AnalyzeResponse } from "../../../src/contracts/analyze-response.ts";
import { parseReportModel, type ReportModel } from "../../../src/contracts/report-model.ts";
import { signatureManifestSchema, type SignatureManifest } from "../../../src/contracts/signature-manifest.ts";
import { ALLOWED_OUTPUTS } from "../../../src/public-edge/config.ts";
import { MAX_FINAL_PDF_BYTES } from "./browser-pdf.ts";
import { MAX_TEXT_OUTPUT_BYTES } from "./plain-exports.ts";
import { MAX_XLSX_OUTPUT_BYTES } from "./xlsx.ts";

export const MAX_ANALYSIS_RESPONSE_BYTES = MAX_ANALYZE_RESPONSE_BYTES;
export const MAX_RESPONSE_PARTS = 4;
const UTF8 = new TextEncoder();

interface SignedPdfInput {
  readonly bytes: Uint8Array;
  readonly signature_manifest: unknown;
}

export interface AnalyzeResponseInput {
  readonly dashboard: unknown;
  readonly requested_outputs: readonly (typeof ALLOWED_OUTPUTS)[number][];
  readonly pdf?: SignedPdfInput;
  readonly text?: Uint8Array;
  readonly xlsx?: Uint8Array;
}

const INPUT_KEYS = new Set(["dashboard", "requested_outputs", "pdf", "text", "xlsx"]);

function base64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  for (let offset = 0; offset < bytes.byteLength; offset += 32_768) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 32_768)));
  }
  return btoa(chunks.join(""));
}

function requested(values: readonly string[]): boolean {
  if (values.length < 1 || values.length > ALLOWED_OUTPUTS.length) return false;
  return values.every((value, index) => ALLOWED_OUTPUTS[index] === value
    || (ALLOWED_OUTPUTS.includes(value as (typeof ALLOWED_OUTPUTS)[number])
      && (index === 0 || ALLOWED_OUTPUTS.indexOf(value as (typeof ALLOWED_OUTPUTS)[number])
        > ALLOWED_OUTPUTS.indexOf(values[index - 1] as (typeof ALLOWED_OUTPUTS)[number]))));
}

function validPdf(bytes: Uint8Array, manifest: SignatureManifest): boolean {
  if (bytes.byteLength < 8 || bytes.byteLength > MAX_FINAL_PDF_BYTES) return false;
  const header = new TextDecoder("ascii").decode(bytes.subarray(0, 5));
  const trailer = new TextDecoder("ascii").decode(bytes.subarray(Math.max(0, bytes.byteLength - 1_024)));
  const digest = createHash("sha256").update(bytes).digest("hex");
  return header === "%PDF-" && trailer.includes("%%EOF") && digest === manifest.pdf_sha256;
}

function pdfPart(value: SignedPdfInput | undefined): AnalyzeResponse["pdf"] | undefined {
  if (value === undefined || !(value.bytes instanceof Uint8Array)) return undefined;
  const manifest = signatureManifestSchema.safeParse(value.signature_manifest);
  if (!manifest.success || !validPdf(value.bytes, manifest.data)) return undefined;
  return { bytes_b64: base64(value.bytes), signature_manifest: manifest.data };
}

function optionalBase64(value: Uint8Array | undefined, maximum: number, magic: string): string | undefined {
  if (!(value instanceof Uint8Array) || value.byteLength > maximum) return undefined;
  return new TextDecoder("ascii").decode(value.subarray(0, magic.length)) === magic ? base64(value) : undefined;
}

function optionalText(value: Uint8Array | undefined): string | undefined {
  if (!(value instanceof Uint8Array) || value.byteLength > MAX_TEXT_OUTPUT_BYTES) return undefined;
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(value);
  } catch {
    return undefined;
  }
}

function envelope(input: AnalyzeResponseInput, dashboard: ReportModel): AnalyzeResponse | undefined {
  const output: AnalyzeResponse = { schema_version: "1", dashboard };
  if (input.requested_outputs.includes("pdf")) output.pdf = pdfPart(input.pdf);
  if (input.requested_outputs.includes("xlsx")) output.xlsx_b64 = optionalBase64(input.xlsx,
    MAX_XLSX_OUTPUT_BYTES, "PK");
  if (input.requested_outputs.includes("text")) output.text_utf8 = optionalText(input.text);
  if (output.pdf === undefined) delete output.pdf;
  if (output.xlsx_b64 === undefined) delete output.xlsx_b64;
  if (output.text_utf8 === undefined) delete output.text_utf8;
  const parsed = analyzeResponseSchema.safeParse(output);
  return parsed.success && Object.keys(parsed.data).length <= MAX_RESPONSE_PARTS + 1 ? parsed.data : undefined;
}

export function createAnalyzeResponse(input: AnalyzeResponseInput): Response | undefined {
  if (Object.keys(input).some((key) => !INPUT_KEYS.has(key))) return undefined;
  const dashboard = parseReportModel(input.dashboard);
  if (dashboard === undefined || !requested(input.requested_outputs)) return undefined;
  const value = envelope(input, dashboard);
  if (value === undefined) return undefined;
  const body = UTF8.encode(JSON.stringify(value));
  if (body.byteLength > MAX_ANALYSIS_RESPONSE_BYTES) return undefined;
  return new Response(body, { status: 200, headers: {
    "cache-control": "no-store", "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
  } });
}
