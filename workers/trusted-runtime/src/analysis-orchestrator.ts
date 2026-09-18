import {
  aiTransportResultSchema,
  extractAiOutput,
  type AiTransportRequest,
  type AiTransportResult,
} from "../../../src/contracts/ai-transport.ts";
import { parseTrustedAnalyzeRequest } from "../../../src/contracts/analyze.ts";
import {
  parseFinishedAnalysis,
  type FinishedAnalysis,
} from "../../../src/contracts/finished-analysis.ts";
import {
  ANALYSIS_INVALID,
  ANALYSIS_TIMEOUT,
  ANALYSIS_UNAVAILABLE,
  type SafeMode,
} from "../../../src/contracts/safe-mode.ts";
import { callAiProvider } from "./ai-transport.ts";
import { createFinishedAnalysisRequest, withSchemaVersion } from "./finished-analysis.ts";

export const MAX_PROVIDER_ATTEMPTS_PER_STAGE = 1;
export const MAX_PROVIDER_ATTEMPTS_TOTAL = 1;
export const ANALYSIS_WALL_MS = 180_000;

type Transport = (request: AiTransportRequest, key: string,
  signal: AbortSignal) => Promise<AiTransportResult>;

const defaultTransport: Transport = (request, key, signal) =>
  callAiProvider(request, key, fetch, signal);

function failed(signal: AbortSignal): SafeMode {
  return signal.aborted ? ANALYSIS_TIMEOUT : ANALYSIS_UNAVAILABLE;
}

export async function runAnalysis(
  requestValue: unknown,
  groqKey: string,
  transport: Transport = defaultTransport,
  signal: AbortSignal = AbortSignal.timeout(ANALYSIS_WALL_MS),
): Promise<FinishedAnalysis | SafeMode> {
  const request = parseTrustedAnalyzeRequest(requestValue);
  if (request === undefined) return ANALYSIS_INVALID;
  if (signal.aborted) return ANALYSIS_TIMEOUT;
  let raw: AiTransportResult;
  try {
    raw = await transport(createFinishedAnalysisRequest(request.focus, request.sources), groqKey, signal);
  } catch {
    return failed(signal);
  }
  if (signal.aborted) return ANALYSIS_TIMEOUT;
  const result = aiTransportResultSchema.safeParse(raw);
  if (!result.success || !result.data.ok || result.data.provider !== "groq") return ANALYSIS_UNAVAILABLE;
  return parseFinishedAnalysis(withSchemaVersion(extractAiOutput(result.data.body))) ?? ANALYSIS_UNAVAILABLE;
}
