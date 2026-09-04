# Aethelgard

Aethelgard is a privacy-first document-analysis instrument and enterprise
engineering showcase. It accepts PDF, DOCX, PPTX, XLSX, CSV and TXT, produces a
three-stage Strawman → Steelman → Oracle analysis, and returns an exact-byte
hybrid-signed PDF with optional XLSX and text exports.

## How it works

```text
Desktop Chrome or Edge
  → browser-local validation, parsing and PII redaction
  → secret-free Cloudflare edge Worker
  → private TrustedRuntime Durable Object
  → Groq, then OpenRouter Free only when needed
  → Browser Run PDF rendering and atomic Ed25519 + ML-DSA-65 signing
```

Raw files, unredacted extracted text and PII mappings stay in browser memory.
Only redacted source records and the Turnstile token cross the network boundary.
Aethelgard stores no user, document, prompt, report or analysis-job history; its
only application persistence is the UTC date and aggregate Browser Run
milliseconds used for anonymous quota enforcement.

The validated launch scope is English-language documents on current desktop
Chrome and Edge. Aethelgard does not claim to malware-scan source files, cannot
guarantee a compromised client device, and provides no uptime SLA. Provider and
platform metadata can exist outside Aethelgard application storage.

The architecture permits no paid fallback: required free quota exhaustion fails
closed. Target cost is exactly GBP 0.00 and USD 0.00 upfront and recurring.

## Local verification

Prerequisites: Git, Node.js 24.13.1, and desktop Chrome or Edge.

```text
npm ci --ignore-scripts
npm --prefix frontend ci --ignore-scripts
npm test
npm run build
```

The build performs both Worker dry-runs and creates the static Pages export; it
does not deploy. Run the frontend locally with `npm --prefix frontend run dev`.

Verify a downloaded report independently with Node 24 or newer:

```text
npm run verify:report -- report.pdf report.sig.json signing-keys.json
```

The browser verifier is available at
[aethelgard-3j9.pages.dev/verify](https://aethelgard-3j9.pages.dev/verify), and
the signed synthetic fallback is at
[aethelgard-3j9.pages.dev/sample](https://aethelgard-3j9.pages.dev/sample).

## Project evidence

- [Architecture 2.1](ARCHITECTURE.md) is the binding system specification.
- [Build log](BUILD_LOG.md) records task and release evidence.
- [Clean-machine recovery](RECOVERY.md) defines the reproducible build proof.
- [Signing-key rotation](KEY_ROTATION.md) defines retained public-key handling.
- [Trust page](https://aethelgard-3j9.pages.dev/trust) states the verified
  boundary and honest limits.

Phase 3 is complete and merged. Phase 4 trust and portfolio finish is in
progress; the project is not complete until its reviewed production-release gate
passes.
