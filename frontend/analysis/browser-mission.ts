import { serializeAnalyzeRequest, type NormalizedSourceRecord } from "../../src/contracts/analyze";
import { analyzeResponseSchema, MAX_ANALYZE_RESPONSE_BYTES,
  type AnalyzeResponse } from "../../src/contracts/analyze-response";
import { parseDashboardOracle, type OracleOutput } from "../../src/contracts/oracle";
import { safeModeSchema, type SafeMode } from "../../src/contracts/safe-mode";
import type { ReportModel } from "../../src/contracts/report-model";
import type { SelectedDocument } from "../input/document-input";
import { normalizeSourceRecords } from "../input/normalization/source-record";
import type { NormalizedSourceRecord as LocalSourceRecord } from "../input/normalization/source-record";
import { runParserWorker, type ParserOperationResult } from "../input/parsers/run-parser";
import { runRedactionWorker, type RedactionOperationResult } from "../input/redaction/run-redaction";
import { evaluateEnglishLanguage } from "../input/validation/language-gate";
import { enforceWordLimit } from "../input/validation/word-limit";

const ANALYSIS_WALL_MS = 180_000;

export type MissionStage = "local_parse" | "language" | "redaction" | "verification" | "analysis" | "complete";
export type MissionResult = OracleOutput | ReportModel | SafeMode;
export interface MissionOutcome {
  readonly result: MissionResult;
  readonly sources: readonly NormalizedSourceRecord[];
  readonly response?: AnalyzeResponse;
}
type Focus = "full" | "financial" | "strategic" | "security";
type Output = "pdf" | "xlsx" | "text";

export interface MissionDependencies {
  readonly parseDocument: (document: SelectedDocument) => Promise<ParserOperationResult>;
  readonly redact: (request: Parameters<typeof runRedactionWorker>[0]) => Promise<RedactionOperationResult>;
  readonly send: (body: Uint8Array, sources: Parameters<typeof parseDashboardOracle>[1]) =>
    Promise<MissionResult | AnalyzeResponse>;
}

const DOCUMENT_FAILURE = Object.freeze({ schema_version: "1", ok: false, category: "document",
  code: "invalid_document", message: "The document could not be processed safely.", retry: "fresh_document" } as const);
const LANGUAGE_FAILURE = Object.freeze({ schema_version: "1", ok: false, category: "language",
  code: "unsupported_language", message: "Use a clearly English document.", retry: "fresh_document" } as const);
const PRIVACY_FAILURE = Object.freeze({ schema_version: "1", ok: false, category: "privacy",
  code: "redaction_failed", message: "Private information could not be removed safely.", retry: "fresh_document" } as const);
const PARSER_RESOURCE_FAILURE = Object.freeze({ schema_version: "1", ok: false, category: "client_resource",
  code: "parser_resource_failed", message: "This browser could not process the document safely.",
  retry: "fresh_document" } as const);
const ANALYSIS_FAILURE = Object.freeze({ schema_version: "1", ok: false, category: "analysis",
  code: "analysis_unavailable", message: "Analysis is unavailable. Try again later.", retry: "later" } as const);

async function defaultSend(
  body: Uint8Array, sources: Parameters<typeof parseDashboardOracle>[1],
): Promise<MissionResult | AnalyzeResponse> {
  try {
    const response = await fetch("/analyze", { method: "POST", headers: { "content-type": "application/json" },
      body: new TextDecoder().decode(body), signal: AbortSignal.timeout(ANALYSIS_WALL_MS) });
    const declared = Number(response.headers.get("content-length") ?? "0");
    if (!response.ok || declared > MAX_ANALYZE_RESPONSE_BYTES) return ANALYSIS_FAILURE;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_ANALYZE_RESPONSE_BYTES) return ANALYSIS_FAILURE;
    const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
    const safe = safeModeSchema.safeParse(value);
    if (safe.success) return safe.data;
    const complete = analyzeResponseSchema.safeParse(value);
    if (!complete.success || !reportEvidenceBelongs(complete.data.dashboard, sources)) {
      return ANALYSIS_FAILURE;
    }
    return complete.data;
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
  document: SelectedDocument, focus: Focus, outputs: readonly Output[], token: string,
  onStage: (stage: MissionStage) => void, dependencies: MissionDependencies = DEFAULT_DEPENDENCIES,
): Promise<MissionOutcome> {
  onStage("local_parse");
  const parsed = await parseWithRecovery(document, dependencies.parseDocument);
  if (!parsed.ok && parsed.reason !== "invalid") return { result: PARSER_RESOURCE_FAILURE, sources: [] };
  const local = localDocument(parsed);
  if (!isLocalSources(local)) return { result: local, sources: [] };
  onStage("language");
  if (!evaluateEnglishLanguage(local).accepted) return { result: LANGUAGE_FAILURE, sources: [] };
  onStage("redaction");
  let redaction: RedactionOperationResult;
  try { redaction = await dependencies.redact({ schema_version: "1", sources: local }); }
  catch { return { result: PRIVACY_FAILURE, sources: [] }; }
  if ("ok" in redaction) return { result: PRIVACY_FAILURE, sources: [] };
  onStage("verification");
  let body: Uint8Array;
  try { body = serializeAnalyzeRequest({ redaction_result: redaction, turnstile_token: token,
    focus, requested_outputs: [...outputs] }); } catch { return { result: PRIVACY_FAILURE, sources: [] }; }
  onStage("analysis");
  let result: MissionResult | AnalyzeResponse;
  try { result = await dependencies.send(body, redaction.sources); }
  catch { result = ANALYSIS_FAILURE; }
  onStage("complete");
  return "dashboard" in result
    ? { result: result.dashboard, sources: redaction.sources, response: result }
    : { result, sources: redaction.sources };
}

function reportEvidenceBelongs(
  report: ReportModel, sources: Parameters<typeof parseDashboardOracle>[1],
): boolean {
  const allowed = new Set(sources.map((source) => JSON.stringify(source.reference)));
  const evidence = [...report.findings, ...report.recommendations, ...report.risks]
    .flatMap((item) => item.evidence);
  const chartEvidence = report.charts.flatMap((chart) => chart.points.flatMap((point) => point.evidence));
  return [...evidence, ...chartEvidence].every((reference) => allowed.has(JSON.stringify(reference)));
}
