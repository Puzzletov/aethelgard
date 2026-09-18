# Project Engineering Specification (PES)

**Project:** Aethelgard

**Version:** 2.2

**Date:** 2026-09-18

**Status:** Owner-authorized architecture reconciliation; implementation awaits owner review

**Language:** Simplified Technical English

**Purpose:** Authoritative product engineering specification and remaining build plan
**Supersedes:** Architecture 2.1 as a target specification; preserves its verified implementation evidence

---

# 0. ARCHITECTURE AUTHORITY

`ARCHITECTURE.md` is the single source of truth for the target system. Git,
`BUILD_LOG.md`, tests, fixtures and retained artifacts are the source of truth
for completed implementation evidence.

Architecture 2.2 is a product-boundary correction. It does not authorize
runtime implementation, deployment, production promotion, PR #28 merge,
provider replacement or secret changes. Those require a later explicit owner
instruction.

The authoritative architecture hash is SHA-256 of the exact Git blob bytes of
this file. Do not normalize line endings. Use `npm run architecture:hash` and
record the result in `BUILD_LOG.md`.

An architecture change requires explicit owner approval, an EDR entry and a
concise build-log entry. Implementation difficulty is not permission to change
this specification.

---

# 1. MISSION AND INVARIANTS

## 1.1 Mission

> **Aethelgard is a privacy gateway for AI document processing.**

Canonical user flow:

```text
Protect locally
-> send pseudonymized content only to AI
-> restore known identities locally
-> deliver the result
-> keep no copy
```

Aethelgard protects, orchestrates, validates, restores, renders, packages and
delivers. The AI performs the substantive document analysis and produces the
canonical structured result.

## 1.2 Exact-zero cost

Lifetime cost remains exactly GBP 0.00 and USD 0.00, upfront and recurring.
Paid subscriptions, paid overflow, automatic top-up, paid fallback and a
second charged path are forbidden. Quota exhaustion fails closed.

## 1.3 Privacy boundary

The following never leave the browser:

* raw source bytes;
* filename;
* unredacted extracted text;
* identity map;
* restored result.

Only strict pseudonymized source records may cross the document privacy
boundary. Redacted or pseudonymized content may still be personal data and
must not be described as anonymous.

## 1.4 Storage

Aethelgard persists no user, document, prompt, result, report, job, token or
identity-map data. User-derived data must not be written to `localStorage`,
`sessionStorage`, IndexedDB, Cache Storage, OPFS, service-worker caches,
cookies, a database, a bucket or application logs.

Immutable application/parser/font caching is allowed. Infrastructure providers
may process operational metadata under their own terms; Aethelgard must state
that limitation honestly.

## 1.5 Security and resource discipline

Fail closed. Every input, archive, string, array, request, response, retry,
allocation, task and timeout has a named bound. Do not weaken hostile-file
validation, PII protection, schema validation, Turnstile, secret isolation,
rate limiting, CSP, no-logging or the network boundary for availability.

## 1.6 Simplicity

Use the fewest moving parts that preserve the mission. Do not add a service,
runtime, route, package, storage system, AI call, credential or abstraction
without a current required property. Do not build future output layers early.

## 1.7 Supported release scope

The supported inputs are PDF, DOCX, PPTX, XLSX, CSV and TXT. Maximum source
size is 15 MiB and maximum extracted content is 8,000 words. The validated
release scope is English text on desktop Chrome and Edge. There is no OCR,
mobile, Safari, Firefox, multilingual PII or uptime-SLA claim.

---

# 2. RETAINED PROVEN BASELINE

The following Architecture 2.1 implementation evidence remains binding and
must not be weakened or reimplemented without a demonstrated defect:

* hostile-container preflight for all six input formats;
* browser-local parsing with source-reference normalization;
* local English-first language gate;
* deterministic PII rules, local context rules and pinned local NER;
* occurrence-based span composition and stable typed pseudonyms;
* zero-PII documents pass as an identity transformation;
* `must_redact` post-transform leak guard and frozen PII corpus;
* zero raw bytes, filename, unredacted text or mapping at the network boundary;
* real Managed Turnstile and Siteverify inside a private runtime;
* a literally secret-free public edge;
* a private externally bound `TrustedRuntime` Durable Object;
* exactly one Groq request using `openai/gpt-oss-20b`;
* strict validated AI response and browser result;
* owner-confirmed TXT and PDF golden-path smoke tests;
* automated official-test-key heartbeat and human Managed-Turnstile heartbeat;
* no application content logging, analytics, advertising or user-data storage.

The permanent heartbeat is:

```text
synthetic document
-> local extraction
-> local PII protection
-> Turnstile
-> secret-free edge
-> private TrustedRuntime
-> one Groq request
-> strict response
-> browser render
```

The official Cloudflare Turnstile test mode is test-only and must be impossible
to activate in production. Managed Turnstile remains the human security smoke.

---

# 3. TARGET RUNTIME TOPOLOGY

```text
USER DEVICE
  source document
      |
      v
BROWSER
  hostile preflight
  disposable parser Worker
  source references
  local English gate
  disposable redaction Worker
  browser-private identity map
      |
      | pseudonymized records + Turnstile token only
      v
SECRET-FREE PUBLIC EDGE
  fixed origin/method/content/bounds/rate controls
      |
      v
EXTERNAL DURABLE OBJECT BINDING
      |
      v
PRIVATE TRUSTEDRUNTIME
  Siteverify
  strict request validation
  exactly one Groq call
  strict canonical report validation
      |
      | canonical pseudonymized report only
      v
BROWSER
  exact-token integrity check
  optional local identity restoration
  browser rendering
  Markdown/TXT packaging
  direct in-memory delivery
  release operation references
```

Public application operations remain exactly `GET /health` and
`POST /analyze`. Narrow `OPTIONS /analyze` CORS handling is protocol handling,
not another business operation. There is no dispatcher Worker, server parser,
generic signer, result route, download route, account route or alternate
backend.

---

# 4. IDENTITY MAP AND LOCAL RESTORATION

## 4.1 Map creation and lifetime

The Redaction Worker returns strict pseudonymized source records and Schema
`S-IDENTITY-MAP` to the browser controller over browser-local `postMessage`.
The controller retains that map only in ephemeral JavaScript memory for the
current operation.

The map remains available through AI response validation, token-integrity
validation, selected restoration mode, rendering and delivery. It never
crosses the network, enters persistent browser storage or appears in logs.

After delivery completes, the user cancels, or any terminal failure occurs,
the controller releases every reachable map/reference and terminates the
disposable workers. Aethelgard claims reference release, not physical secure
erasure from managed-memory hardware.

## 4.2 Restoration modes

`restore` is the default. `protected` is the explicit alternative that keeps
pseudonyms in the delivered result.

Restoration is deterministic exact-token substitution in the browser only:

