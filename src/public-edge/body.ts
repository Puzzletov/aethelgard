import {
  BODY_READ_TIMEOUT_MS,
  MAX_ANALYSIS_BODY_BYTES,
  MAX_BODY_CHUNKS,
} from "./config.ts";

export type BodyReadResult =
  | Readonly<{ ok: true; bytes: Uint8Array }>
  | Readonly<{ ok: false; reason: "invalid" | "timeout" | "too_large" }>;

type TimedRead =
  | Readonly<{ kind: "chunk"; value: ReadableStreamReadResult<Uint8Array> }>
  | Readonly<{ kind: "timeout" }>;

async function readBeforeDeadline(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  remainingMs: number,
): Promise<TimedRead> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      reader.read().then((value) => ({ kind: "chunk", value }) as const),
      new Promise<Readonly<{ kind: "timeout" }>>((resolve) => {
        timer = setTimeout(() => resolve({ kind: "timeout" }), remainingMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function combineChunks(chunks: readonly Uint8Array[], totalBytes: number): Uint8Array {
  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return combined;
}

async function cancelReader(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
  try {
    await reader.cancel();
  } catch {
    // The request stream may already be closed. No data or error is retained.
  }
}

export async function readBoundedBody(request: Request): Promise<BodyReadResult> {
  if (request.body === null) return { ok: false, reason: "invalid" };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  const deadline = Date.now() + BODY_READ_TIMEOUT_MS;
  let totalBytes = 0;
  try {
    for (let index = 0; index < MAX_BODY_CHUNKS; index += 1) {
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) return { ok: false, reason: "timeout" };
      const result = await readBeforeDeadline(reader, remainingMs);
      if (result.kind === "timeout") return { ok: false, reason: "timeout" };
      if (result.value.done) return { ok: true, bytes: combineChunks(chunks, totalBytes) };
      totalBytes += result.value.value.byteLength;
      if (totalBytes > MAX_ANALYSIS_BODY_BYTES) return { ok: false, reason: "too_large" };
      chunks.push(result.value.value);
    }
    return { ok: false, reason: "invalid" };
  } catch {
    return { ok: false, reason: "invalid" };
  } finally {
    await cancelReader(reader);
    reader.releaseLock();
  }
}
