"use client";

import { type ChangeEvent, useCallback, useRef, useState } from "react";

import type { MissionOutcome, MissionStage } from "../analysis/browser-mission";
import { DOCUMENT_ACCEPT, type BrowserInputResult, selectBrowserDocument } from "../input/document-input";
import { runDocumentPreflight } from "../input/preflight/run-preflight";
import type { TurnstileController } from "../security/turnstile-client";
import type { SafeMode } from "../../src/contracts/safe-mode";
import { AnalysisDashboard } from "./analysis-dashboard";
import { TurnstileWidget } from "./turnstile-widget";

type Focus = "full" | "financial" | "strategic" | "security";
type Output = "pdf" | "xlsx" | "text";
const OUTPUTS = Object.freeze(["pdf", "xlsx", "text"] as const);
const STAGE_TEXT: Readonly<Record<MissionStage, string>> = Object.freeze({
  local_parse: "Reading the document locally.", language: "Checking language locally.",
  redaction: "Removing private information locally.", verification: "Preparing the private request.",
  analysis: "Running Strawman, Steelman, and Oracle analysis.", complete: "Analysis complete.",
});
const VERIFICATION_FAILURE = Object.freeze({ schema_version: "1", ok: false,
  category: "verification", code: "turnstile_required", message: "Complete a fresh verification challenge.",
  retry: "fresh_turnstile" } as const satisfies SafeMode);

function selectionText(result: BrowserInputResult): string {
  if (!result.ok) return result.message;
  return `${result.document.format.toUpperCase()} selected · ${(result.document.byteLength / 1_048_576).toFixed(2)} MiB`;
}

function useDocumentSelection() {
  const input = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<BrowserInputResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [preflightError, setPreflightError] = useState<string | null>(null);
  async function handleSelection(event: ChangeEvent<HTMLInputElement>) {
    const next = selectBrowserDocument(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    setPreflightError(null);
    if (!next.ok) { setResult(next); return; }
    setResult(null); setChecking(true);
    const preflight = await runDocumentPreflight(next.document);
    setChecking(false);
    if (preflight.ok) setResult(next); else setPreflightError(preflight.message);
  }
  function clearSelection() {
    setResult(null); setPreflightError(null);
    if (input.current !== null) input.current.value = "";
  }
  const error = result?.ok === false ? result.message : preflightError;
  const status = checking ? "Checking the document locally."
    : error ?? (result === null ? "No document selected." : selectionText(result));
  return Object.freeze({ input, result, checking, error, status, handleSelection, clearSelection });
}

function DocumentControl({ state }: Readonly<{ state: ReturnType<typeof useDocumentSelection> }>) {
  const { input, result, checking, error, status, handleSelection, clearSelection } = state;
  return <div className="document-control">
    <p id="document-help">PDF, DOCX, PPTX, XLSX, CSV, or TXT. Maximum 15 MiB. The file stays in this browser.</p>
    <label className="file-label" htmlFor="document-file">Choose document</label>
    <input ref={input} className="file-input" id="document-file" type="file" accept={DOCUMENT_ACCEPT}
      aria-describedby="document-help document-status" disabled={checking} onChange={handleSelection} />
    <div className="selection-row"><p id="document-status"
      className={error === null ? "selection-status" : "selection-status selection-error"}
      role={error === null ? "status" : "alert"}>{status}</p>
      {result?.ok === true ? <button className="clear-selection" type="button"
        onClick={clearSelection}>Remove</button> : null}</div>
  </div>;
}

function MissionControls({ disabled, focus, outputs, setFocus, toggle }: Readonly<{
  disabled: boolean; focus: Focus; outputs: readonly Output[];
  setFocus: (focus: Focus) => void; toggle: (output: Output, checked: boolean) => void;
}>) {
  return <fieldset disabled={disabled}><legend>Analysis options</legend>
    <label htmlFor="analysis-focus">Focus</label>
    <select id="analysis-focus" value={focus} onChange={(event) => setFocus(event.target.value as Focus)}>
      <option value="full">Full</option><option value="financial">Financial</option>
      <option value="strategic">Strategic</option><option value="security">Security</option>
    </select>
    <fieldset><legend>Requested outputs</legend>{OUTPUTS.map((output) => <label key={output}>
      <input type="checkbox" checked={outputs.includes(output)}
        onChange={(event) => toggle(output, event.target.checked)} />{output.toUpperCase()}</label>)}</fieldset>
  </fieldset>;
}

export function DocumentPicker() {
  const state = useDocumentSelection();
  const controller = useRef<TurnstileController | null>(null);
  const [verified, setVerified] = useState(false);
  const [focus, setFocus] = useState<Focus>("full");
  const [outputs, setOutputs] = useState<readonly Output[]>(["pdf"]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("Ready for a document.");
  const [outcome, setOutcome] = useState<MissionOutcome | null>(null);
  const onController = useCallback((value: TurnstileController | null) => { controller.current = value; }, []);
  const onReady = useCallback((ready: boolean) => setVerified(ready), []);
  function toggleOutput(output: Output, checked: boolean): void {
    const values = new Set(outputs);
    if (checked) values.add(output); else values.delete(output);
    setOutputs(OUTPUTS.filter((value) => values.has(value)));
  }
  async function analyze(): Promise<void> {
    if (state.result?.ok !== true || running || outputs.length === 0) return;
    const token = controller.current?.takeToken();
    if (token === undefined) {
      controller.current?.resetAfterAttempt(); setVerified(false);
      setOutcome({ result: VERIFICATION_FAILURE, sources: [] }); return;
    }
    setRunning(true); setOutcome(null);
    try {
      const { runBrowserMission } = await import("../analysis/browser-mission");
      setOutcome(await runBrowserMission(state.result.document, focus, outputs, token,
        (stage) => setProgress(STAGE_TEXT[stage])));
    } finally {
      controller.current?.resetAfterAttempt(); setVerified(false); setRunning(false);
    }
  }
  return <section className="document-intake page-frame" aria-labelledby="document-intake-title"
    aria-busy={state.checking || running}>
    <div className="section-grid"><div><p className="section-label">Start locally</p>
      <h2 id="document-intake-title">Select one document</h2></div><DocumentControl state={state} /></div>
    <MissionControls disabled={running || state.result?.ok !== true} focus={focus} outputs={outputs}
      setFocus={setFocus} toggle={toggleOutput} />
    <TurnstileWidget onController={onController} onReady={onReady} />
    <button type="button" disabled={state.result?.ok !== true || !verified || running || outputs.length === 0}
      onClick={() => void analyze()}>Analyze document</button>
    <p role="status" aria-live="polite">{progress}</p>
    <AnalysisDashboard result={outcome?.result ?? null} sources={outcome?.sources ?? []} />
  </section>;
}