* replace every occurrence of a known complete token using `S-IDENTITY-MAP`;
* repeated known tokens resolve to the same original value;
* preserve all other text byte-for-byte at the string level;
* never fuzzy-match, infer, guess or ask AI to restore;
* never replace an unknown, malformed or invented token;
* reject the entire operation if the AI result contains an unknown token that
  matches the reserved token grammar;
* make no second AI call.

An empty identity map is valid. In `restore` mode it is an identity
transformation.

## 4.3 Token integrity

Pseudonyms use the exact grammar
`[TYPE_N]`, where `TYPE` is one of `EMAIL`, `PHONE`, `CUSTOMER_ID`,
`PAYMENT_CARD`, `ADDRESS`, `PERSON`, `ORGANIZATION`, or `LOCATION`, and `N` is
a positive decimal integer without a leading zero.

Before rendering, the browser scans the complete canonical report. Every token
matching the reserved grammar must exist in the map. Unknown tokens fail
closed. Known tokens may appear zero or more times because the model may omit
irrelevant source material.

---

# 5. DOCUMENT AND NETWORK CONTRACT

Hostile validation occurs before normal parsing. Reject false magic,
encryption, traversal, archive expansion abuse, XML entities/doctypes, external
relationships, macros, ActiveX, OLE, embedded content and malformed structure.
Blank PDF pages may be skipped while original page numbers are preserved; an
entirely empty or malformed PDF fails closed.

Parsing and redaction run in separate disposable module Web Workers. A parser
crash, timeout or allocation failure permits one fresh-Worker retry. Redaction
has no retry. A potentially corrupted Worker is never reused.

Language classification remains local and uses the pinned `franc-min`
English-first rule: after minimum evidence, accept only valid top-ranked
`eng`; otherwise fail closed. Do not add a score-gap or external language
service.

The browser constructs only Schema `S-ANALYZE-REQUEST`. Public edge and private
runtime both perform strict validation. No filename, raw bytes, unredacted text,
identity map, browser restoration mode or local download preference is sent.

---

# 6. AI AND CANONICAL REPORT

## 6.1 One-call AI boundary

Exactly one Groq request is allowed per accepted analysis. Model ID is
`openai/gpt-oss-20b`. There is no OpenRouter call, provider fallback, Router,
specialist agent or separate Strawman/Steelman/Oracle network stage in the MVP.

The fixed prompt asks the model internally to identify weak assumptions,
challenge them, construct the strongest competing interpretation and synthesize
a balanced conclusion. Chain-of-thought and internal methodology are never
requested, stored or shown.

AI may produce only Schema `S-CANONICAL-REPORT`. It may not choose providers,
URLs, routes, storage, renderers, credentials or code execution.

## 6.2 Professional report model

The canonical report contains:

* title and analysis context;
* executive summary;
* findings with evidence/source references and implications;
* risks or considerations;
* recommendations with priority and timeframe;
* closing assessment.

The model returns structured data, never HTML, CSS, Markdown, a binary office
file or consultancy-brand imitation. Strict validation rejects unknown fields,
unbounded collections and invalid source references before local restoration or
rendering.

## 6.3 Focus

The user selects exactly one deterministic focus: `full`, `financial`,
`strategic`, or `security`. Focus changes the fixed prompt but not the provider,
model, schema, privacy boundary or one-call limit.

---

# 7. OUTPUT AND DELIVERY

## 7.1 MVP outputs

The MVP always renders the validated canonical report in the browser. It also
offers deterministic browser-local Markdown and plain-text downloads. Output
uses the selected `restore` or `protected` mode. Downloads use short-lived
object URLs and no server storage, result route, token, session or email.

## 7.2 Post-MVP renderers

PDF, DOCX, PPTX and LaTeX are optional, separately owner-authorized renderer
layers after the canonical MVP release. Add at most one renderer at a time;
each consumes only the same validated canonical report and must preserve the
golden heartbeat.

Browser Run, generated PDF, charts, XLSX output, multipart output, SHA-256
exact-PDF signing, Ed25519, ML-DSA-65, detached manifests, public signing keys,
browser verifier and CLI verifier are not MVP release blockers. Their proven
code, tests, fixtures, static sample and EDR evidence remain in Git as portfolio
and regression evidence until a separate owner decision promotes, retains or
retires them. They must not be silently reactivated in the MVP runtime.

## 7.3 Presentation

Use the approved premium Nordic editorial design: warm paper, graphite,
restrained terracotta, Fraunces, Public Sans, strong typography, rules,
alignment and proportion. Reject generic SaaS cards, cyber styling, invented
metrics and model-controlled presentation.

---

# 8. PROVIDERS, SECRETS AND COST

Cloudflare Pages hosts the frontend. The public Worker remains literally
secret-free and directly binds the private `TrustedRuntime` Durable Object in a
separate Worker script. Turnstile Siteverify and Groq credentials exist only in
the private runtime.

Turnstile is checked before AI. One failed Siteverify attempt has no retry; a
new user attempt requires a fresh token. The edge uses fixed origin and method
allow-lists, request bounds and Workers Rate Limiting.

Groq is the only active MVP AI provider. No arbitrary URL/model/provider field
is accepted. No paid fallback or automatic charged path exists. Provider and
account privacy/legal readiness remains a release gate and must never be
converted from unknown to pass without evidence.

Dependency identity and required properties belong here. Lockfiles are
authoritative for compatible exact npm versions. Pinned security, cryptographic
and browser assets additionally use explicit version/commit/hash manifests.
Adding a dependency requires owner approval.

---

# 9. DATA LIFECYCLE

| Data | Location | Lifetime | Network/persistence rule |
|---|---|---|---|
| Raw source and filename | Browser memory | Current operation | Never networked or persisted |
| Extracted unredacted records | Parser/controller memory | Until protection succeeds or terminal failure | Never networked or persisted |
| Identity map | Redaction Worker then browser controller | Through restoration and delivery | Never networked, logged or persisted |
| Pseudonymized source records | Browser, edge, private runtime, Groq request memory | One request | `no-store`; no application log/history |
| Turnstile token | Browser, edge, private runtime, Siteverify | One verification | Never sent to Groq or persisted |
| Canonical pseudonymized report | Groq/private runtime/browser memory | One response | Strictly validated; no application persistence |
| Restored report | Browser memory only | Through rendering/delivery | Never networked, logged or persisted |
| Markdown/TXT bytes | Browser memory/object URL | Through delivery or `B-OBJECT-URL-LIFETIME-MS` | Never server-stored |
| Operational metadata | Infrastructure providers | Provider-controlled | Disclose honestly; not Aethelgard content storage |

Persistent Aethelgard user-derived application state: **none**.

---

# 10. SECURITY, QUALITY AND HONEST CLAIMS

