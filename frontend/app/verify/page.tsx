import type { Metadata } from "next";

import { LocalVerifier } from "../../components/local-verifier";

export const metadata: Metadata = {
  title: "Verify | Aethelgard",
  description: "Verify an Aethelgard PDF and both signatures locally in your browser.",
};

export default function VerifyPage() {
  return <>
    <a className="skip-link" href="#verify-content">Skip to verifier</a>
    <header className="site-header page-frame">
      <a className="wordmark" href="/" aria-label="Aethelgard home">Aethelgard</a>
      <a className="phase-mark" href="/trust">Trust</a>
    </header>
    <main className="verify-page page-frame" id="verify-content">
      <header className="trust-intro"><p className="eyebrow">Independent checks</p>
        <h1>Verify the exact file you received.</h1>
        <p>A valid result requires its recorded SHA-256 digest, Ed25519 signature and ML-DSA-65 signature to pass together.</p>
      </header>
      <LocalVerifier />
    </main>
    <footer className="site-footer page-frame"><p>No selected file is uploaded or stored.</p>
      <a href="/trust">Read the trust boundary</a></footer>
  </>;
}
