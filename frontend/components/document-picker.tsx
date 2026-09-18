"use client";

import { type ChangeEvent, type DragEvent, useCallback, useEffect, useRef, useState } from "react";

import type { MissionOutcome, MissionStage } from "../analysis/browser-mission";
import { DOCUMENT_ACCEPT, type BrowserInputResult, selectBrowserDocument } from "../input/document-input";
import { preflightRuntimeMessage, runDocumentPreflight } from "../input/preflight/run-preflight";
import type { TurnstileController } from "../security/turnstile-client";
import type { SafeMode } from "../../src/contracts/safe-mode";
import { AnalysisDashboard } from "./analysis-dashboard";
import { TurnstileWidget } from "./turnstile-widget";

type Focus = "full" | "financial" | "strategic" | "security";
const STAGE_TEXT: Readonly<Record<MissionStage, string>> = Object.freeze({
  preparing: "Preparing document", analyzing: "Analyzing document",
  reporting: "Preparing report", complete: "Analysis complete",
});
const STAGES = Object.freeze(Object.keys(STAGE_TEXT) as MissionStage[]);
const VERIFICATION_FAILURE = Object.freeze({ schema_version: "1", ok: false,
  category: "verification", code: "turnstile_required", message: "Complete a fresh verification challenge.",
  retry: "fresh_turnstile" } as const satisfies SafeMode);
const CLIENT_FAILURE = Object.freeze({ schema_version: "1", ok: false,
  category: "client_resource", code: "client_runtime_failed",
  message: "This browser could not start local analysis safely.", retry: "fresh_document" } as const satisfies SafeMode);

function selectionText(result: BrowserInputResult): string {
  if (!result.ok) return result.message;
  return `${result.document.format.toUpperCase()} selected · ${(result.document.byteLength / 1_048_576).toFixed(2)} MiB`;
}

function useDocumentSelection() {
  const input = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<BrowserInputResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [preflightError, setPreflightError] = useState<string | null>(null);
  const inspection = useRef(0);
  async function inspect(files: FileList | readonly File[]) {
    const current = ++inspection.current;
    const next = selectBrowserDocument(files);
    setPreflightError(null);
    if (!next.ok) { setResult(next); return; }
    setResult(null); setChecking(true);
    try {
      const preflight = await runDocumentPreflight(next.document);
      if (current !== inspection.current) return;
      if (preflight.ok) setResult(next); else setPreflightError(preflight.message);
    } catch (error) {
      if (current === inspection.current) {
        setPreflightError(preflightRuntimeMessage(error));
      }
    } finally {
      if (current === inspection.current) setChecking(false);
    }
  }
  function handleSelection(event: ChangeEvent<HTMLInputElement>) {
    void inspect(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
  }
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!checking) void inspect(event.dataTransfer.files);
  }
  function clearSelection() {
    inspection.current += 1;
    setResult(null); setPreflightError(null);
    if (input.current !== null) input.current.value = "";
  }
  const error = result?.ok === false ? result.message : preflightError;
  const status = checking ? "Checking the document locally."
    : error ?? (result === null ? "No document selected." : selectionText(result));
  return Object.freeze({ input, result, checking, error, status, handleSelection, handleDrop,
    clearSelection });
}

function DocumentControl({ state }: Readonly<{ state: ReturnType<typeof useDocumentSelection> }>) {
  const { input, result, checking, error, status, handleSelection, handleDrop, clearSelection } = state;
  return <div className="document-control" onDragOver={(event) => event.preventDefault()}
    onDrop={handleDrop}>
    <label className="file-label" htmlFor="document-file">
      <span>Choose a document</span>
      <small>or drop it here</small>
    </label>
    <input ref={input} className="file-input" id="document-file" type="file" accept={DOCUMENT_ACCEPT}
      aria-describedby="document-help document-status" disabled={checking} onChange={handleSelection} />
    <p id="document-help">PDF, DOCX, PPTX, XLSX, CSV, or TXT · 15 MiB maximum</p>
    <div className="selection-row"><p id="document-status"
      className={error === null ? "selection-status" : "selection-status selection-error"}
      role={error === null ? "status" : "alert"}>{status}</p>
      {result?.ok === true ? <button className="clear-selection" type="button"
        onClick={clearSelection}>Remove</button> : null}</div>
  </div>;
}

