import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Architecture case study | Aethelgard",
  description: "The decisions, evidence and limits behind Aethelgard Architecture 2.1.",
};

const decisions = [
  {
    title: "Exact-zero changed the boundary",
    body: "Server-side Python parsing could not meet the free Worker package bound without unsafe pruning. Moving validation, parsing and redaction into disposable browser module Workers preserved all six formats, the 15 MiB file limit and the 8,000-word limit while removing source-binary upload.",
  },
  {
    title: "One private runtime is enough",
    body: "The secret-free edge calls the private TrustedRuntime Durable Object directly through an external binding. A disposable proof showed that an intermediate dispatcher added no required security property, so it was removed.",
  },
  {
    title: "Reasoning has a fixed shape",
    body: "Only redacted source records enter the fixed Strawman, Steelman and Oracle sequence. Groq is attempted first; OpenRouter Free is the only bounded fallback. Invalid output, unavailable privacy controls or exhausted free capacity stops safely.",
  },
  {
    title: "Rendering stays service-owned",
    body: "TrustedRuntime builds a strict report model and escaped HTML, then Cloudflare Browser Run renders the PDF. User document bytes never enter Browser Run, and report generation remains bounded and ephemeral.",
  },
  {
    title: "Integrity is independently testable",
    body: "The final PDF is hashed and signed over its exact bytes with Ed25519 and ML-DSA-65. A detached manifest, retained public keys, a browser verifier and a dependency-free CLI require the digest and both signatures to pass together.",
  },
] as const;

const limitations = [
  "The validated release scope is English-language documents in current desktop Chrome and Edge.",
  "Aethelgard rejects hostile structures but does not claim that source files are malware-scanned.",
  "The boundary cannot guarantee a compromised browser engine or client device.",
  "Cloudflare and AI providers may retain operational metadata outside Aethelgard application storage.",
  "Free capacity can be unavailable; there is no paid fallback or uptime SLA.",
] as const;

export default function CaseStudyPage() {
  return <>
    <a className="skip-link" href="#case-study-content">Skip to case study</a>
    <header className="site-header page-frame"><a className="wordmark" href="/" aria-label="Aethelgard home">Aethelgard</a>
      <a className="phase-mark" href="/trust">Trust</a></header>
    <main className="case-study page-frame" id="case-study-content">
      <header className="trust-intro"><p className="eyebrow">Architecture 2.1 case study</p>
        <h1>A smaller system with a sharper boundary.</h1>
        <p>The design was reduced until every component served a tested privacy, security, functional or exact-zero property.</p>
      </header>

      <section aria-labelledby="flow-title"><h2 id="flow-title">Runtime path</h2>
        <ol className="architecture-flow" aria-label="Aethelgard request and report flow">
          <li>Browser-local validation, parsing and redaction</li><li>Secret-free edge Worker</li>
          <li>Private TrustedRuntime Durable Object</li><li>Redacted AI reasoning</li>
          <li>Browser Run report rendering</li><li>Exact-byte hybrid signing</li><li>In-memory browser download</li>
        </ol></section>

      <section aria-labelledby="decisions-title"><h2 id="decisions-title">Decisions and evidence</h2>
        <div className="case-decisions">{decisions.map((decision) => <article key={decision.title}>
          <h3>{decision.title}</h3><p>{decision.body}</p></article>)}</div></section>

      <section aria-labelledby="case-limits-title"><h2 id="case-limits-title">What this does not claim</h2>
        <ul>{limitations.map((limit) => <li key={limit}>{limit}</li>)}</ul></section>

      <nav className="case-links" aria-label="Case study evidence">
        <a href="/trust">Read the trust boundary</a><a href="/sample">Inspect the signed sample</a>
        <a href="/verify">Verify a report locally</a>
      </nav>
    </main>
    <footer className="site-footer page-frame"><p>Evidence over promises.</p><a href="/">Return to analysis</a></footer>
  </>;
}
