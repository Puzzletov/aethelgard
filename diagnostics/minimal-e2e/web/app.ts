import { baselineResponseSchema, type BaselineAnalysis } from "../contracts.ts";
import { selectBrowserDocument } from "../../../frontend/input/document-input.ts";
import { normalizeSourceRecords } from "../../../frontend/input/normalization/source-record.ts";
import { runParserWorker } from "../../../frontend/input/parsers/run-parser.ts";
import { redactRequest } from "../../../frontend/input/redaction/redactor.ts";
import { evaluateEnglishLanguage } from "../../../frontend/input/validation/language-gate.ts";

declare const __ANALYZE_ENDPOINT__: string;
declare const __TURNSTILE_SITEKEY__: string;
declare const __TURNSTILE_ACTION__: string;

interface TurnstileApi {
  render(element: HTMLElement, options: Readonly<{ sitekey: string; action: string;
    callback: (token: string) => void; "error-callback": () => boolean }>): string;
  reset(id: string): void;
}
declare global { interface Window { turnstile?: TurnstileApi; __AETHELGARD_DIAGNOSTIC__?: unknown } }

const ids = ["LOCAL_EXTRACT", "LOCAL_REDACT", "REQUEST_CREATED", "EDGE_RECEIVED",
  "TRUSTED_RUNTIME_RECEIVED", "TURNSTILE_VERIFIED", "GROQ_REQUESTED", "GROQ_RESPONDED",
  "AI_SCHEMA_VALID", "RESPONSE_SENT", "FRONTEND_RECEIVED", "FRONTEND_RENDERED"] as const;
type Stage = typeof ids[number];
const trace: { stage: Stage; elapsed_ms: number }[] = [];
const started = performance.now();
let redactedText = "";
let token: string | undefined;
let widgetId: string | undefined;

function element<T extends HTMLElement>(id: string): T {
  const value = document.getElementById(id);
  if (value === null) throw new Error(`missing_${id}`);
  return value as T;
}

function mark(stage: Stage): void {
  trace.push({ stage, elapsed_ms: Math.round(performance.now() - started) });
  const item = document.createElement("li");
  item.textContent = `${stage} ${trace.at(-1)?.elapsed_ms ?? 0}ms`;
  element<HTMLOListElement>("trace").append(item);
  window.__AETHELGARD_DIAGNOSTIC__ = Object.freeze({ stages: [...trace] });
}

function renderList(id: string, values: readonly string[]): void {
  const list = element<HTMLUListElement>(id);
  list.replaceChildren(...values.map((value) => {
    const item = document.createElement("li"); item.textContent = value; return item;
  }));
}

function render(analysis: BaselineAnalysis): void {
  element("summary").textContent = analysis.executive_summary;
  renderList("findings", analysis.findings);
  renderList("risks", analysis.risks);
  renderList("recommendations", analysis.recommendations);
  element("result").hidden = false;
  mark("FRONTEND_RENDERED");
}

async function selectFile(file: File): Promise<void> {
  const selected = selectBrowserDocument([file]);
  if (!selected.ok || !["txt", "pdf", "docx", "csv"].includes(selected.document.format)) {
    throw new Error("invalid_document");
  }
  let sources;
  if (selected.document.format === "txt") {
    const text = await file.text();
    const lines = text.split(/\r?\n/u).length;
    sources = [{ schema_version: "1", ordinal: 1,
      reference: { kind: "txt_lines", line_start: 1, line_end: lines }, content: text }] as const;
  } else {
    const parsed = await runParserWorker(selected.document);
    if (!parsed.ok) throw new Error(`${selected.document.format}_${parsed.reason}`);
    sources = normalizeSourceRecords(parsed.value);
    if (sources === undefined || !evaluateEnglishLanguage(sources).accepted) {
      throw new Error(`${selected.document.format}_invalid`);
    }
  }
  mark("LOCAL_EXTRACT");
  const result = redactRequest({ schema_version: "1", sources });
  redactedText = result.sources.map((source) => source.content).join("\n");
  if (result.placeholder_count < 6 || result.must_redact_leaks !== 0) throw new Error("redaction_incomplete");
  mark("LOCAL_REDACT");
  element<HTMLButtonElement>("analyze").disabled = token === undefined;
  element("status").textContent = `${result.placeholder_count} synthetic identifiers redacted locally.`;
}

async function analyze(): Promise<void> {
  if (token === undefined || redactedText.length === 0) return;
  const currentToken = token; token = undefined;
  element<HTMLButtonElement>("analyze").disabled = true;
  const focus = element<HTMLSelectElement>("focus").value;
  const request = { schema_version: "baseline-1", turnstile_token: currentToken, focus,
    redacted_text: redactedText };
  mark("REQUEST_CREATED");
  const response = await fetch(__ANALYZE_ENDPOINT__, { method: "POST",
    headers: { "content-type": "application/json" }, body: JSON.stringify(request) });
  mark("FRONTEND_RECEIVED");
  const value: unknown = await response.json();
  const parsed = baselineResponseSchema.safeParse(value);
  if (!response.ok || !parsed.success) {
    const stage = typeof value === "object" && value !== null && "stage" in value ? String(value.stage) : "UNKNOWN";
    const error = typeof value === "object" && value !== null && "error" in value ? String(value.error) : undefined;
    const telemetry = typeof value === "object" && value !== null && "telemetry" in value ? value.telemetry : undefined;
    element("status").textContent = `FAIL ${stage} HTTP ${response.status}`;
    window.__AETHELGARD_DIAGNOSTIC__ = Object.freeze({ stages: [...trace], failure: stage,
      http_status: response.status, error, telemetry });
    return;
  }
  render(parsed.data.analysis);
  element("status").textContent = `PASS · ${parsed.data.telemetry.model} · ${parsed.data.telemetry.latency_ms}ms provider latency`;
  window.__AETHELGARD_DIAGNOSTIC__ = Object.freeze({ stages: [...trace], edge_elapsed_ms: parsed.data.edge_elapsed_ms,
    server_stages: parsed.data.telemetry.stages, telemetry: parsed.data.telemetry, passed: true });
}

function mountTurnstile(): void {
  if (typeof window.turnstile?.render !== "function") { setTimeout(mountTurnstile, 50); return; }
  widgetId = window.turnstile.render(element("turnstile-widget"), { sitekey: __TURNSTILE_SITEKEY__, action: __TURNSTILE_ACTION__,
    callback: (value) => { token = value; element<HTMLButtonElement>("analyze").disabled = redactedText.length === 0; },
    "error-callback": () => { element("status").textContent = "FAIL TURNSTILE_WIDGET"; return true; } });
}

element<HTMLInputElement>("document").addEventListener("change", (event) => {
  const file = (event.currentTarget as HTMLInputElement).files?.[0];
  if (file !== undefined) void selectFile(file).catch((error: Error) => { element("status").textContent = `FAIL ${error.message}`; });
});
element<HTMLButtonElement>("analyze").addEventListener("click", () => void analyze().finally(() => {
  if (widgetId !== undefined) window.turnstile?.reset(widgetId);
}));
mountTurnstile();