Keep strict TypeScript/Zod, approved browser parser assets, functions of at
most 50 lines excluding fixed tables, warnings-as-errors and deterministic
tests with every code change. Do not use `eval`, `Function`, Python `exec`,
unchecked model output, unsafe HTML or secrets in source.

Keep the hostile corpus, 84-case/576-entity PII corpus, parser fixtures,
golden-path E2E, network/storage instrumentation, CodeQL, Dependabot, secret
scanning, license audit, Doctor and clean-machine proof.

Allowed public claim:

> Aethelgard keeps no copy of your source document or generated analysis.

Do not claim absolute security, universal PII detection, malware scanning,
anonymity, EU-only processing, zero provider metadata, secure physical memory
erasure or GDPR certification/compliance without separate verified legal
evidence.

---

# 11. STRAWMAN, STEELMAN AND OCCAM REVIEW

**Strawman:** restore nothing, send pseudonyms to the user and retain the old
mandatory PDF/signing pipeline. This weakens usefulness and keeps machinery
that no longer serves the MVP mission.

**Steelman:** retain the proven privacy gateway, preserve the browser-only map
through delivery, restore exact known tokens locally, require one strong
canonical AI report, and derive simple local outputs from that report. This
adds useful identity-aware delivery without expanding the network trust
boundary.

**Occam decision:** the MVP ends at browser display plus Markdown/TXT. Optional
renderers and cryptographic portfolio artifacts remain preserved but inactive.
This is the smallest coherent system that provides protected professional
analysis and a useful deliverable.

---

# 12. COMPLETED HISTORY AND SUPERSESSION

Phases 0-3 and Tasks 4.1-4.11 passed under Architecture 2.1. Their signed Git
history, build-log entries, tests and fixtures remain evidence. They are not
repeated. The former Task 4.12 production release gate is superseded before
completion by EDR 42 and must not be resumed as written.

Completed Browser Run, PDF, XLSX, chart, hybrid-signing, verifier and static
sample work is preserved intentionally. It proves engineering properties and
may support a future separately approved renderer or portfolio surface. It is
not authority to put those components on the Architecture 2.2 MVP path.

The remaining tasks are a strict chain. A task must pass, be logged and have a
signed logical commit before the next task starts. Each phase ends at its gate
and requires owner authorization for the next phase.

---

# 13. PHASE 5 — PRIVACY RESULT LIFECYCLE

## Task 5.1 — Browser-private identity map handoff
Purpose: Preserve the local identity map after redaction without expanding its trust boundary.
Preconditions: Architecture 2.2 implementation is explicitly owner-authorized; the six-format golden heartbeat passes.
Allowed scope: Redaction Worker/browser-controller contract, memory lifecycle, local tests.
Inputs: `S-REDACTION-REQUEST`.
Outputs: `S-REDACTION-RESULT` containing `S-IDENTITY-MAP` in browser memory.
Required behavior: Return stable exact token mappings locally; accept an empty map; release on cancellation or terminal failure; never serialize to network/storage/logs.
Bounds: `B-IDENTITY-MAP-ENTRIES`, `B-IDENTITY-VALUE-CHARS`, `B-REDACTION-TIMEOUT-MS`.
Schemas: `S-REDACTION-REQUEST`, `S-REDACTION-RESULT`, `S-IDENTITY-MAP`.
Failures: `F-REDACTION-FAILURE`, `F-NETWORK-BOUNDARY-FAILURE`.
Forbidden: Server map, persistent browser map, telemetry, changed detection thresholds.
PASS: All formats and zero-PII fixtures produce exact browser-only maps; network/storage/log probes observe zero map egress.

## Task 5.2 — Exact local restoration
Purpose: Restore known identities locally or keep protected tokens by explicit user choice.
Preconditions: Task 5.1 passed.
Allowed scope: Pure browser restoration module, selection control, deterministic tests.
Inputs: `S-CANONICAL-REPORT`, `S-IDENTITY-MAP`, `S-RESTORATION-MODE`.
Outputs: `S-RESTORATION-RESULT`.
Required behavior: Default to `restore`; replace all and only exact known tokens; protected mode changes none; empty map passes unchanged; unknown reserved tokens fail closed.
Bounds: `B-RESTORATION-TOKENS`, `B-RESTORATION-TEXT-CHARS`, `B-RESTORATION-TIMEOUT-MS`.
Schemas: `S-CANONICAL-REPORT`, `S-IDENTITY-MAP`, `S-RESTORATION-MODE`, `S-RESTORATION-RESULT`.
Failures: `F-TOKEN-INTEGRITY`, `F-RESTORATION-FAILURE`.
Forbidden: Fuzzy match, guessing, AI restoration, server restoration, second AI call.
PASS: Table-driven repeated/unknown/malformed/empty/protected/restored cases pass with exact string equality and no egress.

## Task 5.3 — Privacy lifecycle release proof
Purpose: Prove the complete map/restoration lifecycle and permanent heartbeat.
Preconditions: Task 5.2 passed.
Allowed scope: Chrome/Edge E2E, network/storage/log instrumentation, cleanup hooks.
Inputs: Six synthetic formats with repeated identities and zero-PII controls.
Outputs: `S-PRIVACY-LIFECYCLE-RESULT`.
Required behavior: Exercise success, cancellation and every terminal failure; verify reference release and both restoration modes while the golden heartbeat remains green.
Bounds: `B-BROWSER-STORAGE-WRITES`, `B-NETWORK-REQUESTS`, `B-ANALYSIS-WALL-MS`.
Schemas: `S-PRIVACY-LIFECYCLE-RESULT`, `S-NETWORK-BOUNDARY-RESULT`.
Failures: `F-NETWORK-BOUNDARY-FAILURE`, `F-RESTORATION-FAILURE`.
Forbidden: Physical-erasure claim, hidden storage, content diagnostics, test Turnstile in production.
PASS: Chrome/Edge matrix shows zero forbidden egress/storage/logging and exact restored/protected results for all six formats.

## PHASE 5 EXIT GATE

Run Tasks 5.1-5.3, all parser/redactor/privacy regressions and both golden
heartbeat modes. Report `PHASE 5 — PASS` or `PHASE 5 — BLOCKED`, then stop.

---

# 14. PHASE 6 — PROFESSIONAL CANONICAL REPORT

## Task 6.1 — Canonical report schema and prompt
Purpose: Define one professional structured analysis returned by the single AI call.
Preconditions: Phase 5 passed and Phase 6 is owner-authorized.
Allowed scope: Strict schema, fixed focus prompts, fixtures and mutation tests.
Inputs: `S-TRUSTED-ANALYZE-REQUEST`.
Outputs: `S-CANONICAL-REPORT`.
Required behavior: Cover context, summary, findings/evidence/implications, risks, recommendations/priority/timeframe and closing assessment in one response.
Bounds: `B-REPORT-TITLE-CHARS`, `B-REPORT-SUMMARY-CHARS`, `B-REPORT-ITEMS`, `B-REPORT-ITEM-CHARS`, `B-EVIDENCE-REFERENCES`.
Schemas: `S-CANONICAL-REPORT`, `S-SOURCE-REFERENCE`, `S-FOCUS`.
Failures: `F-INVALID-AI-SCHEMA`, `F-OUTPUT-SIZE`.
Forbidden: HTML/CSS, chain-of-thought, intermediate methodology schemas, provider choice, invented source references.
PASS: Strict valid fixtures pass and unknown/missing/oversize/bad-reference mutations fail deterministically.

