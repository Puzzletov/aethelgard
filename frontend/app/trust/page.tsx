import type { Metadata } from "next";

import { DataLifecycle } from "../../components/data-lifecycle";
import { externalProcessors, honestLimits, trustClaims } from "../../trust/claims";

export const metadata: Metadata = {
  title: "Trust | Aethelgard",
  description: "The verified privacy, processing, integrity and operating limits of Aethelgard.",
};

export default function TrustPage() {
  return <>
    <a className="skip-link" href="#trust-content">Skip to trust content</a>
    <header className="site-header page-frame">
      <a className="wordmark" href="/" aria-label="Aethelgard home">Aethelgard</a>
      <span className="phase-mark" aria-current="page">Trust</span>
    </header>
    <main className="trust-page page-frame" id="trust-content">
      <header className="trust-intro">
        <p className="eyebrow">Verified boundaries</p>
        <h1>Trust the boundary, and know its limits.</h1>
        <p>Aethelgard minimizes what crosses the network, what persists and what any one integrity check can prove.</p>
      </header>

      <section aria-labelledby="trust-claims-title">
        <h2 id="trust-claims-title">What the system does</h2>
        <dl className="trust-claims">
          {trustClaims.map((claim) => <div data-claim-id={claim.id} key={claim.id}>
            <dt>{claim.title}</dt><dd>{claim.body}</dd>
          </div>)}
        </dl>
      </section>

      <section aria-labelledby="processors-title">
        <h2 id="processors-title">External processors</h2>
        <ul>{externalProcessors.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <DataLifecycle />

      <section aria-labelledby="limits-title">
        <h2 id="limits-title">Honest limits</h2>
        <ul>{honestLimits.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
    </main>
    <footer className="site-footer page-frame">
      <p>Aethelgard — private by boundary, not by promise.</p>
      <p><a href="/verify">Verify a report</a> · <a href="/">Return to analysis</a></p>
    </footer>
  </>;
}
