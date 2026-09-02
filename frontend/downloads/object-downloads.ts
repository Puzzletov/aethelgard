import { analyzeResponseSchema, type AnalyzeResponse } from "../../src/contracts/analyze-response.ts";

export const MAX_OBJECT_URL_LIFETIME_MS = 300_000;
export type DownloadKind = "pdf" | "signature" | "xlsx" | "text";

interface DownloadFile { readonly bytes: Uint8Array; readonly name: string; readonly type: string }
interface ObjectUrlPort { createObjectURL(blob: Blob): string; revokeObjectURL(url: string): void }
interface LifecyclePort {
  afterUse(callback: () => void): void;
  cancel(handle: unknown): void;
  schedule(callback: () => void, milliseconds: number): unknown;
}
type Trigger = (url: string, name: string) => void;

const lifecycle: LifecyclePort = {
  afterUse: (callback) => queueMicrotask(callback),
  cancel: (handle) => window.clearTimeout(handle as number),
  schedule: (callback, milliseconds) => window.setTimeout(callback, milliseconds),
};

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function file(response: AnalyzeResponse, kind: DownloadKind): DownloadFile | undefined {
  if (kind === "pdf" && response.pdf !== undefined) {
    return { bytes: decodeBase64(response.pdf.bytes_b64), name: "aethelgard-report.pdf", type: "application/pdf" };
  }
  if (kind === "signature" && response.pdf !== undefined) {
    return { bytes: new TextEncoder().encode(`${JSON.stringify(response.pdf.signature_manifest, null, 2)}\n`),
      name: "aethelgard-report.sig.json", type: "application/json" };
  }
  if (kind === "xlsx" && response.xlsx_b64 !== undefined) {
    return { bytes: decodeBase64(response.xlsx_b64), name: "aethelgard-report.xlsx",
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
  }
  return kind === "text" && response.text_utf8 !== undefined
    ? { bytes: new TextEncoder().encode(response.text_utf8), name: "aethelgard-report.txt",
      type: "text/plain;charset=utf-8" } : undefined;
}

function browserTrigger(url: string, name: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.rel = "noopener";
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function availableDownloads(value: unknown): readonly DownloadKind[] {
  const parsed = analyzeResponseSchema.safeParse(value);
  if (!parsed.success) return [];
  const kinds: DownloadKind[] = [];
  if (parsed.data.pdf !== undefined) kinds.push("pdf", "signature");
  if (parsed.data.xlsx_b64 !== undefined) kinds.push("xlsx");
  if (parsed.data.text_utf8 !== undefined) kinds.push("text");
  return kinds;
}

export class ObjectUrlDownloads {
  private readonly active = new Map<string, unknown>();
  private readonly timers: LifecyclePort;
  private readonly trigger: Trigger;
  private readonly urls: ObjectUrlPort;

  constructor(
    urls: ObjectUrlPort = URL,
    trigger: Trigger = browserTrigger,
    timers: LifecyclePort = lifecycle,
  ) {
    this.urls = urls;
    this.trigger = trigger;
    this.timers = timers;
  }

  private revoke(url: string): void {
    const handle = this.active.get(url);
    if (handle === undefined) return;
    this.active.delete(url);
    this.timers.cancel(handle);
    this.urls.revokeObjectURL(url);
  }

  download(value: unknown, kind: DownloadKind): boolean {
    const parsed = analyzeResponseSchema.safeParse(value);
    if (!parsed.success) return false;
    const selected = file(parsed.data, kind);
    if (selected === undefined) return false;
    let url: string | undefined;
    try {
      const copied = new Uint8Array(selected.bytes.byteLength);
      copied.set(selected.bytes);
      url = this.urls.createObjectURL(new Blob([copied.buffer], { type: selected.type }));
      const handle = this.timers.schedule(() => this.revoke(url as string), MAX_OBJECT_URL_LIFETIME_MS);
      this.active.set(url, handle);
      this.trigger(url, selected.name);
      this.timers.afterUse(() => this.revoke(url as string));
      return true;
    } catch {
      if (url !== undefined) this.revoke(url);
      return false;
    }
  }

  dispose(): void {
    for (const url of [...this.active.keys()]) this.revoke(url);
  }
}
