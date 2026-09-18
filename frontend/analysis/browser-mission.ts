import { serializeAnalyzeRequest, type NormalizedSourceRecord } from "../../src/contracts/analyze";
import {
  finishedAnalysisSchema,
  type FinishedAnalysis,
} from "../../src/contracts/finished-analysis";
import { safeModeSchema, type SafeMode } from "../../src/contracts/safe-mode";
import type { SelectedDocument } from "../input/document-input";
import { normalizeSourceRecords } from "../input/normalization/source-record";
import type { NormalizedSourceRecord as LocalSourceRecord } from "../input/normalization/source-record";
import { runParserWorker, type ParserOperationResult } from "../input/parsers/run-parser";
import { runRedactionWorker, type RedactionOperationResult } from "../input/redaction/run-redaction";
import { inspectEnglishLanguage } from "../input/validation/language-gate";
import { enforceWordLimit } from "../input/validation/word-limit";
import { pdfDiagnostic, type PdfPreparationDiagnostic } from "./pdf-diagnostic";

const ANALYSIS_WALL_MS = 180_000;
const PUBLIC_ANALYZE_ENDPOINT = "https://aethelgard.justbwas.workers.dev/analyze";
const BETA_ANALYZE_ENDPOINT = "https://aethelgard-managed-golden-edge.justbwas.workers.dev/analyze";
export const ANALYZE_ENDPOINT = process.env.NEXT_PUBLIC_AETHELGARD_SIMPLE_BETA === "1"
  ? BETA_ANALYZE_ENDPOINT : PUBLIC_ANALYZE_ENDPOINT;

export type MissionStage = "preparing" | "analyzing" | "reporting" | "complete";
export type MissionResult = FinishedAnalysis | SafeMode;
export interface MissionOutcome {
  readonly result: MissionResult;
  readonly sources: readonly NormalizedSourceRecord[];
  readonly diagnostic?: PdfPreparationDiagnostic;
}
type Focus = "full" | "financial" | "strategic" | "security";

export interface MissionDependencies {
  readonly parseDocument: (document: SelectedDocument) => Promise<ParserOperationResult>;
  readonly redact: (request: Parameters<typeof runRedactionWorker>[0]) => Promise<RedactionOperationResult>;
  readonly send: (body: Uint8Array) => Promise<MissionResult>;
}

const DOCUMENT_FAILURE = Object.freeze({ schema_version: "1", ok: false, category: "document",
  code: "invalid_document", message: "Document could not be processed.", retry: "fresh_document" } as const);
const LANGUAGE_FAILURE = Object.freeze({ schema_version: "1", ok: false, category: "language",
  code: "unsupported_language", message: "Use a clearly English document.", retry: "fresh_document" } as const);
const PRIVACY_FAILURE = Object.freeze({ schema_version: "1", ok: false, category: "privacy",
  code: "redaction_failed", message: "Document could not be processed.", retry: "fresh_document" } as const);
const PARSER_RESOURCE_FAILURE = Object.freeze({ schema_version: "1", ok: false, category: "client_resource",
  code: "parser_resource_failed", message: "Document could not be processed.", retry: "fresh_document" } as const);
const ANALYSIS_FAILURE = Object.freeze({ schema_version: "1", ok: false, category: "analysis",
  code: "analysis_unavailable", message: "Analysis temporarily unavailable.", retry: "later" } as const);

async function defaultSend(body: Uint8Array): Promise<MissionResult> {
  try {
    const response = await fetch(ANALYZE_ENDPOINT, { method: "POST", headers: { "content-type": "application/json" },
      body: new TextDecoder().decode(body), signal: AbortSignal.timeout(ANALYSIS_WALL_MS) });
    if (!response.ok) return ANALYSIS_FAILURE;
    const value: unknown = await response.json();
    const safe = safeModeSchema.safeParse(value);
    if (safe.success) return safe.data;
    const complete = finishedAnalysisSchema.safeParse(value);
    return complete.success ? complete.data : ANALYSIS_FAILURE;
  } catch { return ANALYSIS_FAILURE; }
}

const DEFAULT_DEPENDENCIES: MissionDependencies = Object.freeze({
  parseDocument: runParserWorker, redact: runRedactionWorker, send: defaultSend,
});

