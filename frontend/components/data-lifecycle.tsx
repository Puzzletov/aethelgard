const lifecycle = [
  ["raw-source", "Raw source file", "Never collected", "Exists only in browser and disposable parser memory."],
  ["unredacted-text", "Unredacted extracted text", "Never collected", "Exists only in browser Workers."],
  ["pii-mapping", "PII placeholder mapping", "Never collected", "Exists only in browser redaction memory."],
  ["redacted-sources", "Redacted source records", "Processed for one request", "Pass through the edge and TrustedRuntime to the selected AI provider."],
  ["turnstile-token", "Turnstile token", "Processed for one request", "Passes through the edge and TrustedRuntime to Cloudflare Siteverify."],
  ["ai-results", "AI results", "Processed for one request", "Exist only in TrustedRuntime request memory."],
  ["report-model", "Service-owned report model", "Processed for one request", "Exists only in TrustedRuntime request memory."],
  ["report-html", "Report HTML", "Processed for one request", "Passes from TrustedRuntime to Browser Run."],
  ["report-outputs", "PDF, XLSX and text outputs", "Processed for one request", "Return through the edge to browser memory and are not retained."],
  ["signing-material", "Signing private material", "Stored by design", "Private keys remain Cloudflare secrets; temporary working material exists only during signing."],
  ["public-keys", "Public verification keys", "Stored by design", "Published in the repository and static Pages site."],
  ["quota-state", "Browser Run quota state", "Stored by design", "Only the UTC date and aggregate Browser Run milliseconds persist."],
  ["static-sample", "Static synthetic sample", "Stored by design", "Published in the repository and static Pages site."],
] as const;

export function DataLifecycle() {
  return <section aria-labelledby="lifecycle-title">
    <div>
      <h2 id="lifecycle-title">Collect / Never collect</h2>
      <p className="section-note">No user, document, prompt, report or analysis-job history.</p>
    </div>
    <dl className="lifecycle-list">
      {lifecycle.map(([id, name, state, detail]) => <div data-lifecycle-id={id} key={id}>
        <dt>{name}</dt>
        <dd><strong>{state}.</strong> {detail}</dd>
      </div>)}
    </dl>
  </section>;
}
