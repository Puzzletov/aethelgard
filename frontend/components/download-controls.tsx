"use client";

import { useEffect, useMemo, useState } from "react";

import { availableDownloads, type DownloadKind, ObjectUrlDownloads } from "../downloads/object-downloads";
import { analyzeResponseSchema } from "../../src/contracts/analyze-response";

const LABEL: Readonly<Record<DownloadKind, string>> = Object.freeze({
  pdf: "Download PDF", signature: "Download signature", xlsx: "Download XLSX", text: "Download text",
});

export function DownloadControls({ response, expectedPdf = false }:
Readonly<{ response: unknown; expectedPdf?: boolean }>) {
  const manager = useMemo(() => new ObjectUrlDownloads(), []);
  const kinds = availableDownloads(response);
  const [status, setStatus] = useState("");
  const parsed = analyzeResponseSchema.safeParse(response);
  const manifest = parsed.success ? parsed.data.pdf?.signature_manifest : undefined;
  const pdfUnavailable = expectedPdf && manifest === undefined;
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
  if (kinds.length === 0 && !pdfUnavailable) return null;
  function download(kind: DownloadKind): void {
    setStatus(manager.download(response, kind) ? "Download prepared." : "Download could not be prepared.");
  }
  return <section className="download-controls" aria-labelledby="downloads-title">
    <h3 id="downloads-title">Downloads</h3>
    <p>Files are created in browser memory only when selected.</p>
    {pdfUnavailable ? <p className="analysis-fault" role="alert">PDF Safe Mode: no unsigned or unverifiable PDF was offered.</p> : null}
    <div className="download-actions">{kinds.map((kind) => <button key={kind} type="button"
      onClick={() => download(kind)}>{LABEL[kind]}</button>)}</div>
    <p role="status" aria-live="polite">{status}</p>
    {manifest === undefined ? null : <div className="verification-guidance" id="verification-guidance">
      <h4>Verify the PDF</h4>
      <p>Keep the PDF and its detached signature file together. The manifest records both signatures over the exact PDF bytes.</p>
      <dl><div><dt>Ed25519 key ID</dt><dd><code>{manifest.ed25519_public_key_id}</code></dd></div>
        <div><dt>ML-DSA-65 key ID</dt><dd><code>{manifest.mldsa65_public_key_id}</code></dd></div></dl>
      <a href="#verification-limits">Read verification limits</a>
      <p id="verification-limits">Verification can confirm file integrity and signatures. It does not prove that the source or analysis is correct.</p>
    </div>}
  </section>;
}
