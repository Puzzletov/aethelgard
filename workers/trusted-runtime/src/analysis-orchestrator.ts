import {
  aiTransportResultSchema,
  extractAiOutput,
  type AiTransportRequest,
  type AiTransportResult,
} from "../../../src/contracts/ai-transport.ts";
import { parseTrustedAnalyzeRequest } from "../../../src/contracts/analyze.ts";
import { parseOracleOutput, type OracleOutput } from "../../../src/contracts/oracle.ts";
import {
  ANALYSIS_INVALID,
  ANALYSIS_TIMEOUT,
  ANALYSIS_UNAVAILABLE,
  type SafeMode,
} from "../../../src/contracts/safe-mode.ts";
import { parseSteelmanOutput, type SteelmanOutput } from "../../../src/contracts/steelman.ts";
import { parseStrawmanOutput, type StrawmanOutput } from "../../../src/contracts/strawman.ts";
import { callAiProvider } from "./ai-transport.ts";
import { createOracleRequest } from "./oracle.ts";
import { createSteelmanRequest } from "./steelman.ts";
import { createStrawmanRequest } from "./strawman.ts";

export const MAX_PROVIDER_ATTEMPTS_PER_STAGE = 2;
export const MAX_PROVIDER_ATTEMPTS_TOTAL = 6;
export const ANALYSIS_WALL_MS = 180_000;

type Provider = AiTransportRequest["provider"];
type Transport = (request: AiTransportRequest, key: string,
  signal: AbortSignal) => Promise<AiTransportResult>;
type StageResult<T> = Readonly<{ status: "ok"; value: T }>
  | Readonly<{ status: "failed" | "wall" }>;

interface StageAdapter<T> {
  readonly build: (provider: Provider) => AiTransportRequest | undefined;
  readonly parse: (value: unknown) => T | undefined;
}

interface AnalysisState {
  readonly unavailable: Set<Provider>;
  readonly signal: AbortSignal;
  readonly transport: Transport;
  readonly keys: Readonly<Record<Provider, string>>;
  attempts: number;
}

async function attempt<T>(
  provider: Provider,
  adapter: StageAdapter<T>,
  state: AnalysisState,
): Promise<StageResult<T>> {
  if (state.signal.aborted || state.attempts >= MAX_PROVIDER_ATTEMPTS_TOTAL) return { status: "wall" };
  const request = adapter.build(provider);
  if (request === undefined) return { status: "failed" };
  state.attempts += 1;
  let raw: AiTransportResult;
  try {
    raw = await state.transport(request, state.keys[provider], state.signal);
  } catch {
    if (state.signal.aborted) return { status: "wall" };
    state.unavailable.add(provider);
    return { status: "failed" };
  }
  if (state.signal.aborted) return { status: "wall" };
  const result = aiTransportResultSchema.safeParse(raw);
  if (!result.success || result.data.provider !== provider || !result.data.ok) {
    state.unavailable.add(provider);
    return { status: "failed" };
  }
  const output = adapter.parse(extractAiOutput(result.data.body));
  if (output === undefined) {
    state.unavailable.add(provider);
    return { status: "failed" };
  }
  return { status: "ok", value: output };
}

async function executeStage<T>(adapter: StageAdapter<T>, state: AnalysisState): Promise<StageResult<T>> {
  if (state.signal.aborted) return { status: "wall" };
  if (!state.unavailable.has("groq")) {
    const primary = await attempt("groq", adapter, state);
    if (primary.status !== "failed") return primary;
  }
  if (!state.unavailable.has("openrouter_free")) {
    return attempt("openrouter_free", adapter, state);
  }
  return { status: "failed" };
}

function safeFailure(status: "failed" | "wall"): SafeMode {
  return status === "wall" ? ANALYSIS_TIMEOUT : ANALYSIS_UNAVAILABLE;
}

const defaultTransport: Transport = (request, key, signal) =>
  callAiProvider(request, key, fetch, signal);

export async function runAnalysis(
  requestValue: unknown,
  keys: Readonly<Record<Provider, string>>,
  transport: Transport = defaultTransport,
  signal: AbortSignal = AbortSignal.timeout(ANALYSIS_WALL_MS),
): Promise<OracleOutput | SafeMode> {
  const request = parseTrustedAnalyzeRequest(requestValue);
  if (request === undefined) return ANALYSIS_INVALID;
  const state: AnalysisState = { unavailable: new Set(), signal, transport, keys, attempts: 0 };
  const strawman = await executeStage<StrawmanOutput>({
    build: (provider) => createStrawmanRequest(provider, request.focus, request.sources),
    parse: (value) => parseStrawmanOutput(value, request.sources),
  }, state);
  if (strawman.status !== "ok") return safeFailure(strawman.status);
  const steelman = await executeStage<SteelmanOutput>({
    build: (provider) => createSteelmanRequest(provider, request.sources, strawman.value),
    parse: (value) => parseSteelmanOutput(value, request.sources, strawman.value),
  }, state);
  if (steelman.status !== "ok") return safeFailure(steelman.status);
  const oracle = await executeStage<OracleOutput>({
    build: (provider) => createOracleRequest(provider, request.sources, strawman.value, steelman.value),
    parse: (value) => parseOracleOutput(value, request.sources, strawman.value, steelman.value),
  }, state);
  return oracle.status === "ok" ? oracle.value : safeFailure(oracle.status);
}
