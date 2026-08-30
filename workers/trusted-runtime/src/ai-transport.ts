import {
  AI_REQUEST_MAX_BYTES,
  AI_RESPONSE_MAX_BYTES,
  AI_TIMEOUT_MS,
  type AiTransportRequest,
  type AiTransportResult,
  parseAiTransportRequest,
} from "../../../src/contracts/ai-transport.ts";

const MAX_RESPONSE_CHUNKS = 1_024;
const ENDPOINTS = Object.freeze({
  groq: "https://api.groq.com/openai/v1/chat/completions",
  openrouter_free: "https://openrouter.ai/api/v1/chat/completions",
} as const);

function providerBody(request: AiTransportRequest): Readonly<Record<string, unknown>> {
  const common = {
    model: request.model_id,
    messages: request.messages,
    max_tokens: request.max_output_tokens,
    response_format: { type: "json_object" },
    stream: false,
  };
  if (request.provider === "groq") return common;
  return { ...common, provider: {
    allow_fallbacks: false,
    data_collection: "deny",
    zdr: true,
    require_parameters: true,
    max_price: { prompt: 0, completion: 0 },
  } };
}

type FailureReason = Extract<AiTransportResult, { ok: false }>["reason"];

function failure(provider: AiTransportRequest["provider"], reason: FailureReason): AiTransportResult {
  return { ok: false, provider, reason };
}

function httpFailure(request: AiTransportRequest, status: number): AiTransportResult {
  if (status === 429) return failure(request.provider, "rate_limit");
  if (status === 401 || status === 403) return failure(request.provider, "policy");
  if (status >= 500) return failure(request.provider, "unavailable");
  return failure(request.provider, "invalid_schema");
}

async function readBoundedResponse(response: Response): Promise<Uint8Array | "too_large" | undefined> {
  if (response.body === null) return undefined;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (let count = 0; count < MAX_RESPONSE_CHUNKS; count += 1) {
      const value = await reader.read();
      if (value.done) return Uint8Array.from(chunks.flatMap((chunk) => [...chunk]));
      total += value.value.byteLength;
      if (total > AI_RESPONSE_MAX_BYTES) return "too_large";
      chunks.push(value.value);
    }
    return "too_large";
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

function parseResponseBody(bytes: Uint8Array): unknown | undefined {
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes));
  } catch {
    return undefined;
  }
}

function isTimeout(error: unknown): boolean {
  return error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError");
}

export async function callAiProvider(
  value: unknown,
  apiKey: string,
  fetcher: typeof fetch = fetch,
): Promise<AiTransportResult> {
  const request = parseAiTransportRequest(value);
  if (request === undefined || apiKey.length === 0) {
    return { ok: false, provider: request?.provider ?? "groq", reason: "invalid_schema" };
  }
  const body = JSON.stringify(providerBody(request));
  if (new TextEncoder().encode(body).byteLength > AI_REQUEST_MAX_BYTES) return failure(request.provider, "too_large");
  try {
    const response = await fetcher(ENDPOINTS[request.provider], {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body,
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    });
    if (!response.ok) return httpFailure(request, response.status);
    if (response.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
      return failure(request.provider, "invalid_schema");
    }
    const bytes = await readBoundedResponse(response);
    if (bytes === "too_large") return failure(request.provider, "too_large");
    if (bytes === undefined) return failure(request.provider, "invalid_schema");
    const parsed = parseResponseBody(bytes);
    return parsed === undefined ? failure(request.provider, "invalid_schema")
      : { ok: true, provider: request.provider, body: parsed };
  } catch (error) {
    return failure(request.provider, isTimeout(error) ? "timeout" : "network");
  }
}
