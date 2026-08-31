import type { DocumentFormat, SelectedDocument } from "../document-input";

export const PARSER_TIMEOUT_MS = 30_000;

export type ParserOperationResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; reason: "invalid" | "crash" | "timeout" | "allocation" }>;

type WorkerFactory = () => Worker;

function defaultWorker(): Worker {
  return new Worker(new URL("../../workers/parser.worker.ts", import.meta.url), { type: "module" });
}

function parseKind(format: DocumentFormat) {
  return `parse_${format}` as const;
}

function wipe(buffer: ArrayBuffer): void {
  try { new Uint8Array(buffer).fill(0); } catch { /* A transferred buffer is already inaccessible. */ }
}

function executeParser(
  document: SelectedDocument, buffer: ArrayBuffer, createWorker: WorkerFactory,
): Promise<ParserOperationResult> {
  return new Promise((resolve) => {
    let worker: Worker;
    try { worker = createWorker(); } catch {
      wipe(buffer); resolve({ ok: false, reason: "allocation" }); return;
    }
    let settled = false;
    const finish = (result: ParserOperationResult): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      wipe(buffer);
      resolve(Object.freeze(result));
    };
    const timer = setTimeout(() => finish({ ok: false, reason: "timeout" }), PARSER_TIMEOUT_MS);
    worker.onmessage = (event: MessageEvent<unknown>) => finish({ ok: true, value: event.data });
    worker.onerror = (event) => { event.preventDefault(); finish({ ok: false, reason: "crash" }); };
    try {
      worker.postMessage({ kind: parseKind(document.format), format: document.format, buffer }, [buffer]);
    } catch { finish({ ok: false, reason: "allocation" }); }
  });
}

export async function runParserWorker(
  document: SelectedDocument, createWorker: WorkerFactory = defaultWorker,
): Promise<ParserOperationResult> {
  let buffer: ArrayBuffer;
  try { buffer = await document.file.arrayBuffer(); } catch { return { ok: false, reason: "allocation" }; }
  if (buffer.byteLength !== document.byteLength) { wipe(buffer); return { ok: false, reason: "invalid" }; }
  try { return await executeParser(document, buffer, createWorker); }
  catch { return { ok: false, reason: "crash" }; }
}
