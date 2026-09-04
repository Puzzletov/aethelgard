"use client";

import { useState } from "react";

import productionKeys from "../public/signing-keys.json";
import sampleKeys from "../public/sample/aethelgard-synthetic-sample.signing-keys.json";
import { verifyReport, type PublicKeyDocument, type VerificationResult } from "../verification/local-verifier";

const keyDocuments = [productionKeys, sampleKeys] as readonly PublicKeyDocument[];
const labels = [
  ["digest_matches", "SHA-256 digest"],
  ["ed25519_verified", "Ed25519 signature"],
  ["mldsa65_verified", "ML-DSA-65 signature"],
] as const;

export function LocalVerifier() {
  const [pdf, setPdf] = useState<File>();
  const [manifest, setManifest] = useState<File>();
  const [result, setResult] = useState<VerificationResult>();
  const [busy, setBusy] = useState(false);
  async function run(): Promise<void> {
    if (pdf === undefined || manifest === undefined) return;
    setBusy(true); setResult(undefined);
    try {
      setResult(await verifyReport(new Uint8Array(await pdf.arrayBuffer()),
        new Uint8Array(await manifest.arrayBuffer()), keyDocuments));
    } finally { setBusy(false); }
  }
  return <section className="local-verifier" aria-labelledby="local-verifier-title">
    <h2 id="local-verifier-title">Verify a report locally</h2>
    <p>Select a PDF and its <code>.sig.json</code> file. Both remain in browser memory.</p>
    <div className="verifier-inputs">
      <label>PDF report<input type="file" accept="application/pdf,.pdf" onChange={(event) => {
        setPdf(event.currentTarget.files?.[0]); setResult(undefined);
      }} /></label>
      <label>Detached signature<input type="file" accept="application/json,.json" onChange={(event) => {
        setManifest(event.currentTarget.files?.[0]); setResult(undefined);
      }} /></label>
    </div>
    <button type="button" disabled={pdf === undefined || manifest === undefined || busy} onClick={run}>
      {busy ? "Verifying…" : "Verify exact PDF bytes"}
    </button>
    {result === undefined ? null : <div className="verification-result" role="status" aria-live="polite">
      <p className={result.valid ? "verification-valid" : "verification-invalid"}>
        {result.valid ? "Valid: all three checks passed." : "Not valid: all three checks must pass."}
      </p>
      <dl>{labels.map(([field, label]) => <div key={field}><dt>{label}</dt>
        <dd>{result[field] ? "Pass" : "Fail"}</dd></div>)}</dl>
    </div>}
  </section>;
}
