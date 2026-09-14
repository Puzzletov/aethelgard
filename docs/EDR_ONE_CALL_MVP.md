# EDR 41 — One-call MVP analysis

**Status:** Active
**Owner approval:** 2026-09-14
**Architecture:** 2.1

## Decision

The canonical MVP analysis path makes exactly one Groq Free request. A fixed
focus-specific prompt asks the model to challenge the obvious interpretation,
construct the strongest competing interpretation, and synthesize a balanced
judgment internally. Only the strict finished-analysis schema reaches the
browser: executive summary, findings, risks, and recommendations.

The MVP does not make separate Strawman, Steelman, or Oracle requests, expose
those labels, retry the provider, or invoke OpenRouter. Report generation,
Browser Run, signing, charts, exports, and PII reinsertion remain separate
future layers and are not part of this correction.

## Evidence

The isolated golden spine passed TXT, PDF, DOCX, CSV, PPTX, and XLSX with the
existing browser-local preflight, parsing, English gate, and PII redaction.
Outbound inspection found zero raw identifiers. Cloudflare Managed Turnstile,
one `openai/gpt-oss-20b` request, strict response validation, and browser
rendering passed, and the TXT control remained green after every format.

## Consequences

- Normal and maximum provider calls per analysis are both one.
- Provider or schema failure enters analysis Safe Mode without fallback.
- All four focus values must materially alter the one fixed prompt.
- The isolated TXT and six-format composed proofs remain regression gates.
- Production is unchanged until the corrected beta is owner-tested and a
  later production promotion is explicitly authorized.