## Task 6.2 — One-call runtime integration
Purpose: Make the proven one-call Groq spine return only the canonical report.
Preconditions: Task 6.1 passed.
Allowed scope: Existing TrustedRuntime prompt/validation adapter and focused tests.
Inputs: `S-TRUSTED-ANALYZE-REQUEST`.
Outputs: `S-ANALYZE-RESPONSE`.
Required behavior: Call Groq exactly once, validate before response, return `no-store`, and preserve Turnstile-before-AI and exact-zero failure behavior.
Bounds: `B-PROVIDER-ATTEMPTS-TOTAL`, `B-AI-TIMEOUT-MS`, `B-AI-RESPONSE-BYTES`, `B-ANALYSIS-WALL-MS`.
Schemas: `S-AI-TRANSPORT-REQUEST`, `S-CANONICAL-REPORT`, `S-ANALYZE-RESPONSE`.
Failures: `F-TURNSTILE-FAILURE`, `F-GROQ-FAILURE`, `F-INVALID-AI-SCHEMA`, `F-AI-TIMEOUT`.
Forbidden: OpenRouter, second call, partial/unvalidated result, Browser Run, signing.
PASS: Request counting proves one call; valid response passes; provider/schema/timeout faults fail closed; heartbeat remains green.

## Task 6.3 — Browser report rendering
Purpose: Render the restored or protected canonical report as a usable professional analysis.
Preconditions: Task 6.2 passed.
Allowed scope: Existing browser result surface, local transforms, accessibility and desktop tests.
Inputs: `S-ANALYZE-RESPONSE`, `S-IDENTITY-MAP`, `S-RESTORATION-MODE`.
Outputs: Accessible browser view of `S-RESTORATION-RESULT`.
Required behavior: Restore before render when selected; preserve source references; render deterministic text only; release operation data after delivery/end.
Bounds: `B-UI-TEXT-CHARS`, `B-REPORT-ITEMS`, `B-RESTORATION-TIMEOUT-MS`.
Schemas: `S-ANALYZE-RESPONSE`, `S-RESTORATION-RESULT`.
Failures: `F-TOKEN-INTEGRITY`, `F-RESTORATION-FAILURE`, `F-OUTPUT-SIZE`.
Forbidden: `dangerouslySetInnerHTML`, model styling, invented metrics, persistence, hidden server output work.
PASS: Chrome/Edge, keyboard, reduced-motion, narrow-desktop and six-format journeys render exactly and preserve the heartbeat.

## PHASE 6 EXIT GATE

Run Tasks 6.1-6.3, schema mutation, provider fault, privacy and golden-heartbeat
regressions. Report `PHASE 6 — PASS` or `PHASE 6 — BLOCKED`, then stop.

---

# 15. PHASE 7 — MARKDOWN AND TEXT DELIVERY

## Task 7.1 — Deterministic Markdown renderer
Purpose: Deliver the canonical report as portable Markdown in browser memory.
Preconditions: Phase 6 passed and Phase 7 is owner-authorized.
Allowed scope: Pure local renderer, filename-independent download action and tests.
Inputs: `S-RESTORATION-RESULT`.
Outputs: `S-LOCAL-OUTPUT` with `format:"markdown"`.
Required behavior: Render every canonical section/source reference in fixed order; create and revoke one object URL; use no network.
Bounds: `B-TEXT-OUTPUT-BYTES`, `B-OBJECT-URL-LIFETIME-MS`.
Schemas: `S-RESTORATION-RESULT`, `S-LOCAL-OUTPUT`.
Failures: `F-OUTPUT-SIZE`, `F-OUTPUT-RENDER-FAILURE`.
Forbidden: Server renderer, persistence, model Markdown, original filename egress.
PASS: Golden fixtures match exact bytes in restored/protected/empty-map modes and storage/network writes remain zero.

## Task 7.2 — Deterministic plain-text renderer
Purpose: Deliver the same report as accessible plain text in browser memory.
Preconditions: Task 7.1 passed.
Allowed scope: Pure local renderer, download action and tests.
Inputs: `S-RESTORATION-RESULT`.
Outputs: `S-LOCAL-OUTPUT` with `format:"text"`.
Required behavior: Render the same semantic content/order without Markdown syntax; create and revoke one object URL.
Bounds: `B-TEXT-OUTPUT-BYTES`, `B-OBJECT-URL-LIFETIME-MS`.
Schemas: `S-RESTORATION-RESULT`, `S-LOCAL-OUTPUT`.
Failures: `F-OUTPUT-SIZE`, `F-OUTPUT-RENDER-FAILURE`.
Forbidden: Network rendering, persistence, omitted canonical section.
PASS: Exact-byte fixtures, restored/protected/empty-map modes, Unicode and line-ending tests pass with zero egress/storage.

## Task 7.3 — MVP delivery integration
Purpose: Join browser, Markdown and TXT delivery without adding a server output pipeline.
Preconditions: Task 7.2 passed.
Allowed scope: Existing result UI controls, lifecycle cleanup and composed tests.
Inputs: `S-RESTORATION-RESULT` and explicit local format selection.
Outputs: Browser result and selected `S-LOCAL-OUTPUT` downloads.
Required behavior: Browser is always available; Markdown/TXT are optional; restoration mode applies identically to every output; failures do not expose partial files.
Bounds: `B-REQUESTED-OUTPUTS`, `B-TEXT-OUTPUT-BYTES`, `B-OBJECT-URL-LIFETIME-MS`.
Schemas: `S-RESTORATION-MODE`, `S-LOCAL-OUTPUT`.
Failures: `F-OUTPUT-SIZE`, `F-OUTPUT-RENDER-FAILURE`.
Forbidden: PDF/DOCX/PPTX/LaTeX/XLSX, multipart server response, signing, report storage.
PASS: Chrome/Edge matrix proves equivalent content, lifecycle cleanup, direct delivery and permanent heartbeat for all six formats.

## PHASE 7 EXIT GATE

Run Tasks 7.1-7.3 plus full input, privacy, AI, accessibility, storage and
exact-zero regressions. Report `PHASE 7 — PASS` or `PHASE 7 — BLOCKED`, then stop.

---

# 16. PHASE 8 — CANONICAL MVP RELEASE

