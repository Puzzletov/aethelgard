"use client";

import { type ChangeEvent, useRef, useState } from "react";

import {
  DOCUMENT_ACCEPT,
  type BrowserInputResult,
  selectBrowserDocument,
} from "../input/document-input";
import { runDocumentPreflight } from "../input/preflight/run-preflight";

function selectionText(result: BrowserInputResult): string {
  if (!result.ok) return result.message;
  const mebibytes = result.document.byteLength / (1024 * 1024);
  return `${result.document.format.toUpperCase()} selected · ${mebibytes.toFixed(2)} MiB`;
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
    if (!next.ok) {
      setResult(next);
      return;
    }
    setResult(null);
    setChecking(true);
    const preflight = await runDocumentPreflight(next.document);
    setChecking(false);
    if (preflight.ok) setResult(next);
    else setPreflightError(preflight.message);
  }

  function clearSelection() {
    setResult(null);
    setPreflightError(null);
    if (input.current !== null) input.current.value = "";
  }

  const error = result?.ok === false ? result.message : preflightError;
  const status = checking
    ? "Checking the document locally."
    : error ?? (result === null ? "No document selected." : selectionText(result));

  return Object.freeze({ input, result, checking, error, status, handleSelection, clearSelection });
}

function DocumentControl({ state }: Readonly<{ state: ReturnType<typeof useDocumentSelection> }>) {
  const { input, result, checking, error, status, handleSelection, clearSelection } = state;
  return (
    <div className="document-control">
      <p id="document-help">
        PDF, DOCX, PPTX, XLSX, CSV, or TXT. Maximum 15 MiB. The file stays in this browser.
      </p>
      <label className="file-label" htmlFor="document-file">Choose document</label>
      <input
        ref={input}
        className="file-input"
        id="document-file"
        type="file"
        accept={DOCUMENT_ACCEPT}
        aria-describedby="document-help document-status"
        disabled={checking}
        onChange={handleSelection}
      />
      <div className="selection-row">
        <p
          id="document-status"
          className={error === null ? "selection-status" : "selection-status selection-error"}
          role={error === null ? "status" : "alert"}
        >
          {status}
        </p>
        {result?.ok === true ? (
          <button className="clear-selection" type="button" onClick={clearSelection}>Remove</button>
        ) : null}
      </div>
    </div>
  );
}

export function DocumentPicker() {
  const state = useDocumentSelection();
  return (
    <section
      className="document-intake page-frame"
      aria-labelledby="document-intake-title"
      aria-busy={state.checking}
    >
      <div className="section-grid">
        <div>
          <p className="section-label">Start locally</p>
          <h2 id="document-intake-title">Select one document</h2>
        </div>
        <DocumentControl state={state} />
      </div>
    </section>
  );
}
