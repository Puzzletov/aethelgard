import { z } from "zod";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SITEVERIFY_TIMEOUT_MS = 5_000;
const MAX_SITEVERIFY_RESPONSE_BYTES = 8 * 1024;
const MAX_SITEVERIFY_CHUNKS = 16;

const siteverifySchema = z.object({
  success: z.boolean(),
  challenge_ts: z.string().max(64).optional(),
  hostname: z.string().max(253).optional(),
  "error-codes": z.array(z.string().max(64)).max(16).optional(),
  action: z.string().max(64).optional(),
  cdata: z.string().max(255).optional(),
  metadata: z.object({
    ephemeral_id: z.string().max(128).optional(),
    result_with_testing_key: z.boolean().optional(),
  }).strict().optional(),
}).strict();

export interface TurnstileConfig {
  readonly secret: string;
  readonly expectedAction: string;
  readonly expectedHostname: string;
}

export type TurnstileResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false;
      reason: "action_mismatch" | "hostname_mismatch" | "invalid" | "unavailable";
    }>;

async function readBoundedJson(response: Response): Promise<unknown> {
  if (response.body === null) return undefined;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    for (let index = 0; index < MAX_SITEVERIFY_CHUNKS; index += 1) {
      const result = await reader.read();
      if (result.done) {
        const bytes = new Uint8Array(totalBytes);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.byteLength;
        }
        return JSON.parse(new TextDecoder().decode(bytes));
      }
      totalBytes += result.value.byteLength;
      if (totalBytes > MAX_SITEVERIFY_RESPONSE_BYTES) return undefined;
      chunks.push(result.value);
    }
    return undefined;
  } catch {
    return undefined;
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

export async function verifyTurnstile(
  token: string,
  config: TurnstileConfig,
  fetcher: typeof fetch = fetch,
): Promise<TurnstileResult> {
  if (token.length === 0 || token.length > 2_048) return { ok: false, reason: "invalid" };
  let response: Response;
  try {
    response = await fetcher(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret: config.secret, response: token }),
      signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, reason: "unavailable" };
  }
  if (!response.ok) return { ok: false, reason: "unavailable" };
  const parsed = siteverifySchema.safeParse(await readBoundedJson(response));
  if (!parsed.success) return { ok: false, reason: "unavailable" };
  if (!parsed.data.success) return { ok: false, reason: "invalid" };
  if (parsed.data.metadata?.result_with_testing_key === true) {
    if (config.expectedAction !== "test") return { ok: false, reason: "action_mismatch" };
    if (parsed.data.hostname !== config.expectedHostname) return { ok: false, reason: "hostname_mismatch" };
    return { ok: true };
  }
  if (parsed.data.action !== config.expectedAction) return { ok: false, reason: "action_mismatch" };
  if (parsed.data.hostname !== config.expectedHostname) return { ok: false, reason: "hostname_mismatch" };
  return { ok: true };
}