## Task 8.1 — Release surfaces and claims
Purpose: Align product, Trust, Privacy, README, runbook and case study with the shipped MVP.
Preconditions: Phase 7 passed and Phase 8 is owner-authorized.
Allowed scope: Existing static surfaces, operational documentation, claim lint and tests.
Inputs: Verified Architecture 2.2 behavior and approved owner/legal facts.
Outputs: Consistent public release surfaces.
Required behavior: Explain local protection/restoration, pseudonymized AI processing, no-copy delivery, exact-zero and honest limits; classify portfolio artifacts accurately.
Bounds: `B-TRUST-PAGE-CHARS`, `B-README-CHARS`, `B-RUNBOOK-CHARS`, `B-CASE-STUDY-CHARS`.
Schemas: `S-TRUST-CLAIMS`.
Failures: `F-TRUST-CONTENT-GATE`, `F-DOCUMENTATION-GATE`.
Forbidden: Unsupported GDPR/security/anonymity/erasure/signing claims or feature expansion.
PASS: Claims, links, accessibility, privacy matrix and owner content/legal review pass.

## Task 8.2 — Clean-machine release candidate
Purpose: Prove the complete MVP from a disposable clean checkout.
Preconditions: Task 8.1 passed.
Allowed scope: Read-only clean checkout, documented build/test/Doctor/dry-run procedures and evidence.
Inputs: Reviewed release candidate and synthetic fixtures.
Outputs: `S-RECOVERY-RESULT` and `S-ZERO-COST-RESULT`.
Required behavior: Run architecture lint/hash, tests, Chrome/Edge E2E, security scans, dependency/license gates, exact-zero and deployment dry-runs without hidden state.
Bounds: `B-RECOVERY-WALL-MS`, `B-CI-JOB-MINUTES`, `B-DOCTOR-CHECKS`.
Schemas: `S-RECOVERY-RESULT`, `S-ZERO-COST-RESULT`, `S-PRIVACY-LIFECYCLE-RESULT`.
Failures: `F-RECOVERY-GATE`, `F-SECURITY-GATE`, `F-ZERO-COST-GATE`.
Forbidden: Production mutation, skipped gate, personal cache requirement, optional renderer activation.
PASS: Every documented gate passes from clean checkout and the repository returns clean.

## Task 8.3 — Owner-reviewed production promotion
Purpose: Promote and verify the canonical Architecture 2.2 MVP.
Preconditions: Task 8.2 passed; release PR, legal/privacy readiness and production action have explicit owner approval.
Allowed scope: Existing Pages, public edge and private TrustedRuntime; sequential synthetic live verification and documented rollback.
Inputs: Owner-approved release commit, existing bindings/secrets and synthetic fixtures only.
Outputs: Verified live MVP or a rolled-back blocked state.
Required behavior: Verify frontend, six formats, local protection/restoration, Managed Turnstile, one Groq call, canonical report, browser/Markdown/TXT delivery, no logging/storage, exact-zero and topology.
Bounds: `B-ANALYSIS-WALL-MS`, `B-WORKER-GZIP-BYTES`, `B-TRUSTED-MEMORY-BYTES`, `B-ANALYSIS-RESPONSE-BYTES`.
Schemas: `S-ANALYZE-REQUEST`, `S-ANALYZE-RESPONSE`, `S-ZERO-COST-RESULT`, `S-PRIVACY-LIFECYCLE-RESULT`.
Failures: `F-TURNSTILE-FAILURE`, `F-GROQ-FAILURE`, `F-NETWORK-BOUNDARY-FAILURE`, `F-ZERO-COST-GATE`, `F-RECOVERY-GATE`.
Forbidden: Paid fallback, new host/runtime/persistence, legacy output pipeline activation, unreviewed legal claim.
PASS: Owner-reviewed promotion and live synthetic matrix pass; privacy, no-logging, CI/security, exact-zero and repository/production cleanliness pass.

## PHASE 8 EXIT GATE — MVP COMPLETE

Only after Tasks 8.1-8.3 and all earlier regressions pass, the reviewed release
is live and the owner accepts it may the project report `MVP COMPLETE`.
Optional renderers require new owner authorization and do not block that state.

---

# 17. ENGINEERING AND GIT GOVERNANCE

Use one current-task context at a time. Proof existing behavior before adding
code. Run focused checks, then the task gate once. After three unsuccessful
targeted repair cycles, stop with the exact blocker. Clean disposable artifacts,
append concise `BUILD_LOG.md` evidence and make one repository-owner signed
logical commit per task.

Protected `main` requires human review. Never rewrite `main`, weaken branch
protection or call partial work PASS. At a phase gate, stop for owner approval.

If no Architecture 2.2-compliant implementation can satisfy a binding
invariant, report the task, invariant, evidence and exact contradiction. Do not
silently invent Architecture 2.3.

---

# 18. ENGINEERING DECISION RECORD

Historical decisions remain visible. Superseded decisions remain evidence and
their implementation/tests are not automatically deleted.

