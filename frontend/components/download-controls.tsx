"use client";

import { useEffect, useMemo, useState } from "react";

import { availableDownloads, type DownloadKind, ObjectUrlDownloads } from "../downloads/object-downloads";

const LABEL: Readonly<Record<DownloadKind, string>> = Object.freeze({
  pdf: "Download PDF", signature: "Download signature", xlsx: "Download XLSX", text: "Download text",
});

export function DownloadControls({ response }: Readonly<{ response: unknown }>) {
  const manager = useMemo(() => new ObjectUrlDownloads(), []);
  const kinds = availableDownloads(response);
  const [status, setStatus] = useState("");
  useEffect(() => {
    const dispose = () => manager.dispose();
    window.addEventListener("pagehide", dispose);
    window.addEventListener("beforeunload", dispose);
    return () => {
      window.removeEventListener("pagehide", dispose);
      window.removeEventListener("beforeunload", dispose);
      manager.dispose();
    };
  }, [manager]);
  if (kinds.length === 0) return null;
  function download(kind: DownloadKind): void {
    setStatus(manager.download(response, kind) ? "Download prepared." : "Download could not be prepared.");
  }
  return <section className="download-controls" aria-labelledby="downloads-title">
    <h3 id="downloads-title">Downloads</h3>
    <p>Files are created in browser memory only when selected.</p>
    <div className="download-actions">{kinds.map((kind) => <button key={kind} type="button"
      onClick={() => download(kind)}>{LABEL[kind]}</button>)}</div>
    <p role="status" aria-live="polite">{status}</p>
  </section>;
}