function MissionControls({ disabled, focus, setFocus }: Readonly<{
  disabled: boolean; focus: Focus; setFocus: (focus: Focus) => void;
}>) {
  return <fieldset className="mission-controls" disabled={disabled}><legend>Analysis options</legend>
    <div className="focus-control"><label htmlFor="analysis-focus">Analytical focus</label>
    <select id="analysis-focus" value={focus} onChange={(event) => setFocus(event.target.value as Focus)}>
      <option value="full">Full</option><option value="financial">Financial</option>
      <option value="strategic">Strategic</option><option value="security">Security</option>
    </select></div>
  </fieldset>;
}

function MissionProgress({ stage, running }: Readonly<{ stage: MissionStage | null; running: boolean }>) {
  if (!running || stage === null) return null;
  const current = STAGES.indexOf(stage);
  return <div className="mission-progress" role="status" aria-live="polite">
    <p>{STAGE_TEXT[stage]}</p>
    <ol aria-label="Analysis progress">{STAGES.slice(0, -1).map((item, index) => <li key={item}
      className={index < current ? "is-complete" : ""} aria-current={item === stage ? "step" : undefined}>
      {STAGE_TEXT[item].replace(/\.$/u, "")}</li>)}</ol>
  </div>;
}

export function DocumentPicker() {
  const state = useDocumentSelection();
  const controller = useRef<TurnstileController | null>(null);
  const [verified, setVerified] = useState(false);
  const [focus, setFocus] = useState<Focus>("full");
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<MissionStage | null>(null);
  const [outcome, setOutcome] = useState<MissionOutcome | null>(null);
  useEffect(() => { setOutcome(null); setStage(null); }, [state.result]);
  const onController = useCallback((value: TurnstileController | null) => { controller.current = value; }, []);
  const onReady = useCallback((ready: boolean) => setVerified(ready), []);
  async function analyze(): Promise<void> {
    if (state.result?.ok !== true || running) return;
    const token = controller.current?.takeToken();
    if (token === undefined) {
      controller.current?.resetAfterAttempt(); setVerified(false);
      setOutcome({ result: VERIFICATION_FAILURE, sources: [] }); return;
    }
    setRunning(true); setOutcome(null);
    try {
      const { runBrowserMission } = await import("../analysis/browser-mission");
      setOutcome(await runBrowserMission(state.result.document, focus, token, setStage));
    } catch {
      setOutcome({ result: CLIENT_FAILURE, sources: [] });
    } finally {
      controller.current?.resetAfterAttempt(); setVerified(false); setRunning(false);
    }
  }
  return <section className="document-intake page-frame" aria-labelledby="document-intake-title"
    aria-busy={state.checking || running}>
    <h2 className="visually-hidden" id="document-intake-title">Choose a document</h2>
    <DocumentControl state={state} />
    {state.result?.ok === true ? <details className="options-disclosure">
      <summary>Analysis options <span>{focus[0]?.toUpperCase()}{focus.slice(1)}</span></summary>
      <MissionControls disabled={running} focus={focus} setFocus={setFocus} />
    </details> : null}
    {state.result?.ok === true ? <div className="mission-action">
    <TurnstileWidget onController={onController} onReady={onReady} />
    <button className="analyze-button" type="button"
      disabled={state.result?.ok !== true || !verified || running}
      onClick={() => void analyze()}>Analyze document</button>
    </div> : null}
    <MissionProgress stage={stage} running={running} />
    <AnalysisDashboard result={outcome?.result ?? null} />
  </section>;
}