| # | Status | Decision | Reason |
|---:|---|---|---|
| 1 | Active, revised by 42 | No user-data database | Removes persistence and breach value. Architecture 2.2 has no persistent user-derived application state. |
| 2 | Superseded by 20 | Python/FastAPI/Cloud Run backend | Browser-local document processing removed the upload boundary. |
| 3 | Active | Cloudflare Pages primary | One exact-zero static host. |
| 4 | Active, revised | Cloudflare edge security and hybrid TLS | Managed TLS, Turnstile and fixed edge controls; public edge is secret-free. |
| 5 | Active, revised by 41 | Project-owned direct model adapter | One bounded Groq call; no provider SDK/router/arbitrary endpoint. |
| 6 | Superseded by 23, then 42 for MVP | ReportLab/Browser Run PDF | Server PDF was removed; Browser Run proof is retained but no longer an MVP dependency. |
| 7 | Superseded by 22 | ClamAV | Source binaries never enter the backend; reopen if that boundary changes. |
| 8 | Superseded by 41 | Three-request reasoning pipeline | One prompt preserves challenge/synthesis intent with less failure surface. |
| 9 | Superseded by 41 | Router/specialist stages | Deterministic focus plus one call is sufficient. |
| 10 | Active, revised by 42 | Deterministic transforms and rendering | Deterministic work stays in checked code; MVP rendering is browser-local. |
| 11 | Active | No chat | Chat adds state and is outside the mission. |
| 12 | Active | Deterministic health and human-approved changes | Reject autonomous code changes. |
| 13 | Superseded by 25 | First-use download tokens | Direct in-memory delivery removes routes/tokens/state. |
| 14 | Active | Nordic editorial visual system | Preserves premium restrained product identity. |
| 15 | Active | Aethelgard name | Renaming adds no value. |
| 16 | Active | Free `pages.dev` and `workers.dev` routes | Avoid custom-domain cost. |
| 17 | Superseded by 27 | GitHub OIDC and Google WIF | Google is not a target runtime. |
| 18 | Superseded by 19 | Google budget alert | Budget alerts do not prevent charges. |
| 19 | Active | Exact-zero means no charge path | Free quota exhaustion fails closed. |
| 20 | Active | Browser-local validation/parsing/language/redaction | Raw and unredacted content stay local. |
| 21 | Active | Deterministic PII plus local NER and frozen corpus | Explainable tested English baseline. |
| 22 | Active | Browser-local ClamAV trust-boundary EDR | Remove scanner because source-upload boundary is removed. |
| 23 | Active | Secret-free edge directly bound to private Durable Object | No dispatcher is required. |
| 24 | Superseded by 42 for MVP; evidence retained | Exact-PDF SHA-256 + Ed25519 + ML-DSA-65 | Proven portfolio integrity layer is not required for the minimal useful release. |
| 25 | Active | Direct in-memory browser delivery | No result store, route, session or token. |
| 26 | Active | Desktop Chrome/Edge, English text, no OCR | Matches verified parser and PII scope. |
| 27 | Active | Portfolio-minimal feature surface | Reject SaaS machinery and paid services. |
| 28 | Active | Zod schema-first TypeScript runtime | One strict boundary language. |
| 29 | Superseded by 42 for MVP; evidence retained | Minimal XLSX output writer | Spreadsheet output is not required for the privacy-gateway MVP. |
| 30 | Superseded by 42 for MVP; evidence retained | Browser Run quota counter | No Browser Run on the MVP path, so no quota record is needed. |
| 31 | Superseded by 41 | Exactly three AI stages | Accidental orchestration complexity. |
| 32 | Active | Deterministic Doctor and fault reflexes | Low-attention operation without repair AI. |
| 33 | Portfolio evidence, not MVP gate | Static signed sample | Retained as historical demonstration, not a runtime dependency. |
| 34 | Active | Persistent application logs disabled | Supports no-copy and minimizes processor data. |
| 35 | Active | Siteverify inside private TrustedRuntime | Secret stays out of the public edge. |
| 36 | Active | Sequential task/phase governance | Prevents drift and speculative work. |
| 37 | Active, revised by 42 | Executable PES contracts | Task capsules and registries remain deterministic under 2.2. |
| 38 | Superseded by 39 | Language score margin | Ranking values are not calibrated confidence. |
| 39 | Active | English-first language rule | Accept valid top-ranked English after minimum evidence. |
| 40 | Active | Ten-second Siteverify timeout | Matches proven Managed Turnstile behavior; no retry. |
| 41 | Active | One-call MVP golden spine | Owner-verified six-format protected one-call result path is the heartbeat. |
| 42 | Active | Privacy-gateway mission and local identity restoration | Preserve the proven spine; retain the map ephemerally, restore exact known tokens locally, use one canonical report, ship browser/Markdown/TXT first, and move heavy render/signing machinery outside the MVP gate. |

Detailed retained EDR artifacts remain under `docs/`. EDR 42 is recorded in
`docs/EDR_PRIVACY_GATEWAY_RECONCILIATION.md`; it is the binding Architecture
2.2 reconciliation decision, not a competing proposal.

---

# 19. CANONICAL BOUNDS REGISTRY

All bounds are inclusive. No implementation may truncate silently.

