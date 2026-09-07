import type { SelectedDocument } from "../document-input";
import { failedPreflight, isPreflightResult, type PreflightResult } from "./result";

export const PREFLIGHT_TIMEOUT_MS = 10_000;
export type PreflightRuntimeReason = "crash" | "timeout" | "allocation";
type WorkerFactory = () => Worker;

const RUNTIME_MESSAGES: Readonly<Record<PreflightRuntimeReason, string>> = Object.freeze({
  crash: "Local document safety checks stopped unexpectedly.",
  timeout: "Local document safety checks took too long.",
  allocation: "This browser could not allocate memory for document safety checks.",
});

export class PreflightRuntimeFailure extends Error {
  constructor(readonly reason: PreflightRuntimeReason) {
    super(RUNTIME_MESSAGES[reason]);
    this.name = "PreflightRuntimeFailure";
  }
}

export function preflightRuntimeMessage(error: unknown): string {
  return error instanceof PreflightRuntimeFailure
    ? error.message : "This browser could not check the document safely.";
}

function defaultWorker(): Worker {
  return new Worker(new URL("../../workers/preflight.worker.ts", import.meta.url), { type: "module" });
}

function wipe(buffer: ArrayBuffer): void {
  try { new Uint8Array(buffer).fill(0); } catch { /* A transferred buffer is already inaccessible. */ }
}

function executeWorker(buffer: ArrayBuffer, format: SelectedDocument["format"], createWorker: WorkerFactory) {
  return new Promise<PreflightResult>((resolve, reject) => {
    let worker: Worker;
    try { worker = createWorker(); } catch {
      wipe(buffer); reject(new PreflightRuntimeFailure("allocation")); return;
    }
    let settled = false;
    const finish = (value: PreflightResult | PreflightRuntimeFailure) => {
      if (settled) return;
      settled = true; clearTimeout(timer); worker.terminate();
      if (value instanceof PreflightRuntimeFailure) reject(value); else resolve(value);
    };
    const timer = setTimeout(() => finish(new PreflightRuntimeFailure("timeout")), PREFLIGHT_TIMEOUT_MS);
    worker.onmessage = (event: MessageEvent<unknown>) => finish(isPreflightResult(event.data)
      ? event.data : new PreflightRuntimeFailure("crash"));
    worker.onerror = (event) => { event.preventDefault(); finish(new PreflightRuntimeFailure("crash")); };
    try { worker.postMessage({ kind: "preflight", format, buffer }, [buffer]); }
    catch { wipe(buffer); finish(new PreflightRuntimeFailure("allocation")); }
  });
}

async function readBytes(document: SelectedDocument): Promise<ArrayBuffer | undefined> {
  try {
    const buffer = await document.file.arrayBuffer();
    if (buffer.byteLength === document.byteLength) return buffer;
    wipe(buffer);
  } catch { /* A failed local read is an invalid input. */ }
  return undefined;
}

export async function runDocumentPreflight(
  document: SelectedDocument, createWorker: WorkerFactory = defaultWorker,
): Promise<PreflightResult> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const buffer = await readBytes(document);
    if (buffer === undefined) return failedPreflight("size_invalid");
    try { return await executeWorker(buffer, document.format, createWorker); }
    catch (error) {
      if (!(error instanceof PreflightRuntimeFailure) || attempt === 1) throw error;
    }
  }
  throw new PreflightRuntimeFailure("crash");
}
