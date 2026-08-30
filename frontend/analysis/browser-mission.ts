import { serializeAnalyzeRequest, type NormalizedSourceRecord } from "../../src/contracts/analyze";
import { parseDashboardOracle, type OracleOutput } from "../../src/contracts/oracle";
import { safeModeSchema, type SafeMode } from "../../src/contracts/safe-mode";
import type { SelectedDocument } from "../input/document-input";
import { normalizeSourceRecords } from "../input/normalization/source-record";
import type { NormalizedSourceRecord as LocalSourceRecord } from "../input/normalization/source-record";
import { runParserWorker, type ParserOperationResult } from "../input/parsers/run-parser";
import { runRedactionWorker, type RedactionOperationResult } from "../input/redaction/run-redaction";
import { evaluateEnglishLanguage } from "../input/validation/language-gate";
import { enforceWordLimit } from "../input/validation/word-limit";

const ANALYSIS_WALL_MS = 180_000;
const MAX_ANALYSIS_RESPONSE_BYTES = 262_144;

export type MissionStage = "local_parse" | "language" | "redaction" | "verification" | "analysis" | "complete";
export type MissionResult = OracleOutput | SafeMode;
export interface MissionOutcome {
  readonly result: MissionResult;
  readonly sources: readonly NormalizedSourceRecord[];
}
type Focus = "full" | "financial" | "strategic" | "security";
type Output = "pdf" | "xlsx" | "text";

export interface MissionDependencies {
  readonly parseDocument: (document: SelectedDocument) => Promise<ParserOperationResult>;
  readonly redact: (request: Parameters<typeof runRedactionWorker>[0]) => Promise<RedactionOperationResult>;
  readonly send: (body: Uint8Array, sources: Parameters<typeof parseDashboardOracle>[1]) => Promise<MissionResult>;
}

const DOCUMENT_FAILURE = Object.freeze({ schema_version: "1", ok: false, category: "document",
  code: "invalid_document", message: "The document could not be processed safely.", retry: "fresh_document" } as const);
const LANGUAGE_FAILURE = Object.freeze({ schema_version: "1", ok: false, category: "language",
  code: "unsupported_language", message: "Use a clearly English document.", retry: "fresh_document" } as const);
const PRIVACY_FAILURE = Object.freeze({ schema_version: "1", ok: false, category: "privacy",
  code: "redaction_failed", message: "Private information could not be removed safely.", retry: "fresh_document" } as const);
const SERVICE_FAILURE = Object.freeze({ schema_version: "1", ok: false, category: "service",
  code: "service_unavailable", message: "Analysis is unavailable. Try again later.", retry: "later" } as const);

async function defaultSend(
  body: Uint8Array, sources: Parameters<typeof parseDashboardOracle>[1],
): Promise<MissionResult> {
  try {
    const response = await fetch("/analyze", { method: "POST", headers: { "content-type": "application/json" },
      body: new TextDecoder().decode(body), signal: AbortSignal.timeout(ANALYSIS_WALL_MS) });
    const declared = Number(response.headers.get("content-length") ?? "0");
    if (!response.ok || declared > MAX_ANALYSIS_RESPONSE_BYTES) return SERVICE_FAILURE;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_ANALYSIS_RESPONSE_BYTES) return SERVICE_FAILURE;
    const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
    const safe = safeModeSchema.safeParse(value);
    if (safe.success) return safe.data;
    return parseDashboardOracle(value, sources) ?? SERVICE_FAILURE;
  } catch { return SERVICE_FAILURE; }
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

export async function runBrowserMission(
  document: SelectedDocument, focus: Focus, outputs: readonly Output[], token: string,
  onStage: (stage: MissionStage) => void, dependencies: MissionDependencies = DEFAULT_DEPENDENCIES,
): Promise<MissionOutcome> {
  onStage("local_parse");
  const local = localDocument(await dependencies.parseDocument(document));
  if (!isLocalSources(local)) return { result: local, sources: [] };
  onStage("language");
  if (!evaluateEnglishLanguage(local).accepted) return { result: LANGUAGE_FAILURE, sources: [] };
  onStage("redaction");
  const redaction = await dependencies.redact({ schema_version: "1", sources: local });
  if ("ok" in redaction) return { result: PRIVACY_FAILURE, sources: [] };
  onStage("verification");
  let body: Uint8Array;
  try { body = serializeAnalyzeRequest({ redaction_result: redaction, turnstile_token: token,
    focus, requested_outputs: [...outputs] }); } catch { return { result: PRIVACY_FAILURE, sources: [] }; }
  onStage("analysis");
  const result = await dependencies.send(body, redaction.sources);
  onStage("complete");
  return { result, sources: redaction.sources };
}
