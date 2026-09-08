import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy | Aethelgard",
  description: "How Aethelgard processes document content and service data, and what remains local.",
};

const processing = [
  ["Browser-local", "The raw document, unredacted extracted text and PII placeholder mapping remain in browser memory."],
  ["One analysis request", "Configured identifiers are removed locally. Redacted source records, which may still be personal data, pass through Cloudflare to Groq or the eligible OpenRouter fallback. A Turnstile token and necessary technical request metadata are also processed."],
  ["Aethelgard application state", "No document, prompt, report, account or analysis history is stored. Only the UTC date and aggregate Browser Run milliseconds persist for anonymous quota enforcement."],
] as const;

const purposes = [
  "Provide the document analysis and requested report.",
  "Verify that a request is not automated abuse before expensive processing.",
  "Secure and deliver the service and enforce its free usage bounds.",
] as const;

const recipients = [
  "Cloudflare delivers the site, routes the redacted request, evaluates Turnstile signals, executes the private runtime and renders requested PDF reports. Turnstile does not receive the document or form contents.",
  "Groq is the first AI provider and receives only the bounded redacted analysis request.",
  "OpenRouter is contacted only after an eligible Groq failure. Its free router may select a downstream model endpoint that satisfies the request's no-training and zero-data-retention filters. The exact downstream provider can vary.",
] as const;

const rights = [
  "access, rectification and erasure",
  "restriction and objection",
  "data portability where applicable",
  "withdrawal where consent is the stated basis",
  "a complaint to the competent supervisory authority",
] as const;

function SiteHeader() {
  return <header className="site-header page-frame">
    <a className="wordmark" href="/" aria-label="Aethelgard home">Aethelgard</a>
    <nav className="primary-nav" aria-label="Primary navigation">
      <a href="/trust">Trust</a><span aria-current="page">Privacy</span>
      <a href="/verify">Verify</a><a href="/sample">Sample</a>
    </nav>
  </header>;
}

export default function PrivacyPage() {
  return <><a className="skip-link" href="#privacy-content">Skip to privacy notice</a>
    <SiteHeader />
    <main className="trust-page privacy-page page-frame" id="privacy-content">
      <header className="trust-intro"><p className="eyebrow">Pre-release transparency</p>
        <h1>Privacy, stated precisely.</h1>
        <p>This notice is not yet complete. Production analysis remains paused until the operator and contractual facts identified below are verified.</p>
      </header>
      <section aria-labelledby="responsibility-title"><h2 id="responsibility-title">Who is responsible</h2><div>
        <p>The service operator's legal identity, postal address, privacy contact, establishment and supervisory authority await owner confirmation and must be published before release.</p>
        <p>The operator's role for service/security data and its controller-or-processor role for customer document content also require the approved launch relationship.</p>
      </div></section>
      <section aria-labelledby="processing-title"><h2 id="processing-title">What is processed</h2>
        <dl className="trust-claims">{processing.map(([title, body]) => <div key={title}><dt>{title}</dt><dd>{body}</dd></div>)}</dl>
      </section>
      <section aria-labelledby="purposes-title"><h2 id="purposes-title">Purposes and legal bases</h2><div>
        <ul>{purposes.map((purpose) => <li key={purpose}>{purpose}</li>)}</ul>
        <p>The Article 6 legal basis for each purpose awaits owner/legal approval. Aethelgard does not treat a document selection or Turnstile challenge as blanket consent.</p>
      </div></section>
      <section aria-labelledby="recipients-title"><h2 id="recipients-title">Recipients</h2>
        <ul>{recipients.map((recipient) => <li key={recipient}>{recipient}</li>)}</ul>
      </section>
      <section aria-labelledby="transfers-title"><h2 id="transfers-title">Transfers and retention</h2><div>
        <p>Provider processing may occur outside the EEA and UK. Cloudflare, Groq and OpenRouter publish contractual transfer safeguards, including Standard Contractual Clauses, but their application to the operator's accounts must be confirmed before release. No EU-only routing is claimed.</p>
        <p>Groq and OpenRouter retain operational usage metadata. Per-request OpenRouter routing requires zero content retention; Groq account-level Zero Data Retention still requires owner confirmation. Provider handling is separate from Aethelgard application storage.</p>
      </div></section>
      <section aria-labelledby="cookies-title"><h2 id="cookies-title">Cookies and security signals</h2><div>
        <p>Aethelgard has no analytics, advertising or marketing trackers and writes no user-derived browser storage. Turnstile processes IP address, browser and security signals only when request verification is shown.</p>
        <p>A standard Turnstile widget returns a one-use token. A <code>cf_clearance</code> cookie is added only if pre-clearance is enabled; that account setting awaits verification. No consent banner will be added unless a non-essential technology is introduced.</p>
        <p><a href="https://www.cloudflare.com/turnstile-privacy-policy/">Cloudflare Turnstile Privacy Addendum</a></p>
      </div></section>
      <section aria-labelledby="rights-title"><h2 id="rights-title">Your rights</h2><div>
        <p>Depending on the applicable law, rights may include:</p><ul>{rights.map((right) => <li key={right}>{right}</li>)}</ul>
        <p>Aethelgard cannot retrieve a document or report it never stored. That does not remove rights concerning metadata held by the operator or its processors. The verified contact and complaint route must be added before release.</p>
      </div></section>
      <section aria-labelledby="decisions-title"><h2 id="decisions-title">Decisions and sensitive data</h2><div>
        <p>Aethelgard produces informational analysis. It does not itself make solely automated decisions with legal or similarly significant effects.</p>
        <p>The service is intended for professional use and is not directed to children. Local redaction is risk reduction, not a guarantee. Until an Article 9 condition and contractual scope are approved, do not use the pre-release service for special-category data or children's data.</p>
      </div></section>
      <section aria-labelledby="security-title"><h2 id="security-title">Security and limits</h2><div>
        <p>Controls include browser-local preprocessing, isolated parsers, local identifier redaction, strict request and response schemas, fail-closed processing, no application-content logging and exact-byte hybrid report signatures.</p>
        <p>No security control is absolute. A compromised browser or device can defeat the local boundary, and source files are not claimed to be malware-scanned.</p>
      </div></section>
    </main>
    <footer className="site-footer page-frame"><p>Privacy facts before promises.</p><nav aria-label="Project information">
      <a href="/trust">Trust</a><a href="/case-study">Case study</a><a href="/">Analysis</a>
    </nav></footer>
  </>;
}
