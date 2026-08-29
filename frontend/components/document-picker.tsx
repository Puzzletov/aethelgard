"use client";

import { type ChangeEvent, useRef, useState } from "react";

import {
  DOCUMENT_ACCEPT,
  type BrowserInputResult,
  selectBrowserDocument,
} from "../input/document-input";

function selectionText(result: BrowserInputResult): string {
  if (!result.ok) return result.message;
  const mebibytes = result.document.byteLength / (1024 * 1024);
  return `${result.document.format.toUpperCase()} selected · ${mebibytes.toFixed(2)} MiB`;
}

export function DocumentPicker() {
  const input = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<BrowserInputResult | null>(null);

  function handleSelection(event: ChangeEvent<HTMLInputElement>) {
    const next = selectBrowserDocument(event.currentTarget.files ?? []);
    setResult(next);
    event.currentTarget.value = "";
  }

  function clearSelection() {
    setResult(null);
    if (input.current !== null) input.current.value = "";
  }

  return (
    <section className="document-intake page-frame" aria-labelledby="document-intake-title">
      <div className="section-grid">
        <div>
          <p className="section-label">Start locally</p>
          <h2 id="document-intake-title">Select one document</h2>
        </div>
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
            onChange={handleSelection}
          />
          <div className="selection-row">
            <p
              id="document-status"
              className={result?.ok === false ? "selection-status selection-error" : "selection-status"}
              role={result?.ok === false ? "alert" : "status"}
            >
              {result === null ? "No document selected." : selectionText(result)}
            </p>
            {result?.ok === true ? (
              <button className="clear-selection" type="button" onClick={clearSelection}>Remove</button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