| Bound ID | Exact value | Unit | Scope | Failure behavior |
|---|---:|---|---|---|
| B-SOURCE-BYTES | 15,728,640 | bytes | One source | `F-OVERSIZED-DOCUMENT` |
| B-SELECTION-COUNT | 1 | file | One operation | `F-INVALID-DOCUMENT` |
| B-ARCHIVE-ENTRIES | 512 | entries | One archive | `F-HOSTILE-DOCUMENT` |
| B-ARCHIVE-TOTAL-BYTES | 67,108,864 | bytes | Expanded archive | `F-HOSTILE-DOCUMENT` |
| B-ARCHIVE-ENTRY-BYTES | 16,777,216 | bytes | One expanded entry | `F-HOSTILE-DOCUMENT` |
| B-ARCHIVE-RATIO | 100 | ratio | One entry | `F-HOSTILE-DOCUMENT` |
| B-PREFLIGHT-TIMEOUT-MS | 10,000 | ms | One preflight | `F-PARSER-TIMEOUT` |
| B-PARSER-TIMEOUT-MS | 30,000 | ms | One parser attempt | `F-PARSER-TIMEOUT` |
| B-PARSER-RETRY-COUNT | 1 | retry | Crash/timeout/allocation only | `F-PARSER-CRASH` |
| B-REDACTION-TIMEOUT-MS | 10,000 | ms | One redaction | `F-REDACTION-FAILURE` |
| B-SOURCE-RECORDS | 100,000 | records | Local document | `F-INVALID-DOCUMENT` |
| B-NETWORK-SOURCE-RECORDS | 512 | records | Analyze request | `F-NETWORK-BOUNDARY-FAILURE` |
| B-SOURCE-TEXT-CHARS | 100,000 | code points | One source record | `F-INVALID-DOCUMENT` |
| B-DOCUMENT-TEXT-CHARS | 2,000,000 | code points | Whole document | `F-INVALID-DOCUMENT` |
| B-DOCUMENT-WORDS | 8,000 | words | Whole document | `F-OVERSIZED-DOCUMENT` |
| B-IDENTITY-MAP-ENTRIES | 10,000 | entries | One operation | `F-REDACTION-FAILURE` |
| B-IDENTITY-VALUE-CHARS | 2,048 | code points | One original value | `F-REDACTION-FAILURE` |
| B-RESTORATION-TOKENS | 20,000 | occurrences | One report | `F-RESTORATION-FAILURE` |
| B-RESTORATION-TEXT-CHARS | 200,000 | code points | Whole report projection | `F-OUTPUT-SIZE` |
| B-RESTORATION-TIMEOUT-MS | 2,000 | ms | One local restoration | `F-RESTORATION-FAILURE` |
| B-BROWSER-STORAGE-WRITES | 0 | user-data writes | Every journey | `F-NETWORK-BOUNDARY-FAILURE` |
| B-NETWORK-REQUESTS | 3 | requests | One analysis: Siteverify, Groq, application response path | `F-NETWORK-BOUNDARY-FAILURE` |
| B-ANALYZE-BODY-BYTES | 524,288 | bytes | Public request | HTTP 413 |
| B-TURNSTILE-TOKEN-CHARS | 2,048 | characters | One token | `F-TURNSTILE-FAILURE` |
| B-TURNSTILE-TIMEOUT-MS | 10,000 | ms | Siteverify | `F-TURNSTILE-FAILURE` |
| B-AI-REQUEST-BYTES | 524,288 | bytes | One Groq request | `F-GROQ-FAILURE` |
| B-AI-TIMEOUT-MS | 30,000 | ms | One Groq request | `F-AI-TIMEOUT` |
| B-AI-RESPONSE-BYTES | 262,144 | bytes | One Groq response | `F-INVALID-AI-SCHEMA` |
| B-MODEL-OUTPUT-TOKENS | 4,096 | tokens | One Groq response | `F-INVALID-AI-SCHEMA` |
| B-PROVIDER-ATTEMPTS-TOTAL | 1 | attempt | Whole analysis | `F-GROQ-FAILURE` |
| B-REPORT-TITLE-CHARS | 200 | code points | Report title | `F-INVALID-AI-SCHEMA` |
| B-REPORT-ID-CHARS | 64 | ASCII characters | One canonical item ID | `F-INVALID-AI-SCHEMA` |
| B-REPORT-SUMMARY-CHARS | 3,000 | code points | Executive summary | `F-INVALID-AI-SCHEMA` |
| B-REPORT-ITEMS | 16 | items per collection | Findings/risks/recommendations | `F-INVALID-AI-SCHEMA` |
| B-REPORT-ITEM-CHARS | 2,000 | code points | One report text field | `F-INVALID-AI-SCHEMA` |
| B-EVIDENCE-REFERENCES | 8 | references per finding | Canonical report | `F-INVALID-AI-SCHEMA` |
| B-ANALYSIS-WALL-MS | 180,000 | ms | Complete analysis | `F-AI-TIMEOUT` |
| B-ANALYSIS-RESPONSE-BYTES | 524,288 | bytes | Canonical response | `F-OUTPUT-SIZE` |
| B-TEXT-OUTPUT-BYTES | 1,048,576 | bytes | Markdown or TXT | `F-OUTPUT-SIZE` |
| B-REQUESTED-OUTPUTS | 2 | local output types | Markdown/TXT | `F-OUTPUT-SIZE` |
| B-OBJECT-URL-LIFETIME-MS | 300,000 | ms | One local download | Revoke automatically |
| B-UI-TEXT-CHARS | 200,000 | code points | Browser report | `F-OUTPUT-SIZE` |
| B-APP-SHELL-MS | 2,000 | ms | Interactive target | `F-PERFORMANCE-GATE` |
| B-ENGINE-COLD-MS | 10,000 | ms | Parser-ready target | `F-PERFORMANCE-GATE` |
| B-LOCAL-WARM-MS | 2,000 | ms | Local preparation median | `F-PERFORMANCE-GATE` |
| B-ANALYSIS-MEDIAN-MS | 90,000 | ms | Release-corpus median | `F-PERFORMANCE-GATE` |
| B-FRONTEND-JS-GZIP-BYTES | 307,200 | bytes | Initial JS excluding lazy assets | `F-PERFORMANCE-GATE` |
| B-WORKER-GZIP-BYTES | 2,516,582 | bytes | Each Worker | `F-PERFORMANCE-GATE` |
| B-TRUSTED-MEMORY-BYTES | 100,663,296 | bytes | TrustedRuntime peak | `F-PERFORMANCE-GATE` |
| B-DOCTOR-CHECKS | 128 | checks | One Doctor run | `F-RECOVERY-GATE` |
| B-CI-JOB-MINUTES | 20 | minutes | One CI job | `F-RECOVERY-GATE` |
| B-RECOVERY-WALL-MS | 1,800,000 | ms | Clean-machine proof | `F-RECOVERY-GATE` |
| B-TRUST-PAGE-CHARS | 20,000 | code points | Trust/Privacy copy | `F-DOCUMENTATION-GATE` |
| B-README-CHARS | 20,000 | code points | README | `F-DOCUMENTATION-GATE` |
| B-RUNBOOK-CHARS | 40,000 | code points | Runbook | `F-DOCUMENTATION-GATE` |
| B-CASE-STUDY-CHARS | 40,000 | code points | Case study | `F-DOCUMENTATION-GATE` |

---

# 20. CANONICAL SCHEMA REGISTRY

All schemas are strict: every listed field is required unless marked optional;
additional fields are rejected; arrays are bounded; integers are finite safe
integers; strings use the named bounds.

### S-SOURCE-REFERENCE
Exact discriminated union: `{kind:"pdf_page",page:int}`;
`{kind:"docx_paragraph",paragraph:int}`; `{kind:"docx_table_cell",table:int,row:int,column:int}`;
`{kind:"pptx_slide",slide:int}`; `{kind:"xlsx_cell",sheet:int,cell:string}`;
`{kind:"csv_field",row:int,column:int}`; or `{kind:"txt_lines",line_start:int,line_end:int}`.
Indices are one-based and references follow source order.

### S-NORMALIZED-SOURCE-RECORD
Exact object `{schema_version:"1",ordinal:int,reference:S-SOURCE-REFERENCE,content:string}`.
Before protection `content` is browser-local; afterward it contains stable tokens.

### S-REDACTION-REQUEST
Exact local object `{schema_version:"2",sources:S-NORMALIZED-SOURCE-RECORD[]}`.

### S-IDENTITY-MAP
Exact local object `{schema_version:"1",entries:[{token:string,type:"EMAIL"|"PHONE"|"CUSTOMER_ID"|"PAYMENT_CARD"|"ADDRESS"|"PERSON"|"ORGANIZATION"|"LOCATION",original:string}]}`.
Tokens are unique, follow Section 4.3 grammar and are ordered by numeric creation order. Originals are non-empty within `B-IDENTITY-VALUE-CHARS`. Empty `entries` is valid.

### S-REDACTION-RESULT
Exact browser-local object `{schema_version:"2",sources:S-NORMALIZED-SOURCE-RECORD[],placeholder_count:int,must_redact_leaks:0,identity_map:S-IDENTITY-MAP}`.
`placeholder_count` equals map length. A zero count and empty map are successful.

### S-FOCUS
String enum `full|financial|strategic|security`.

### S-RESTORATION-MODE
String enum `restore|protected`; default is `restore`.

### S-ANALYZE-REQUEST
Exact object `{schema_version:"2",turnstile_token:string,focus:S-FOCUS,sources:S-NORMALIZED-SOURCE-RECORD[]}`.
Sources are pseudonymized. No output choice, identity map, filename or local mode crosses the network.

### S-TRUSTED-ANALYZE-REQUEST
The exact `S-ANALYZE-REQUEST` values after a fresh strict Zod parse inside
TrustedRuntime. The consumed Turnstile token is absent from the AI request.

### S-AI-TRANSPORT-REQUEST
Exact internal object `{schema_version:"2",stage:"analysis",provider:"groq",model_id:"openai/gpt-oss-20b",messages:[fixed_system,fixed_user_data],max_output_tokens:4096}`.
No caller-provided URL, model, provider, role or prompt is allowed.