async function parseWithRecovery(
  document: SelectedDocument, parseDocument: MissionDependencies["parseDocument"],
): Promise<ParserOperationResult> {
  let first: ParserOperationResult;
  try { first = await parseDocument(document); } catch { first = { ok: false, reason: "crash" }; }
  if (first.ok || first.reason === "invalid") return first;
  try { return await parseDocument(document); } catch { return { ok: false, reason: "crash" }; }
}

function parserFailureCode(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || Reflect.get(value, "ok") !== false) return undefined;
  return Reflect.get(value, "code") === "pdf_parse_failed" ? "pdf_parse_failed" : undefined;
}

function nonemptyPdfPages(value: unknown): number | "unavailable" {
  if (typeof value !== "object" || value === null || Reflect.get(value, "format") !== "pdf") return "unavailable";
  const pages = Reflect.get(value, "pages");
  return Array.isArray(pages) ? pages.length : "unavailable";
}

function characterCount(sources: readonly LocalSourceRecord[]): number {
  let count = 0;
  for (const source of sources) for (const _point of source.content) count += 1;
  return count;
}

function failed(
  document: SelectedDocument, result: SafeMode, stage: PdfPreparationDiagnostic["stage"], reasonCode: string,
  observed: Parameters<typeof pdfDiagnostic>[3] = {},
): MissionOutcome {
  return document.format === "pdf"
    ? { result, sources: [], diagnostic: pdfDiagnostic(document.byteLength, stage, reasonCode, observed) }
    : { result, sources: [] };
}

export async function runBrowserMission(
  document: SelectedDocument, focus: Focus, token: string, onStage: (stage: MissionStage) => void,
  dependencies: MissionDependencies = DEFAULT_DEPENDENCIES,
): Promise<MissionOutcome> {
  onStage("preparing");
  const parsed = await parseWithRecovery(document, dependencies.parseDocument);
  if (!parsed.ok && parsed.reason !== "invalid") {
    return failed(document, PARSER_RESOURCE_FAILURE, "EXTRACTION", parsed.reason);
  }
  if (!parsed.ok) return failed(document, DOCUMENT_FAILURE, "EXTRACTION", parsed.reason);
  const extractionCode = parserFailureCode(parsed.value);
  if (extractionCode !== undefined) return failed(document, DOCUMENT_FAILURE, "EXTRACTION", extractionCode);
  const local = normalizeSourceRecords(parsed.value);
  const pageObservation = { pdf_nonempty_pages: nonemptyPdfPages(parsed.value) } as const;
  if (local === undefined) return failed(document, DOCUMENT_FAILURE, "NORMALIZATION", "invalid_document", pageObservation);
  const chars = characterCount(local);
  const bounded = enforceWordLimit(local);
  const localObservation = { ...pageObservation, extracted_char_count: chars,
    extracted_word_count: bounded.ok ? bounded.word_count : 8_001, source_record_count: local.length } as const;
  if (!bounded.ok) return failed(document, bounded, "NORMALIZATION", bounded.code, localObservation);
  const language = inspectEnglishLanguage(bounded.records);
  const languageObservation = { ...localObservation, language_top_rank: language.top_rank,
    language_gate: language.decision.accepted ? "PASS" : "FAIL" } as const;
  if (!language.decision.accepted) {
    return failed(document, LANGUAGE_FAILURE, "LANGUAGE", language.decision.reason, languageObservation);
  }
  let redaction: RedactionOperationResult;
  try { redaction = await dependencies.redact({ schema_version: "1", sources: bounded.records }); }
  catch { return failed(document, PRIVACY_FAILURE, "REDACTION", "redaction_failed",
    { ...languageObservation, redaction_status: "FAIL" }); }
  if ("ok" in redaction) return failed(document, PRIVACY_FAILURE, "REDACTION", redaction.diagnostic_reason,
    { ...languageObservation, redaction_status: "FAIL", ...(redaction.leak_diagnostic ?? {}) });
  const redactionObservation = { ...languageObservation, pii_detected_count: redaction.placeholder_count,
    redaction_status: "PASS" as const };
  let body: Uint8Array;
  try { body = serializeAnalyzeRequest({ redaction_result: redaction, turnstile_token: token,
    focus, requested_outputs: ["text"] }); } catch {
    return failed(document, PRIVACY_FAILURE, "OUTBOUND_PREPARATION", "redaction_failed", redactionObservation);
  }
  onStage("analyzing");
  let result: MissionResult;
  try { result = await dependencies.send(body); } catch { result = ANALYSIS_FAILURE; }
  onStage("reporting");
  onStage("complete");
  return { result, sources: redaction.sources };
}
