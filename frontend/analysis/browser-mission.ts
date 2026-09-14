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
import { evaluateEnglishLanguage } from "../input/validation/language-gate";
import { enforceWordLimit } from "../input/validation/word-limit";

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

function localDocument(parsed: ParserOperationResult) {
  if (!parsed.ok) return DOCUMENT_FAILURE;
  const sources = normalizeSourceRecords(parsed.value);
  if (sources === undefined) return DOCUMENT_FAILURE;
  const bounded = enforceWordLimit(sources);
  return bounded.ok ? bounded.records : bounded;
}

function isLocalSources(value: ReturnType<typeof localDocument>): value is readonly LocalSourceRecord[] {
  return Array.isArray(value);
}

async function parseWithRecovery(
  document: SelectedDocument, parseDocument: MissionDependencies["parseDocument"],
): Promise<ParserOperationResult> {
  let first: ParserOperationResult;
  try { first = await parseDocument(document); } catch { first = { ok: false, reason: "crash" }; }
  if (first.ok || first.reason === "invalid") return first;
  try { return await parseDocument(document); } catch { return { ok: false, reason: "crash" }; }
}

export async function runBrowserMission(
  document: SelectedDocument, focus: Focus, token: string, onStage: (stage: MissionStage) => void,
  dependencies: MissionDependencies = DEFAULT_DEPENDENCIES,
): Promise<MissionOutcome> {
  onStage("preparing");
  const parsed = await parseWithRecovery(document, dependencies.parseDocument);
  if (!parsed.ok && parsed.reason !== "invalid") return { result: PARSER_RESOURCE_FAILURE, sources: [] };
  const local = localDocument(parsed);
  if (!isLocalSources(local)) return { result: local, sources: [] };
  if (!evaluateEnglishLanguage(local).accepted) return { result: LANGUAGE_FAILURE, sources: [] };
  let redaction: RedactionOperationResult;
  try { redaction = await dependencies.redact({ schema_version: "1", sources: local }); }
  catch { return { result: PRIVACY_FAILURE, sources: [] }; }
  if ("ok" in redaction) return { result: PRIVACY_FAILURE, sources: [] };
  let body: Uint8Array;
  try { body = serializeAnalyzeRequest({ redaction_result: redaction, turnstile_token: token,
    focus, requested_outputs: ["text"] }); } catch { return { result: PRIVACY_FAILURE, sources: [] }; }
  onStage("analyzing");
  let result: MissionResult;
  try { result = await dependencies.send(body); } catch { result = ANALYSIS_FAILURE; }
  onStage("reporting");
  onStage("complete");
  return { result, sources: redaction.sources };
}