### S-CANONICAL-REPORT
Exact object `{schema_version:"2",title:string,context:{focus:S-FOCUS,scope:string},executive_summary:string,findings:[{id:string,title:string,analysis:string,evidence:S-SOURCE-REFERENCE[],implications:string}],risks:[{id:string,title:string,analysis:string}],recommendations:[{id:string,title:string,action:string,priority:"high"|"medium"|"low",timeframe:"immediate"|"near_term"|"medium_term"|"long_term",rationale:string,evidence:S-SOURCE-REFERENCE[]}],closing_assessment:string}`.
All collections contain 1 through `B-REPORT-ITEMS`; all evidence arrays contain
0 through `B-EVIDENCE-REFERENCES`; every reference must exist in the request.
`title` uses `B-REPORT-TITLE-CHARS`; `executive_summary` uses
`B-REPORT-SUMMARY-CHARS`; item IDs are unique ASCII slugs within
`B-REPORT-ID-CHARS`; every other free-text field uses
`B-REPORT-ITEM-CHARS`.

### S-ANALYZE-RESPONSE
Exact no-store object `{schema_version:"2",report:S-CANONICAL-REPORT}`.

### S-RESTORATION-RESULT
Exact local object `{schema_version:"1",mode:S-RESTORATION-MODE,report:S-CANONICAL-REPORT,replacements:int,unknown_tokens:0}`.
The report is either exact-token restored or unchanged protected data.

### S-LOCAL-OUTPUT
Exact local object `{schema_version:"1",format:"markdown"|"text",mime:"text/markdown;charset=utf-8"|"text/plain;charset=utf-8",bytes:Uint8Array}` within `B-TEXT-OUTPUT-BYTES`.

### S-NETWORK-BOUNDARY-RESULT
Exact evidence object `{schema_version:"2",requests_observed:int,storage_writes:0,raw_source_egress:0,filename_egress:0,unredacted_text_egress:0,mapping_egress:0,restored_result_egress:0,passed:boolean}` containing no captured content.

### S-PRIVACY-LIFECYCLE-RESULT
Exact evidence object `{schema_version:"1",format:string,mode:S-RESTORATION-MODE,map_entries:int,known_tokens_replaced:int,unknown_tokens:0,reference_release_observed:boolean,network:S-NETWORK-BOUNDARY-RESULT,passed:boolean}`.

### S-TRUST-CLAIMS
Fixed claim IDs: `privacy_gateway`, `browser_local_source`, `browser_local_mapping`, `pseudonymized_ai_processing`, `browser_local_restoration`, `no_copy`, `provider_metadata_limit`, `english_only`, `desktop_chrome_edge`, `no_malware_scan`, `exact_zero`, `portfolio_signing_evidence`.

### S-RECOVERY-RESULT
Exact evidence object `{schema_version:"2",commit:string,architecture_sha256:string,build_passed:boolean,tests_passed:boolean,doctor_passed:boolean,dry_run_passed:boolean,privacy_passed:boolean,clean:boolean}`.

### S-ZERO-COST-RESULT
Exact evidence object `{schema_version:"1",gbp_upfront:0,gbp_monthly:0,usd_upfront:0,usd_monthly:0,paid_fallbacks:0,automatic_topups:0,passed:true}`.

---

# 21. CANONICAL FAILURE REGISTRY

Retry is the number after the first attempt. Downstream work is forbidden until
the failure is resolved by a new valid user operation.

| Failure ID | Detection point | Retry | Result | Downstream forbidden |
|---|---|---:|---|---|
| F-INVALID-DOCUMENT | Selection/preflight/parser | Parser faults only use one fresh retry | Document Safe Mode | Network and AI |
| F-HOSTILE-DOCUMENT | Hostile preflight | 0 | Document Safe Mode; terminate Worker | Parsing, network and AI |
| F-OVERSIZED-DOCUMENT | Source/body/word bound | 0 | Document Safe Mode or HTTP 413 | Later operation |
| F-PARSER-CRASH | Parser Worker | 1 fresh Worker | Client-resource Safe Mode after retry | Network until success |
| F-PARSER-TIMEOUT | Parser deadline | 1 fresh Worker | Terminate then Safe Mode | Network until success |
| F-REDACTION-FAILURE | Redaction Worker/schema/deadline | 0 | Privacy Safe Mode; release references | Network and AI |
| F-UNSUPPORTED-LANGUAGE | Local language gate | 0 | Language Safe Mode | Network and AI |
| F-NETWORK-BOUNDARY-FAILURE | Serialization/instrumented boundary/storage | 0 | Privacy Safe Mode and release block | AI or delivery |
| F-TURNSTILE-FAILURE | TrustedRuntime Siteverify | 0 | Verification Safe Mode; fresh user token | AI |
| F-GROQ-FAILURE | Groq transport/auth/rate/policy | 0 | Analysis Safe Mode | Retry, fallback, result |
| F-AI-TIMEOUT | Provider/wall timer | 0 | Analysis Safe Mode | Retry or later work |
| F-INVALID-AI-SCHEMA | Strict canonical parse/reference validation | 0 | Analysis Safe Mode | Restoration and rendering |
| F-TOKEN-INTEGRITY | Browser canonical-report scan | 0 | Privacy Safe Mode; release references | Restoration and delivery |
| F-RESTORATION-FAILURE | Browser exact substitution/deadline | 0 | Privacy Safe Mode; release references | Render and delivery |
| F-OUTPUT-RENDER-FAILURE | Local browser renderer | 0 | Output Safe Mode | Partial download |
| F-OUTPUT-SIZE | Response/view/local bytes | 0 | Output Safe Mode | Oversize render/download |
| F-RATE-LIMITED | Public edge | 0 | Fixed HTTP 429 | TrustedRuntime work |
| F-PERFORMANCE-GATE | Release measurement | 0 | Block release | Production promotion |
| F-SECURITY-GATE | Code/dependency/secret/license gate | 0 | Block release | Production promotion |
| F-ZERO-COST-GATE | Account/config evidence | 0 | Disable charged path and block | Production promotion |
| F-TRUST-CONTENT-GATE | Public claims/privacy review | 0 | Correct or block | Production promotion |
| F-DOCUMENTATION-GATE | Docs/runbook checks | 0 | Correct or block | Production promotion |
| F-RECOVERY-GATE | Clean-machine/Doctor proof | 0 | Correct deterministic artifact | Production promotion |

---

# 22. FINAL SYSTEM SUMMARY

```text
FILE
-> local validation, parsing, language and pseudonymization
-> browser-private identity map
-> secret-free edge
-> private Turnstile + one Groq call
-> strict canonical pseudonymized report
-> exact local identity restoration or protected mode
-> browser + Markdown/TXT direct delivery
-> no copy
```

MVP machinery ends there.

Preserve the proven heavy-output and cryptographic work as portfolio evidence,
but do not make it a release dependency. Build the privacy lifecycle, canonical
report and simple delivery exactly once. Then release the smallest complete
Aethelgard.
