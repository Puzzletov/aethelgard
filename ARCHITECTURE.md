# Project Engineering Specification (PES)

**Project name:** Aethelgard
**Document type:** Build Guide, System Architecture, and Project Tracker
**Version:** 2.1
**Date:** 2026-08-30
**Status:** Approved for build
**Language:** Simplified Technical English
**Purpose:** Final system architecture, build guide, and phase authority
**Supersedes:** Architecture 2.0 and all earlier architecture proposals and handoffs

**Revision:** Execution hardening revision; Task 1.10 score-contract correction — 2026-08-30

---

# 0. OWNER DIRECTIVE

This is the final architecture revision.

Architecture research is closed.

Do not start another:

* feasibility phase;
* architecture comparison;
* provider survey;
* BYOK investigation;
* infrastructure alternative study;
* cryptography comparison;
* PDF-engine comparison;
* document-parser comparison;
* monitoring-platform comparison;
* AI-framework comparison;
* speculative optimization exercise.

The architecture has already been through:

* Architecture 2.0 review;
* exact-zero feasibility analysis;
* Phase -1A;
* Phase -1B;
* Phase -1C;
* Phase -1D;
* browser-local parsing proof;
* hostile-file proof;
* frozen PII benchmark;
* Browser Run exact-PDF proof;
* Ed25519 + ML-DSA-65 proof;
* Cloudflare Free quota analysis;
* approved browser-local trust-boundary EDR;
* zero-cost account gate;
* external Durable Object minimisation proof;
* whole-system strawman;
* whole-system steelman;
* Occam's Razor review.

The architecture questions are closed.

Build only the owner-authorized phase, one canonical task at a time. At each
phase exit gate, stop and obtain explicit owner authorization for the next
phase. Live authorization and implementation status belong in `BUILD_LOG.md`
and concise agent guidance, not in this immutable specification.

If a normal implementation test fails:

* fix the implementation inside Architecture 2.1;
* retest;
* fail closed if necessary.

Only return to the owner for a new architecture decision if implementation proves a direct contradiction with a binding architecture invariant.

Do not weaken:

* security;
* privacy;
* exact-zero cost;
* cryptographic integrity;
* hostile-file controls;
* coding standards;
* bounded resource rules;
* architecture simplicity

to make a test pass.

---

# 1. ARCHITECTURE AUTHORITY

The following completed decisions are architectural evidence:

* Architecture 2.1 in this document is owner-approved for build and is the
  protected-main authority after its reviewed promotion.
* Phase -1 technical feasibility is complete.
* Exact-zero account gate is complete.
* Browser-local trust-boundary EDR is approved.
* Frozen PII acceptance baseline is approved.
* External Durable Object direct-binding minimisation proof passed.
* The private dispatcher Worker and Service Binding are rejected as unnecessary.
* The old final Architecture 2.1 proposal hash is superseded by this owner revision.
* Architecture research is closed.

The old proposal SHA-256:

`bd5ce7b55485965938270ec02ee590114f539da277adde9f1e09fabf9d2f9794`

is historical evidence only.

It is **not** the hash to promote because this final owner revision deliberately removes and changes additional features.

The authoritative architecture hash is SHA-256 of the exact Git blob content
bytes of `ARCHITECTURE.md`. Do not normalize line endings. Run
`npm run architecture:hash` against the committed blob and record the result
in `BUILD_LOG.md`. Do not place a self-referential hash inside this file.

---

# 2. NON-NEGOTIABLE PROJECT INVARIANTS

These are Aethelgard's constitution.

They outrank implementation convenience.

## 2.1 Mission

Canonical mission:

> **Open a business document -> receive a professional analysis -> Aethelgard keeps no copy.**

Aethelgard is primarily a portfolio engineering project.

The engineering is the product.

The document-analysis experience demonstrates:

* AI reasoning;
* structured critique;
* cybersecurity;
* privacy engineering;
* classical cryptography;
* post-quantum cryptography;
* strict resource engineering;
* architecture under exact-zero cost;
* low-maintenance system design;
* premium information design.

It is **not** intended to become a commercial SaaS product.

---

## 2.2 Exact-zero cost

Lifetime Aethelgard project cost must remain:

**GBP 0.00**

and

**USD 0.00**

upfront and recurring.

Forbidden:

* paid subscriptions;
* metered paid overage;
* automatic top-up;
* pay-as-you-go fallback;
* paid model fallback;
* paid compute fallback;
* paid storage fallback;
* paid monitoring fallback;
* "small" recurring costs;
* accepting a budget alert as a spending control.

Quota exhaustion must:

* fail closed; or
* degrade through an explicitly approved zero-cost path.

A charged fallback is not a fallback.

A weaker privacy/security fallback is not a fallback.

A quota may reduce functionality.

It may never create a charge.

---

## 2.3 Simplicity — Voyager / Occam rule

Use the fewest moving parts that preserve the mission.

Before adding any:

* service;
* package;
* abstraction;
* route;
* process;
* runtime;
* storage mechanism;
* queue;
* fallback;
* background job;
* AI call;
* credential;
* API;
* monitoring system

ask:

> Does the mission require this property?

If not, do not add it.

Do not retain superseded infrastructure "just in case."

Do not build for hypothetical future scale.

Do not optimize Aethelgard into a larger machine than the portfolio mission requires.

---

## 2.4 Privacy

Raw source binaries never leave the user's browser.

Unredacted extracted text never leaves the user's browser.

PII replacement mappings never leave the user's browser.

Only typed redacted source records may cross the document privacy boundary.

Aethelgard stores no:

* source document;
* extracted document;
* redacted document;
* report history;
* prompt history;
* job history;
* user account;
* user profile;
* email address;
* user API key.

The selected AI provider necessarily processes redacted business content.

This must be disclosed honestly.

Do not claim:

> nothing anywhere records anything.

Use the narrower, defensible claim:

> **Aethelgard keeps no copy of your source document or generated analysis.**

Infrastructure providers may retain non-content operational metadata according to their platform policies.

---

## 2.5 Storage

No database may contain user data.

No report database exists.

No user database exists.

No source-file store exists.

No scratch bucket exists.

No result store exists.

No download-token store exists.

No persistent job queue exists.

The only server-side persistent application state allowed is the approved anonymous Browser Run quota record containing:

* current UTC date;
* aggregate Browser Run milliseconds.

It contains no:

* user ID;
* IP;
* document ID;
* report ID;
* job ID;
* prompt;
* source;
* email;
* filename.

Browser HTTP caching of immutable application/parser/font assets is allowed.

Persistent browser storage of user-derived content is forbidden.

Do not put user-derived content into:

* localStorage;
* sessionStorage;
* IndexedDB;
* Cache Storage;
* OPFS;
* service-worker caches;
* cookies.

---

## 2.6 Security

Fail closed.

A failed security control stops the affected operation.

Never weaken:

* hostile-file validation;
* PII redaction;
* schema validation;
* source-boundary controls;
* secret isolation;
* rate limits;
* Turnstile;
* CSP;
* exact-byte signing;
* output validation;
* provider privacy restrictions

for:

* speed;
* convenience;
* availability;
* aesthetics;
* quota conservation.

---

## 2.7 Cryptography

Every final PDF is signed over its **exact final bytes**.

The sequence is:

```text
final exact Browser Run PDF bytes
-> SHA-256 digest
-> Ed25519 signs the digest
-> ML-DSA-65 signs the same digest
```

A PDF is valid only if:

1. its computed SHA-256 matches;
2. Ed25519 verification succeeds;
3. ML-DSA-65 verification succeeds.

Both signatures are mandatory.

Never expose:

* `/sign`;
* caller-provided PDF signing;
* caller-provided HTML signing;
* caller-provided hash signing;
* generic signing methods.

Only service-authored validated report data may reach Browser Run.

Only the exact PDF bytes returned by Browser Run may reach the internal signer.

The PDF is never modified after hashing.

---

## 2.8 Performance

Performance remains a release requirement.

It may not weaken higher-priority invariants.

Targets appear in Section 19.

Measure rather than guess.

---

## 2.9 Bounded resources

Every:

* input;
* archive;
* decompression;
* word count;
* array;
* string;
* request;
* model call;
* retry;
* output;
* allocation;
* queue;
* loop;
* task;
* timeout

must have a named bound.

Fail closed above bounds.

---

## 2.10 Coding standard

The strict coding standard remains binding through every phase.

Do not relax it to ship faster.

Details appear in Section 17.

---

## 2.11 Maintenance

Aethelgard must operate for long periods with little owner attention.

Achieve this primarily through:

* little persistent state;
* few dependencies;
* few providers;
* deterministic health checks;
* immutable configuration;
* bounded retries;
* disposable workers;
* safe degradation;
* static portfolio fallback.

Do not build an autonomous software engineer inside Aethelgard.

---

## 2.12 AI boundary

AI performs judgment and language reasoning.

Deterministic code performs deterministic work.

AI must never control:

* application routing;
* network destination;
* filesystem;
* browser;
* shell;
* code execution;
* storage;
* signing;
* deployment;
* report destination;
* credentials.

---

## 2.13 Architecture governance

`ARCHITECTURE.md` is the single source of truth.

Implementation difficulty is not permission to change architecture.

An architecture change requires:

1. explicit owner approval;
2. an updated `ARCHITECTURE.md`;
3. an Engineering Decision Record entry;
4. a concise `BUILD_LOG.md` entry.

Do not silently solve architecture problems.

---

# 3. ENGINEERING PRIORITY ORDER

When requirements genuinely conflict, use this precedence:

1. correctness;
2. security and privacy;
3. exact-zero cost;
4. reliability and recoverability;
5. simplicity and maintainability;
6. bounded resource use;
7. performance;
8. premium intuitive user experience;
9. additional functionality.

A lower priority may never silently invalidate a higher one.

Within solutions satisfying priorities 1–7, visual quality remains a hard release criterion.

---

# 4. VOYAGER DIRECTIVE

Aethelgard follows four Voyager-inspired practices.

## 4.1 Minimal machinery

Carry only what serves the mission.

## 4.2 Conservative margins

Do not operate at the exact edge of a provider limit.

Keep safety margins.

## 4.3 Voyager Verification Rule

Before a production release, run the full approved release verification suite.

## 4.4 Graceful degradation

When an instrument cannot operate:

* isolate it;
* disable it;
* use an approved zero-cost fallback if one exists;
* otherwise enter labelled Safe Mode.

Do not silently produce weaker output.

The mission survives even if an instrument temporarily does not.

---

# 5. FINAL PRODUCT SCOPE

## 5.1 Supported input

Support exactly:

* PDF;
* DOCX;
* PPTX;
* XLSX;
* CSV;
* TXT.

Maximum source size:

**15 MiB**

Maximum extracted text:

**8,000 words**

A document above either limit is rejected.

Do not silently truncate.

---

## 5.2 Text documents only

Architecture 2.1 supports digital text-bearing documents.

Do not add OCR.

Image-only/scanned documents without sufficient extractable text are unsupported.

Return a clear Safe Mode / unsupported-document explanation.

---

## 5.3 Language

Architecture 2.1 supports **English-language source content only**.

Reason:

The approved PII regression evidence is an English-context baseline.

Do not claim multilingual PII protection that has not been demonstrated.

Language classification occurs locally before network egress.

Use pinned offline `franc-min`.

Do not call an external language service.

If language is:

* non-English;
* mixed and uncertain;
* impossible to classify confidently;
* insufficiently text-bearing

fail closed before document-derived content crosses the network.

Apply Schema `S-LANGUAGE-DECISION`: normalize whitespace; take the leading
`B-LANGUAGE-SAMPLE-CHARS`; require at least 40 alphabetic Unicode letters and
at least 8 whitespace-separated letter-bearing tokens in that sample; then run
pinned offline `francAll` from `franc-min`. Treat tuple values as normalized
scores. Let `eng_score` be the first tuple's score and `runner_up_score` be the
second tuple's score. Calculate the integer basis-point margin exactly as
`round((eng_score - runner_up_score) * 10,000)`. Accept only when the first
result is exactly `eng` and the margin is at least `B-LANGUAGE-MARGIN`.
Reject every other, tied, mixed, uncertain, or insufficient-evidence result
locally. Freeze clear English, English with international names, non-English,
mixed-language, and short-text cases in tests.

Do not add multilingual PII models.

---

## 5.4 Analysis

The analysis pipeline contains exactly three model stages:

1. Strawman Analyst;
2. Steelman Critic;
3. Oracle Synthesizer.

No Router agent.

No separate Financial Specialist agent.

No separate Strategic Specialist agent.

No separate Security Specialist agent.

The user chooses the desired lens deterministically:

* `full`;
* `financial`;
* `strategic`;
* `security`.

For `full`, the Strawman handles the required lenses in one model request.

Normal successful analysis therefore uses exactly **three AI requests**.

---

## 5.5 Output

After a valid Oracle result:

* always show the browser dashboard;
* PDF is the default downloadable report;
* XLSX is optional;
* plain-text/Markdown is optional.

No email.

No result route.

No download route.

No token.

No server session.

No report persistence.

---

## 5.6 Trust output

Provide:

* detached `.sig.json` manifest;
* published Ed25519 public key;
* published ML-DSA-65 public key;
* local browser verifier;
* independent command-line verifier;
* Trust page;
* one synthetic signed static sample.

---

# 6. FEATURES EXPLICITLY OUT OF SCOPE

Architecture 2.1 has no:

* BYOK;
* user API-key handling;
* OAuth;
* provider connection UI;
* user account;
* authentication account system;
* email delivery;
* Resend;
* Sentry;
* UptimeRobot;
* Google Cloud runtime;
* Cloud Run;
* Google Secret Manager as target runtime;
* server-side document parsing;
* scratch bucket;
* source storage;
* result storage;
* download token;
* RAG;
* chat;
* MCP;
* OCR;
* multilingual PII;
* mobile support;
* Safari support;
* Firefox support;
* enterprise-volume guarantee;
* uptime SLA;
* arbitrary AI provider URL;
* AI maintenance agent;
* autonomous code repair;
* self-modifying code;
* automatic architecture modification;
* automatic code merge;
* Ollama requirement;
* Semgrep requirement;
* second trusted runtime;
* paid fallback.

Do not replace removed features with different products that provide the same unnecessary complexity.

---

# 7. FINAL RUNTIME ARCHITECTURE

Use this architecture:

```text
USER DEVICE
|
| source document
v

BROWSER-LOCAL PROCESSING
|
|-- file-size / magic / archive / hostile-content checks
|-- disposable Parser module Web Worker
|-- source-referenced extracted text
|-- local English-language gate
|-- disposable Redaction module Web Worker
|-- deterministic structured PII rules
|-- local context rules
|-- pinned Compromise NER
|-- typed redacted source records
|
| raw source and unredacted text stop here
v

PUBLIC CLOUDFLARE EDGE WORKER
|
|-- GET /health
|-- POST /analyze
|-- method allow-list
|-- origin allow-list
|-- content-type check
|-- bounded body-size check
|-- Workers Rate Limiting
|-- cheap envelope validation
|-- security headers
|
| NO SECRET BINDINGS
|
v

DIRECT EXTERNAL DURABLE OBJECT BINDING
using Wrangler class_name + script_name
|
v

TrustedRuntime DURABLE OBJECT
defined in a separate private Worker script
|
|-- Turnstile Siteverify
|-- full request Zod validation
|-- privacy / provider / quota preflight
|-- Strawman
|-- Steelman
|-- Oracle
|-- deterministic report model
|-- deterministic charts/output transforms
|-- optional XLSX/text
|-- Browser Run /pdf
|-- exact PDF SHA-256
|-- Ed25519
|-- ML-DSA-65
|
v

PUBLIC EDGE PASS-THROUGH
|
v

BROWSER MEMORY
|
|-- dashboard
|-- bounded output parts
|-- short-life object URLs
|-- user download
|
v

DONE
```

---

# 8. CRITICAL TURNSTILE CORRECTION

The public edge must remain **literally secret-free**.

Therefore:

**Do not perform Turnstile Siteverify in the public edge Worker.**

Turnstile server-side verification requires a private secret.

The final placement is:

```text
Browser
-> Turnstile token
-> public secret-free edge
-> TrustedRuntime
-> Cloudflare Siteverify using TURNSTILE_SECRET
```

The public edge performs cheap abuse controls first:

* method;
* route;
* origin;
* content type;
* request size;
* rate limit;
* basic envelope shape.

Then it calls `TrustedRuntime`.

`TrustedRuntime` performs Turnstile Siteverify **before**:

* AI;
* Browser Run;
* report generation;
* signing.

If Turnstile verification fails:

* stop immediately;
* make no AI call;
* make no Browser Run call;
* create no report.

Validate returned:

* success;
* expected action;
* approved production hostname.

Do not send `remoteip` to Siteverify unless later demonstrated necessary.

The platform rate limiter already provides the required public abuse control without storing an IP in application state.

Bound the Turnstile token to the provider maximum.

Treat it as single-use.

After an analysis attempt, the frontend must obtain/reset to a fresh challenge before retrying.

---

# 9. SECRET BOUNDARY

The public edge Worker has **zero secret bindings**.

The private script defining `TrustedRuntime` owns the secrets required by the final architecture.

Use explicit secret slots.

Final target secret names:

* `TURNSTILE_SECRET`
* `GROQ_API_KEY`
* `OPENROUTER_API_KEY`
* `SIGNING_ED25519_PRIVATE_B64`
* `SIGNING_MLDSA65_SEED_B64`

Public/non-secret configuration may include:

* Turnstile site key;
* signing public keys;
* signing key IDs;
* architecture version;
* allowed production origin.

No HMAC download secret exists.

No generic `ENCRYPTION_KEY` exists unless it has a separately approved final purpose.

Secrets must never appear in:

* Pages;
* browser bundles;
* public edge environment;
* repository;
* CI output;
* logs;
* query strings;
* error messages.

The private defining script must have:

* `workers_dev = false`;
* preview URLs disabled;
* no public route.

It exists only to define/own the Durable Object class, secrets and required bindings.

It is not a dispatcher Worker.

Do not add a Service Binding dispatcher.

---

# 10. PUBLIC API SURFACE

Dynamic public application operations are exactly:

* `GET /health`
* `POST /analyze`

`OPTIONS /analyze` is fixed CORS protocol handling, not another application
operation. It accepts only the configured origin, `POST`, and the
`content-type` request header. It contains no secret or business behavior.

No:

* `/upload`;
* `/download`;
* `/result`;
* `/job`;
* `/sign`;
* `/email`;
* `/auth`;
* `/byok`;
* generic proxy route.

Unknown dynamic routes fail closed.

Static Pages may expose:

* main application;
* Trust page;
* verification page;
* static sample;
* normal static assets.

---

# 11. ANALYSIS REQUEST CONTRACT

The public analysis request is exactly Schema `S-ANALYZE-REQUEST`:

```text
schema_version
turnstile_token
focus
requested_outputs
sources
```

No source binary.

No original filename.

No unredacted text.

No email.

No API key.

No arbitrary provider choice.

No arbitrary URL.

No arbitrary prompt.

`focus` is an allow-listed enum.

`requested_outputs` is exactly Schema `S-REQUESTED-OUTPUTS`.

Each source record contains only redacted content and non-sensitive structural references.

The allowed structural-reference variants are exactly Schema
`S-SOURCE-REFERENCE`:

* PDF page number;
* DOCX paragraph/table index;
* PPTX slide index;
* XLSX sheet index + cell/range;
* CSV row/column;
* TXT line range.

Do not transmit raw filenames.

Do not use unredacted sheet names or other raw metadata as source references.

If a human-readable label is needed, redact it locally or use a neutral structural label.

The trusted runtime validates the schema again.

Boundary validation occurs twice:

1. public ingress;
2. trusted consumer.

---

# 12. BROWSER-LOCAL SECURITY BOUNDARY

## 12.1 Hostile-file validation

Before normal parsing, validate:

1. real format magic;
2. allowed format;
3. 15 MiB source bound;
4. archive-entry count;
5. total archive expansion;
6. per-entry expansion;
7. compression ratio;
8. traversal/path abuse;
9. encrypted PDF;
10. encrypted ZIP/Office containers;
11. XML doctypes;
12. XML entities/expansion;
13. Office external relationships;
14. macros;
15. ActiveX;
16. OLE;
17. embedded objects/content;
18. malformed structure;
19. false extension;
20. false magic.

Keep all existing hostile-file regression fixtures.

Old failures may be added to.

Never remove an old security regression because it is inconvenient.

---

## 12.2 Disposable Parser Worker

Parsing runs only in a disposable module Web Worker.

Terminate it after:

* success;
* timeout;
* crash;
* forced loop;
* allocation failure.

A fresh Worker must recover after an injected failure.

Do not reuse a potentially corrupted parser Worker.

---

## 12.3 Disposable Redaction Worker

PII redaction runs separately from hostile document parsing.

It receives extracted text, not source binaries.

Use:

1. deterministic structured rules;
2. local context rules;
3. pinned offline Compromise last.

Higher-priority exact/containing matches suppress inappropriate nested NER matches.

PII placeholder mapping remains browser-only.

Example concept:

```text
Anna Example -> [PERSON_1]
Example AB -> [ORG_1]
```

The mapping is discarded after the operation.

Generated Aethelgard reports remain based on the redacted representation.

Do not rehydrate removed PII on the server.

---

## 12.4 Frozen PII acceptance baseline

Keep the approved corpus:

* 84 cases;
* 576 labelled entities;
* 14 cases per supported input format.

Expected SHA-256:

`0c777c5fc3300eb0b00a29cf583b23ea6455a12a43d990531b88990d1d679467`

Release floors:

| Measure                | Minimum |
| ---------------------- | ------: |
| Structured PII recall  |    100% |
| Named-entity recall    |     95% |
| Named-entity precision |     80% |
| Overall recall         |     97% |
| Overall precision      |     85% |
| Must-redact leaks      |       0 |

These are project regression requirements.

They are not universal PII accuracy claims.

New failures are added to the corpus.

Old cases are never replaced to improve scores.

---

## 12.5 Approved malware decision

Keep `docs/EDR_BROWSER_LOCAL_TRUST_BOUNDARY.md`.

ClamAV is removed because source binaries no longer enter the trusted backend.

Aethelgard does **not** claim to malware-scan uploaded files.

The exact lost property is known-malware signature matching.

The replacement architecture reduces the trusted attack surface instead.

If any future architecture sends source binary bytes to:

* a backend;
* an AI provider;
* email;
* storage;
* another remote service

the approved ClamAV EDR is automatically reopened.

That requires a new owner security decision before deployment.

---

# 13. LANGUAGE GATE

Add a frozen local language fixture set covering:

* clear English prose;
* English table content;
* English with international names;
* Spanish;
* French;
* German;
* Swedish;
* mixed-language ambiguous content;
* insufficient textual content.

Use `franc-min` offline and Schema `S-LANGUAGE-DECISION`.

No language data crosses the network merely to identify language.

If there is insufficient language evidence to classify conservatively:

Safe Mode.

Do not add another NLP model.

Do not add an online translator.

Do not translate documents to work around the restriction.

---

# 14. NETWORK-BOUNDARY TEST

An automated browser test must observe every network request after file selection.

It must prove:

* asset requests contain no user-derived content;
* Turnstile requests contain no document content;
* zero analysis/provider request occurs before local redaction completes;
* the first request containing document-derived data matches the exact redacted schema;
* no raw source byte crosses;
* no unredacted extracted text crosses;
* no raw PII label crosses;
* no raw filename crosses;
* no local object URL crosses;
* no PII mapping crosses;
* no browser storage receives user data;
* both local Workers terminate as required.

---

# 15. AI ARCHITECTURE

## 15.1 One deterministic focus selector

The UI supplies:

* `full`;
* `financial`;
* `strategic`;
* `security`.

Ordinary TypeScript selects the corresponding prompt instructions.

Do not call AI merely to decide which AI to call.

---

## 15.2 Stage 1 — Strawman Analyst

Input:

* typed redacted source records;
* deterministic focus enum.

For `full`, one call covers:

* financial/operational;
* strategic/competitive;
* security/compliance

in every `full` analysis.

Output is exactly Schema `S-STRAWMAN-OUTPUT`:

* findings;
* evidence references;
* confidence;
* quantitative candidates;
* risks;
* assumptions.

Every material finding has:

* source reference;
* High / Medium / Low confidence.

Reject additional unknown fields.

---

## 15.3 Stage 2 — Steelman Critic

Input:

* redacted sources;
* validated Strawman.

Job:

* attack weak reasoning;
* find omissions;
* identify nuance;
* identify contradictions;
* locate counter-evidence;
* identify unsupported claims;
* identify missed connections.

Output is strict typed critique items.

Every source-based critique cites source references where applicable.

---

## 15.4 Stage 3 — Oracle Synthesizer

Input:

* redacted sources;
* validated Strawman;
* validated Steelman.

Output is exactly Schema `S-ORACLE-OUTPUT`:

* executive summary;
* final findings;
* recommendations;
* risks;
* confidence;
* source references;
* validated numeric candidates for deterministic charting.

Every Steelman critique point must be:

* resolved; or
* explicitly marked unresolved.

Unchecked model text never enters:

* another AI stage;
* report generation;
* chart generation;
* HTML;
* signing.

---

## 15.5 Model-call bound

Normal successful analysis:

**3 calls total.**

Provider-failure policy:

For each stage:

1. one Groq attempt;
2. if hard failure, one OpenRouter Free attempt;
3. if that fails, Safe Mode.

A hard failure includes:

* network failure;
* rate limit;
* unavailable provider;
* invalid schema;
* invalid structured output;
* provider policy failure;
* timeout.

A provider that fails is marked unavailable for the remainder of that request.

Do not keep hitting it.

Therefore:

* normal = 3 calls;
* absolute provider-attempt maximum = 6 calls.

No unbounded retries.

No "try until valid."

---

## 15.6 Provider design

Primary:

**Groq Free**

Fallback:

**OpenRouter Free only**

No other runtime provider.

No arbitrary endpoint.

No BYOK.

No provider SDK zoo.

Use one small project-owned direct HTTPS model router.

Model IDs are configuration, not architecture.

If a model disappears:

* select another already allowed free compatible model by reviewed configuration; or
* Safe Mode.

Do not change architecture.

Configured models must support the complete bounded prompt/context/output requirements.

---

## 15.7 Provider privacy

Before production live analysis:

Groq account must have its available Zero Data Retention protection enabled.

OpenRouter requests must enforce the approved privacy policy equivalent to:

* ZDR required;
* data collection denied;
* required parameters supported;
* free route only.

If no free endpoint satisfies privacy requirements:

Safe Mode.

Never relax provider privacy requirements to obtain an answer.

Trust documentation must say:

> The AI provider temporarily processes redacted business text. Raw source files and unredacted extracted text are never sent to the AI provider.

---

## 15.8 Prompt injection

Treat all source-document content as untrusted data.

System prompts explicitly state that instructions inside the source document are evidence/content, not commands.

Agents have no tools.

No prompt may grant:

* internet browsing;
* files;
* shell;
* code execution;
* storage;
* signing;
* email;
* deployment.

Keep adversarial prompt-injection fixtures.

---

# 16. OUTPUT ARCHITECTURE

## 16.1 Dashboard

A valid Oracle result always produces the browser dashboard.

The dashboard is deterministic rendering of validated data.

---

## 16.2 Charts

AI never draws charts.

AI may return schema-checked source-linked numeric candidates.

Deterministic code:

1. validates the numbers;
2. validates units/context;
3. transforms them;
4. builds chart data.

If the evidence does not support a chart:

omit the chart.

Never invent a number to make a visualization look complete.

---

## 16.3 PDF

PDF uses service-owned report HTML.

Model output never becomes raw HTML.

All inserted text is escaped.

Browser Run receives only validated report content.

Use the shared approved design-token system.

No caller-controlled HTML is accepted.

---

## 16.4 XLSX

Use the approved minimal OOXML writer plus tree-shaken `fflate`.

No pandas.

No server openpyxl.

Compatibility with current Excel and LibreOffice is an implementation release gate.

Do not reopen spreadsheet architecture merely because a fixture fails.

Fix the writer.

---

## 16.5 Text

Use a deterministic plain-text/Markdown formatter.

AI does not free-form the export format.

---

## 16.6 Direct delivery

Return requested outputs once as exact Schema `S-ANALYZE-RESPONSE` under
`B-ANALYSIS-RESPONSE-BYTES`.

No result route.

No storage.

No token.

No server-side retrieval.

The browser:

* receives the bounded response;
* holds output in memory;
* creates short-life object URLs;
* starts user-controlled download;
* revokes object URLs after use and on page exit.

The service cannot promise deletion of a file the user intentionally saves.

---

# 17. CODING STANDARD

## 17.1 Core rules

1. Use explicit simple control flow.
2. No hidden dynamic dispatch where ordinary code is clearer.
3. Every loop has a fixed bound, cancellation or timeout.
4. Every input has a named bound.
5. Every array has a named bound.
6. Every string has a named bound.
7. Every archive has named bounds.
8. Every retry has a named bound.
9. Every output has a named bound.
10. Every input-proportional allocation path references a Bounds Registry ID;
    fixed allocations state their compile-time size.
11. Functions are at most 50 lines, excluding fixed data tables.
12. Validate external input at ingress.
13. Validate again at the trusted consumer.
14. Use the smallest practical variable scope.
15. No request data in mutable module-global state.
16. Check every result and error.
17. Do not ignore rejected promises.
18. Do not silently swallow exceptions.
19. No JavaScript `eval`.
20. No JavaScript `Function`.
21. No unsafe model-generated HTML.
22. No Python `exec`.
23. Use immutable / readonly values except a documented mutable byte buffer
    that requires ownership transfer or wiping.
24. Copy mutable byte buffers when trust boundaries require ownership separation.
25. Warnings fail the build.

---

## 17.2 TypeScript

Use:

* `strict: true`;
* no unexplained `any`;
* clear discriminated unions;
* readonly values by default;
* Zod as runtime schema source of truth.

One file has one clear responsibility.

Do not create:

* `utils.ts`;
* `helpers.ts`

catch-all dumping grounds.

Every external operation has:

* named failure type;
* named timeout;
* explicit Safe Mode mapping.

---

## 17.3 Browser Python

Project-owned browser Python uses:

* type hints;
* bounded functions;
* Ruff;
* MyPy strict where Pyodide/package interfaces permit.

Do not import unnecessary parser wrappers.

Use only the approved direct parsers.

---

## 17.4 Cryptographic code

Never implement a cryptographic primitive from scratch.

Keep signing adapters and the ML-DSA Wasm wrapper inside a small isolated boundary.

Pin:

* source commit;
* compiler;
* build flags;
* output hash;
* official vectors.

Use library constant-time comparison for secrets where comparisons are required.

Never use ordinary string equality for secret verification.

Wipe mutable working-key/secret buffers in `finally` blocks where the runtime permits.

Do not claim the complete C -> Wasm -> V8 primitive has independently proven constant-time behavior.

---

## 17.5 Simplified Technical English and HTML standards

User-facing text and technical documentation should use clear Simplified Technical English principles.

Do **not** use `en-basiceng` as the HTML `lang` attribute.

Use a valid HTML/BCP-47 language value:

`lang="en"`

"Simplified Technical English" is the writing style, not a custom language tag.

---

# 18. VISUAL DESIGN INVARIANT

Aethelgard must not look like:

* generic SaaS;
* generic AI software;
* a chatbot;
* a template admin panel.

Design direction:

> **A premium analytical instrument designed with the restraint of Scandinavian architecture and interior design.**

It should evoke:

* a Scandinavian architecture monograph;
* a contemporary gallery catalogue;
* a high-end editorial publication;
* a premium strategy report;
* a quiet precision instrument.

The UI should feel:

* deliberate;
* spacious;
* tactile;
* architectural;
* calm;
* precise;
* intuitive;
* expensive through restraint rather than decoration.

---

## 18.1 Required visual characteristics

Use:

* strong architectural grid;
* generous negative space;
* precise alignment;
* careful proportion;
* clear spatial rhythm;
* strong editorial hierarchy;
* Fraunces for suitable display/headline use;
* Public Sans for body/functional use;
* warm off-white base;
* charcoal text;
* one controlled terracotta/rust accent;
* subtle rules/dividers;
* restrained corner radii;
* minimal shadows;
* high information clarity;
* calm transitions;
* obvious primary actions;
* excellent chart typography;
* accessible contrast;
* keyboard accessibility;
* semantic HTML;
* reduced-motion-safe interactions.

Use one shared typed design-token system across:

* website;
* dashboard;
* report;
* charts.

PDF and web should visibly belong to the same designed system.

Self-host required fonts/assets.

Do not load fonts from a third-party CDN.

Use only the necessary font weights/subsets.

---

## 18.2 Reject

Do not use:

* chat bubbles;
* AI sparkle motifs;
* neon;
* glassmorphism;
* gratuitous gradients;
* excessive pills;
* excessive rounded cards;
* card grids solely to occupy space;
* decorative 3D;
* stock SaaS illustration;
* unnecessary animation;
* gratuitous dashboards;
* noisy icon sets;
* visual elements that do not communicate information.

Premium comes from:

* typography;
* proportion;
* spacing;
* hierarchy;
* material restraint;
* detail.

Not ornament.

---

## 18.3 UI scope

One light visual system is enough for 2.1.

Do not add a theme system merely because many applications have one.

No localization system.

Architecture 2.1 UI is English.

Supported release interface target:

desktop Chrome and Edge.

Do not claim mobile/Safari/Firefox release support.

---

# 19. PERFORMANCE AND RESOURCE GATES

Keep conservative margins.

## 19.1 Input

* source: maximum 15 MiB;
* extracted text: maximum 8,000 words.

---

## 19.2 Frontend

* initial frontend JavaScript: under 300 KiB compressed, excluding lazy parser assets;
* parser assets lazy-load only after file selection/user action;
* each static asset remains below the Pages per-file limit;
* do not download the ~browser-Python stack merely because somebody views the portfolio/sample.

This is also a sustainability requirement.

---

## 19.3 Browser

Release target:

* modern desktop Chrome;
* modern desktop Edge.

Unsupported/low-memory browsers fail locally.

No source upload occurs as fallback.

Do not impose Cloudflare's server-isolate memory limit on the user's browser.

---

## 19.4 Timing

Reference performance gates:

* app shell interactive: `< 2 s`;
* clean-cache local engine ready: `<= 10 s`;
* warm local validate + parse + language + redact: `<= 2 s`;
* median full analysis: `<= 90 s`;
* absolute wall stop: `180 s`;
* PDF rendering median: `<= 5 s`;
* exact-byte signing median: `<= 50 ms`;
* public edge p99 CPU: `<= 8 ms`.

Report median and p95 where required.

Record separately:

1. shell;
2. Pyodide/parser readiness;
3. local validate/parse/language/redact;
4. Strawman;
5. Steelman;
6. Oracle;
7. PDF;
8. signing;
9. total.

Do not cherry-pick successful timings.

---

## 19.5 Worker size

Each Worker script must remain below the platform limit with the existing conservative margin.

Architecture target:

**< 2.4 MiB compressed per Worker**

where the hard Free limit is 3 MiB.

---

## 19.6 Trusted runtime memory

Target measured peak:

**< 96 MiB**

maintaining conservative margin below the relevant runtime limit.

---

## 19.7 Output

Complete requested analysis response:

**<= 8 MiB**

Fail closed above the limit.

---

## 19.8 Traffic

Public Worker:

never intentionally design beyond the Free-plan request ceiling.

Application rate:

**5 accepted `POST /analyze` attempts per source IP per Cloudflare location per 60 seconds**

using the Workers Rate Limiting binding.

Do not store IP addresses in application state.

---

## 19.9 Browser Run

Free allowance remains protected by an application guard.

Application ceiling:

**8 browser minutes per UTC day**

below the published 10-minute Free limit.

Keep the final Browser Run queue at `B-PDF-QUEUE-DEPTH`.

Respect the Free Quick Action rate.

No paid overflow.

---

# 20. BROWSER RUN QUOTA GUARD

TrustedRuntime stores only:

```text
utc_date
aggregate_browser_run_ms
```

On UTC-date change:

reset the aggregate.

No scheduled reset job is needed.

Do it lazily on request.

Before consuming AI for a request where the user's desired PDF cannot currently be produced, perform the relevant quota preflight early enough to avoid wasting AI capacity.

If PDF quota is unavailable:

* clearly tell the UI;
* never generate an unsigned substitute.

A valid Oracle dashboard and non-PDF outputs may still be offered if that journey remains valid.

Never call a paid renderer.

---

# 21. PRODUCTION LOGGING AND TELEMETRY

Persistent application logging is not part of Architecture 2.1.

Explicitly disable Cloudflare Workers Logs / persistent application observability for:

* public edge Worker;
* private script defining TrustedRuntime.

Do not rely on provider defaults.

No:

* Tail Worker;
* Logpush;
* Sentry;
* external analytics;
* user-behavior analytics;
* third-party telemetry.

Never log:

* source records;
* prompts;
* model results;
* report bodies;
* filenames;
* PII mapping;
* API keys;
* signing secrets;
* Turnstile token;
* user identifier.

Use local synthetic fixtures for debugging.

Platform-level non-content operational/accounting metadata outside application control must be described honestly on the Trust page.

---

# 22. CONTENT SECURITY

Use a fixed restrictive CSP.

Requirements include:

* same-origin application/static parser assets;
* only the narrow `wasm-unsafe-eval` needed for Pyodide;
* JavaScript `eval` remains blocked;
* no arbitrary remote scripts;
* no third-party fonts;
* only required Cloudflare Turnstile script/frame origins;
* only required Aethelgard API connection origin;
* no model/provider connection from browser.

No source data enters URL/query parameters.

---

# 23. INDEXING AND SCRAPING

Use:

* `robots.txt` disallow;
* page metadata `noindex, nofollow, noarchive`;
* `X-Robots-Tag: noindex, nofollow, noarchive`.

These are best-effort indexing controls.

Do not claim they make public pages impossible to scrape.

The actual analysis endpoint is protected separately by:

* strict routes;
* rate limiting;
* Turnstile.

---

# 24. DOCTOR AND FAULT PROTECTION

## 24.1 Doctor

Implement one deterministic Doctor.

No AI.

Reuse shared invariant definitions where practical.

Doctor supports:

* `npm run doctor`;
* CI checks;
* live `/health`.

Doctor may verify:

* architecture/build version;
* expected routes;
* expected external DO binding;
* private runtime has no public route;
* public edge has zero secrets;
* expected private secret names/bindings exist without reading values;
* signing public-key IDs exist;
* pinned browser asset hashes match;
* pinned ML-DSA build hash matches;
* forbidden packages absent;
* forbidden routes absent;
* forbidden storage absent;
* production logging disabled;
* free-only AI routing configured;
* Browser Run quota guard configured.

Doctor must not call:

* Groq;
* OpenRouter;
* Browser Run

merely to report health.

Doctor stores no user data.

Doctor cannot:

* edit code;
* change architecture;
* change dependencies;
* rotate secrets;
* deploy;
* merge.

Production `/health` returns minimal non-sensitive information.

Do not expose internal secret/configuration detail publicly.

---

## 24.2 No scheduled Doctor dependency

Do not make long-term health depend on a cron job.

No daily AI maintenance task.

No required GitHub scheduled health workflow.

Run Doctor:

* during local development;
* in CI;
* during deployment verification;
* when explicitly invoked.

Frontend may query `/health` when someone visits.

If nobody uses Aethelgard for six months:

nothing should need to run.

---

## 24.3 Technician = deterministic reflexes

Do not create a separate Technician agent.

The "Technician" is the deterministic fault-protection layer.

Approved reflexes:

### Parser failure

```text
parser timeout/crash/allocation failure
-> terminate Worker
-> one fresh Worker attempt
-> Safe Mode
```

### Redactor failure

```text
redactor failure
-> terminate Worker
-> no network analysis request
-> Safe Mode
```

### Groq failure

```text
Groq
-> one OpenRouter Free fallback
```

### Both AI paths fail

```text
Safe Mode
```

### Browser Run unavailable

```text
no PDF
no unsigned substitute
```

### Signing failure

```text
do not present failed PDF as authentic
```

### Cloudflare runtime failure

Rely on platform isolation/restart.

Do not add a second runtime.

### Quota rollover

Reset aggregate by UTC date on request.

No cron.

No autonomous code modification is ever a recovery action.

---

# 25. STATIC PORTFOLIO FALLBACK

Aethelgard must remain demonstrable even when live compute is unavailable.

After the production report pipeline exists, create one synthetic signed sample containing no real user information.

Commit:

* synthetic sample input;
* finished sample dashboard representation;
* final sample PDF;
* detached `.sig.json`.

Label clearly:

> **Sample analysis — pre-generated demonstration**

If live analysis is unavailable, the site must still allow the visitor to:

* understand Aethelgard;
* view the sample analysis;
* inspect the Trust page;
* verify the sample signatures locally.

If Cloudflare Pages itself is unavailable, the public GitHub repository still contains:

* source;
* Trust documentation;
* verification code;
* signed sample.

Do not add another live hosting provider.

---

# 26. CRYPTOGRAPHIC FOUNDATION

Use the proven portable implementation:

`mldsa-native`

Source commit:

`6d661fd1865b38d8612692c52160cf76193785fb`

Use the final integrated reproducible build evidence, including:

* pinned compiler/toolchain;
* pinned build flags;
* official NIST vectors;
* independent cross-verification.

The final integrated ML-DSA-65 Wasm evidence used SHA-256:

`960EA1D9CEB0449F91301CB4168DB83AB1CBA3F0A86FA1BED0515F880B85F802`

Do not silently replace this build with Noble, liboqs, or another library.

Architecture evidence includes all applicable official ML-DSA-65 ACVP test cases previously passed.

Do not claim formal end-to-end constant-time proof.

---

# 27. DETACHED SIGNATURE MANIFEST

The `.sig.json` is exactly Schema `S-SIGNATURE-MANIFEST`. It preserves the
proven Phase 0 field names and base64/hex encodings. Version 1 has no timestamp;
a future timestamp requires a new schema version and an owner-reviewed
compatibility decision.

The PDF may show:

* verification URL/path;
* public key IDs.

Do not place its detached signature inside the bytes being signed.

That creates a circular object.

---

# 28. KEY ROTATION

Do not rotate signing keys merely because a calendar says so.

Rotate signing material only:

* after suspected compromise;
* for owner-approved cryptographic migration;
* during an explicit maintenance release with a concrete reason.

When rotating:

* assign new key IDs;
* publish new public keys;
* retain previous public keys so old reports remain verifiable.

Provider/Turnstile credentials should likewise be rotated on:

* compromise;
* provider requirement;
* explicit owner maintenance action.

Do not create maintenance work merely to look sophisticated.

---

# 29. DEPENDENCY REGISTER

Every runtime dependency must provide a required property.

`ARCHITECTURE.md` approves the dependency identity and required property.
Lockfiles are authoritative for exact npm implementation versions. Pinned
security, cryptographic, and browser binary assets additionally use their
explicit version, commit, and hash manifests. A compatible lockfile update is
not an architecture revision. A new dependency still requires owner-approved
Section 29 registration before use.

Self-host browser runtime assets.

Do not load runtime packages from public CDNs.

## 29.1 Frontend

Approved categories:

* current Next.js static export;
* React;
* TypeScript;
* Tailwind;
* Recharts.

---

## 29.2 Browser processing

Approved:

* Pyodide 314.0.5 / Python 3.14.2;
* pdfminer.six 20260107;
* python-docx 1.2.0;
* python-pptx 1.0.2;
* openpyxl 3.1.5;
* Python standard library CSV;
* Python standard library TXT handling;
* Compromise 14.16.0;
* `franc-min`.

Do not rewrite the proven parser stack merely to save theoretical asset bytes.

---

## 29.3 Trusted runtime

Approved:

* Zod;
* project-owned direct HTTPS AI router;
* tree-shaken `fflate`;
* Cloudflare platform APIs;
* pinned `mldsa-native` Wasm.

No provider SDK is required unless a later owner-approved decision proves direct HTTPS insufficient.

---

## 29.4 Development/security

Use existing justified tooling including:

* GitHub Actions standard public-repository runners;
* CodeQL;
* Dependabot;
* GitHub secret scanning;
* TypeScript checks;
* ESLint;
* Python lint/type checks;
* license audit;
* tests.

No Semgrep requirement.

Do not introduce a new security SaaS.

---

## 29.5 Explicit removals

Remove final architecture requirements/references for:

* Resend;
* UptimeRobot;
* Ollama;
* Semgrep;
* Sentry;
* Google runtime libraries;
* Cloud Run;
* FastAPI server runtime;
* MCP packages;
* BYOK packages;
* OAuth packages;
* JWE packages;
* ClamAV;
* Presidio;
* spaCy;
* ReportLab;
* Matplotlib;
* pandas;
* liboqs;
* Noble post-quantum implementation

if they remain only from superseded work.

Do not leave unused packages for historical comfort.

Git history is the history.

---

# 30. DATA LIFECYCLE

Architecture 2.1 must document this accurately.

| Data                       | Exists where                                                 | Persistence                                 |
| -------------------------- | ------------------------------------------------------------ | ------------------------------------------- |
| Raw source binary          | Browser + disposable parser memory                           | None                                        |
| Unredacted extracted text  | Browser workers                                              | None                                        |
| PII placeholder mapping    | Browser redaction memory                                     | None                                        |
| Redacted source records    | Browser -> edge -> TrustedRuntime -> AI provider             | Request only                                |
| Turnstile token            | Browser -> edge -> TrustedRuntime -> Cloudflare Siteverify   | Request only                                |
| AI results                 | TrustedRuntime request memory                                | None                                        |
| Service-owned report model | TrustedRuntime request memory                                | None                                        |
| Report HTML                | TrustedRuntime -> Browser Run                                | Request only                                |
| PDF/XLSX/text              | TrustedRuntime -> edge -> browser memory                     | None                                        |
| Signing private material   | TrustedRuntime Cloudflare secrets + temporary signing memory | Secret persists; working material temporary |
| Public verification keys   | Repository + Pages                                           | Persistent by design                        |
| Browser Run quota state    | TrustedRuntime DO storage                                    | UTC date + aggregate milliseconds only      |
| Static sample              | Repository + Pages                                           | Persistent synthetic public artifact        |

No report history.

No user record.

No document record.

---

# 31. HONEST SECURITY CLAIMS

Do not claim:

* unhackable;
* zero-risk;
* malware-scanned;
* universal PII accuracy;
* multilingual protection;
* independently proven formal browser sandbox;
* formal end-to-end constant-time ML-DSA runtime;
* that no provider ever produces operational metadata;
* that `robots.txt` prevents malicious scraping;
* protection against a compromised user's OS/browser/privileged extension.

State exactly what is tested.

A compromised endpoint is outside the web application's guarantee.

---

# 32. REPOSITORY HYGIENE — MUST HAPPEN FIRST

Do this before Architecture 2.1 promotion and before Phase 0 code.

Do not rewrite Git history.

Git history is the archive.

---

## 32.1 First inspect

Before deleting anything:

* inspect current branch;
* inspect `git status`;
* inspect tracked/untracked project files;
* inspect current dependency manifests;
* verify the files below actually exist;
* identify security fixtures that must survive;
* identify any unknown user-authored files.

Do not delete an unknown user file merely because it is not listed.

---

## 32.2 Keep

Keep:

* `ARCHITECTURE.md`;
* `AGENTS.md`;
* `README.md`;
* `BUILD_LOG.md`;
* project license if present;
* `docs/EDR_BROWSER_LOCAL_TRUST_BOUNDARY.md`;
* actual source;
* active configurations;
* active tests;
* frozen PII corpus;
* hostile-file/security regression fixtures.

Move the frozen PII corpus to:

`tests/fixtures/pii-corpus.mjs`

without modifying contents.

Verify SHA-256 remains:

`0c777c5fc3300eb0b00a29cf583b23ea6455a12a43d990531b88990d1d679467`

Place hostile-file fixtures in a clear active location such as:

`tests/fixtures/hostile/`

if relocation is needed.

Preserve their contents.

---

## 32.3 Remove superseded analysis/review files

After their accepted conclusions are represented by final `ARCHITECTURE.md`, the approved EDR and compact build log, remove obsolete current-tree research documents including, when present:

* `docs/ZERO_COST_FEASIBILITY.md`
* `docs/PHASE_MINUS_1A_FEASIBILITY.md`
* `docs/PHASE_MINUS_1B_FEASIBILITY.md`
* `docs/PHASE_MINUS_1C_FEASIBILITY.md`
* `docs/PHASE_MINUS_1D_CLOSURE.md`
* `docs/PHASE_MINUS_1D_ZERO_COST_CHECKLIST.md`
* `docs/PROPOSED_EDR_BROWSER_LOCAL_TRUST_BOUNDARY.md`
* `docs/PROPOSED_ARCHITECTURE_V2_1.md`
* `docs/ARCHITECTURE_MINIMISATION_PROOF.md`
* obsolete handoff files;
* obsolete proposed architecture copies;
* disposable proof summaries whose final conclusions are already encoded elsewhere.

Do not create:

`archive/`

Git already provides the archive.

Delete disposable:

* generated bundles;
* browser profiles;
* old PDFs;
* temporary keys;
* proof logs;
* build-cache directories

only when they are not required active fixtures or final public artifacts.

---

## 32.4 Old branch/PR hygiene

Do not merge obsolete Architecture-2.0 bootstrap work merely to preserve it.

If an old draft PR is clearly superseded:

* preserve any genuinely still-valid source required by the final design;
* close the obsolete PR as superseded.

Do not force-rewrite protected `main`.

---

# 33. BUILD_LOG HYGIENE

Rewrite `BUILD_LOG.md` into a concise engineering status record.

It must not remain a command-by-command research diary.

Git history retains the long history.

At the top use:

## Current State

* Architecture: 2.1 after promotion
* Phase -1: CLOSED
* Current implementation phase: Phase N as recorded by current work
* Current task/phase status: exact PASS / IN PROGRESS / BLOCKED state
* Exact-zero account gate: PASSED
* Browser-local trust-boundary EDR: APPROVED
* Frozen PII baseline: APPROVED
* Trusted PDF + hybrid signing feasibility: PASSED
* External Durable Object direct binding: PASSED
* Architecture research: CLOSED
* Production 2.1 implementation: NOT COMPLETE until actually complete

Keep milestone summaries only:

1. initial bootstrap/security;
2. Architecture 2.0 and superseded Google path;
3. exact-zero pivot;
4. server-side Cloudflare Python rejection;
5. browser-local parsing/redaction proof;
6. approved EDR and PII baseline;
7. Browser Run exact-PDF/hybrid-signing proof;
8. direct external Durable Object minimisation proof;
9. final Architecture 2.1 promotion;
10. current phase/task progress.

Keep essential:

* hashes;
* acceptance numbers;
* security decisions;
* phase outcomes.

Remove:

* disposable CLI transcripts;
* temporary migration detail;
* discarded package-size tables;
* obsolete phase sequencing;
* old operational instructions;
* repeated "production frozen" prose after the final history summary.

For each future task, add only concise evidence.

Do not paste raw terminal output into the build log unless a short exact value is required as evidence.

---

# 34. FINAL ARCHITECTURE PROMOTION

After repository hygiene:

Update `ARCHITECTURE.md` directly.

Do not create another:

`PROPOSED_ARCHITECTURE...`

file.

Set:

* specification version: **2.1**
* date: **2026-08-28**
* status: **Approved for build**

Use this handoff as the final owner-approved architecture delta.

Update `AGENTS.md` only where necessary to remove old:

* Cloud Run;
* FastAPI;
* Pydantic trusted-runtime;
* Google;
* email;
* BYOK;
* old phase

rules and align it with final 2.1.

Compute and record the new exact SHA-256 of `ARCHITECTURE.md`.

---

# 35. ENGINEERING DECISION RECORD

Historical decisions remain visible. **Superseded** means that the reason is
preserved but Architecture 2.1 no longer follows that target.

| # | Status | Decision | Reason and rejected alternative |
|---|---|---|---|
| 1 | Active, revised | No database for user data | Removes persistence and breach value. The anonymous Browser Run UTC-date and aggregate-millisecond record is not user data. Reject a user, document, report, job, or token database. |
| 2 | Superseded by 20 | Python, FastAPI, and Cloud Run backend | Python had the strongest server parser ecosystem, but the exact-zero and trust-boundary review rejected server-side document processing. |
| 3 | Active | Cloudflare Pages primary | Keeps static hosting with the edge provider at no cost. Reject adding a second live host. |
| 4 | Active, revised | Cloudflare edge security and hybrid TLS | Managed TLS, Turnstile, route controls, and rate limiting avoid custom security machinery. The edge is now literally secret-free. |
| 5 | Active | Project-owned direct HTTPS model router | Groq and OpenRouter need one small common interface. Reject LiteLLM and provider SDKs that add no required property. |
| 6 | Superseded by 23 | ReportLab server PDF | Pure Python avoided native PDF dependencies, but no server Python remains. Browser Run now creates service-owned exact PDF bytes. |
| 7 | Superseded by 22 | ClamAV as a secondary defence | Known-signature scanning was defence in depth for a server upload boundary. That boundary is removed rather than replaced with a weaker scanner claim. |
| 8 | Active, revised by 31 | Strawman, Steelman, Oracle analysis | Structured critique is the core agentic value. Architecture 2.1 keeps exactly these three stages. |
| 9 | Superseded by 31 | Router chooses specialist agents | Deterministic user focus plus one Strawman call provides the required lenses with fewer calls and less failure surface. |
| 10 | Active, revised | Deterministic extraction, charts, rendering, and signing | Fixed work belongs in checked code. These operations now run in the browser or trusted TypeScript runtime. |
| 11 | Active | No chat in the core mission | Chat needs session state and does not serve the open-analyze-download mission. It is now out of scope, not deferred. |
| 12 | Active, revised by 32 | Deterministic health checks; human-approved changes | Low-attention operation comes from Doctor and fixed fault reflexes. Reject autonomous code changes. |
| 13 | Superseded by 25 | Expiring first-use download tokens | Stateless code cannot prove first use. Direct in-memory delivery removes the route, token, and contradiction. |
| 14 | Active | Fraunces, Public Sans, terracotta, and warm off-white | Preserves the premium editorial identity and rejects generic AI-tool styling. |
| 15 | Active | Keep the Aethelgard working name | Renaming adds no architectural value. |
| 16 | Active, revised | Keep free `pages.dev` and `workers.dev` routes | A custom domain adds cost. Turnstile and the Workers Rate Limiting binding provide the approved edge controls. |
| 17 | Superseded by 27 | GitHub OIDC and Google WIF | This was the least-privilege Google design, but Google is no longer a target runtime or deployment dependency. |
| 18 | Superseded by 19 | Native-currency Google budget | A budget alert does not prevent charges. The target now has no Google runtime and no charge path. |
| 19 | Active | Exact-zero means no charge path | GBP 0.00 and USD 0.00 are binding. Free quota exhaustion fails closed; reject paid overflow, auto top-up, or a small budget. |
| 20 | Active | Browser-local validation, parsing, language gate, and redaction | Keeps source bytes, unredacted text, and PII mappings off the network. Reject server parsing and remote language detection. |
| 21 | Active | Deterministic PII rules plus local Compromise NER and frozen corpus | Provides an explainable English-context regression baseline without Presidio or spaCy. Reject universal accuracy claims. |
| 22 | Active | Approved browser-local ClamAV trust-boundary EDR | Remove ClamAV because server binary upload and parsing are gone. Automatically reopen the decision if source bytes ever leave the browser. |
| 23 | Active | Secret-free edge directly bound to external `TrustedRuntime` Durable Object | The disposable proof preserved private secrets, Browser Run, signing, quota state, local development, and Durable Object execution without a Service Binding dispatcher. |
| 24 | Active | Detached SHA-256, Ed25519, and ML-DSA-65 signatures over exact final PDF bytes | Both signatures cover the same exact PDF digest. Reject circular in-PDF signatures, unsigned substitutes, caller signing input, and unpinned cryptography. |
| 25 | Active | Direct in-memory browser delivery | Removes result storage, result routes, sessions, tokens, and false first-use claims. |
| 26 | Active | Desktop Chrome and Edge, English text only, no OCR | This matches the tested browser and English-context PII evidence. Unsupported, uncertain, scanned, or resource-constrained inputs fail locally. |
| 27 | Active | Portfolio-minimal feature surface | Remove BYOK, email, accounts, Resend, Sentry, UptimeRobot, MCP, Google runtime, and other non-mission features. The portfolio does not need SaaS-scale availability or credential handling. |
| 28 | Active | Zod schema-first TypeScript trusted runtime | One runtime schema validates public, internal, and AI data. Pydantic does not belong in the non-Python trusted runtime. |
| 29 | Active | Minimal XLSX OOXML writer with tree-shaken `fflate` | Keeps optional spreadsheet output without server Python or a large workbook framework. Excel and LibreOffice compatibility is a release gate. |
| 30 | Active | One anonymous Browser Run quota counter | A UTC date and aggregate milliseconds enforce the eight-minute application ceiling without user or job state. Reject relying only on the final platform limit. |
| 31 | Active | Deterministic focus and exactly three AI stages | One focus enum plus Strawman, Steelman, and Oracle preserves the reasoning method while reducing quota use and failures. Normal success is exactly three model calls. |
| 32 | Active | Deterministic Doctor and fault reflexes | Known checks and bounded recovery paths provide low-attention operation. Reject a Technician AI or self-modifying repair. |
| 33 | Active | Static signed portfolio sample | Keeps the portfolio demonstrable during live quota or provider failure without another runtime or host. |
| 34 | Active | Persistent application logs disabled | Supports the no-copy privacy goal and removes another data processor. Use synthetic local fixtures and minimal public health output. |
| 35 | Active | Turnstile Siteverify inside `TrustedRuntime` | Verification requires a secret. The existing private runtime preserves a genuinely secret-free edge without a new component. |
| 36 | Active | Sequential one-task and one-phase governance | Prevents architecture drift, speculative scaffolding, and partially verified implementation. Every task has a signed logical commit and every phase stops at review. |
| 37 | Active | Architecture 2.1 execution hardening | Canonical task contracts and Bounds, Schema, and Failure registries make implementation deterministic without changing topology, mission, privacy, cost, providers, or cryptography. Reject repeated architecture inference during implementation. |
| 38 | Active | Task 1.10 normalized-score margin correction | Interpret `francAll` tuple values as normalized scores and require English to lead the runner-up by at least 2,000 integer basis points. Reject the incompatible distance terminology and subtraction order. |

Detailed active EDR artifacts are
`docs/EDR_BROWSER_LOCAL_TRUST_BOUNDARY.md` and
`docs/EDR_ARCHITECTURE_EXECUTION_HARDENING.md`, and
`docs/EDR_LANGUAGE_SCORE_MARGIN.md`.

---

# 36. PREPARATION GATE — BEFORE PHASE 0

Repository cleanup and final Architecture 2.1 promotion are a prerequisite gate.

They are **not Phase 0 implementation**.

Use one reviewable preparation branch.

Suggested:

`chore/final-architecture-2.1`

Perform one logical task at a time:

### Gate Task A1 — inventory

* inspect current repository;
* identify retained fixtures;
* identify superseded docs;
* record no destructive action yet.

### Gate Task A2 — repository hygiene

* move active fixtures;
* delete only approved obsolete files;
* clean generated debris;
* update `.gitignore` if required.

Verify fixture hashes.

Commit logically.

### Gate Task A3 — compact BUILD_LOG

Apply Section 33.

Commit logically.

### Gate Task A4 — promote Architecture 2.1

* update `ARCHITECTURE.md`;
* add/update EDR;
* update `AGENTS.md`;
* resolve all obsolete references;
* validate Markdown links/tables;
* compute architecture SHA-256.

Commit logically.

### Gate Task A5 — preparation verification

Verify:

* no proposed architecture file is still treated as authority;
* no active documentation requires removed services;
* no BYOK/email/UptimeRobot/Sentry/Google runtime remains in target architecture;
* EDR path exists;
* PII fixture hash matches;
* build log is concise;
* `ARCHITECTURE.md` is internally consistent;
* `AGENTS.md` agrees with it.

Open one preparation PR.

Do not bypass protected `main`.

The owner has already approved the **content** of this final architecture.

Repository review/merge still occurs normally.

After the preparation PR is merged into protected `main`, Phase 0 may begin without reopening architecture review.

If the preparation PR has not yet been merged:

do not branch Phase 0 from stale pre-promotion `main`.

---

# 37. STRICT SEQUENTIAL BUILD PROTOCOL

Aethelgard is built:

> **one phase at a time; inside each phase, one task at a time.**

Only one task is active.

Only one phase is active.

Never build multiple phases concurrently.

Never implement a later-phase feature early because it is convenient.

Never create speculative future scaffolding unless the current task cannot function without it.

---

## 37.1 Task cycle

For every task:

1. state the exact current task;
2. inspect only relevant current code/architecture;
3. implement only that task;
4. run the smallest relevant tests;
5. fix normal implementation errors inside 2.1;
6. rerun until the task passes;
7. verify the task added:

   * no unrelated feature;
   * no unapproved dependency;
   * no paid path;
   * no privacy regression;
   * no security weakening;
   * no unexpected storage;
   * no architecture drift;
8. clean disposable task artifacts;
9. record concise evidence in `BUILD_LOG.md`;
10. create one logical signed commit;
11. only then start the next task in the same phase.

Do not ask the owner for routine permission between tasks already authorized within a phase.

---

## 37.2 Commit signing

Do not disable the repository's signed-commit requirement.

If signing is configured:

sign every task commit.

If the environment genuinely cannot create the required signed commit:

stop and report that repository-control blocker.

Do not weaken branch protection.

---

## 37.3 Failed task rule

If a task fails:

### First

Determine whether it is an implementation defect.

If yes:

fix and retest.

### If not

If **no implementation conforming to Architecture 2.1** can satisfy the task:

STOP.

Report:

* exact task;
* failing invariant;
* evidence;
* why implementation-level fixes cannot satisfy both.

Do not:

* start new feasibility research;
* survey alternatives;
* add another service;
* weaken a requirement.

Ask the owner for an architecture decision only at that point.

---

# 38. TESTING DISCIPLINE

Tests prove implementation.

They do not create analysis paralysis.

## After each task

Run:

* tests directly relevant to the task;
* immediately affected regressions;
* relevant type/lint/security checks.

Do not run every expensive release test after every small change.

---

## At phase exit

Run:

* complete tests for the active phase;
* regressions for every completed earlier phase;
* relevant security checks;
* relevant privacy checks;
* exact-zero checks;
* architecture compliance;
* relevant performance/resource gates.

---

## Before final production release

Run the complete Voyager Verification Suite.

Do not rerun old feasibility experiments whose architecture questions are closed unless release code changes the exact property previously proved.

---

# 39. GIT / PHASE WORKFLOW

Use one implementation branch per phase.

Example:

`phase/0-foundation`

Inside a phase:

* one logical commit per task;
* no unrelated modifications;
* no future-phase work.

At successful phase completion:

* open/update one phase PR;
* include phase-exit evidence;
* stop.

Protected `main` is never directly bypassed.

Human review happens before merge.

After Phase N is merged and verified, the next phase branch is created **only after owner authorization**.

---

# 40. PHASE 0 — FOUNDATION

This historical foundation phase is implemented only when owner-authorized.

Goal:

> Establish the smallest trusted runtime, security boundary, signing chain, health machinery and zero-cost deployment skeleton before document or AI features.

Implement one task at a time in this order unless an ordinary dependency between adjacent tasks requires a minor ordering adjustment.

Do not combine unfinished tasks.

---

## Task 0.1 — Clean implementation baseline

From final Architecture 2.1 `main`:

* create `phase/0-foundation`;
* inspect current manifests;
* remove obsolete runtime dependencies that belong only to rejected Architecture 2.0 components;
* preserve active frontend source that conforms to 2.1;
* align root scripts/tooling with the final architecture;
* ensure build/typecheck baseline passes.

Do not add document parsing or AI features.

PASS before Task 0.2.

---

## Task 0.2 — Static shell and design-token foundation

Implement only the static Pages foundation required for later work.

Include:

* valid `lang="en"`;
* shared typed visual tokens;
* approved Fraunces/Public Sans setup;
* warm off-white / charcoal / terracotta base;
* architectural layout/grid primitives;
* no generic SaaS decoration;
* no dashboard implementation yet;
* no parser;
* no AI.

Static build/export must pass.

Check initial JS budget.

PASS before Task 0.3.

---

## Task 0.3 — Secret-free public edge

Implement:

* `GET /health`;
* `POST /analyze`;
* method allow-list;
* origin allow-list;
* content-type bound;
* bounded body size;
* Workers Rate Limiting;
* security headers;
* no-index response headers where relevant;
* fixed safe errors.

The edge must have **zero secrets**.

It does not verify Turnstile itself.

No parser.

No AI key.

No signing secret.

No Browser Run binding.

PASS relevant edge tests.

---

## Task 0.4 — Private TrustedRuntime and direct external Durable Object binding

Implement:

* separate private defining script;
* `TrustedRuntime` Durable Object;
* `workers_dev = false`;
* preview URLs disabled;
* no public target;
* public edge external DO binding via `script_name`;
* no Service Binding dispatcher;
* no shared edge/runtime secret.

Prove direct invocation works.

Prove runtime has no public URL.

PASS before Task 0.5.

---

## Task 0.5 — Turnstile trust placement

Implement:

* public Turnstile site key in frontend;
* token included in analysis envelope;
* `TURNSTILE_SECRET` available only to TrustedRuntime;
* Siteverify from TrustedRuntime;
* expected `action`;
* expected production hostname;
* token bound;
* failure before any expensive work;
* fresh token/reset after attempt.

Use official Turnstile test credentials for automated/local testing.

Do not expose the production secret.

PASS:

* valid test token;
* invalid;
* expired/replayed behavior where test environment permits;
* wrong action;
* wrong hostname;
* missing token;
* oversized token.

---

## Task 0.6 — Doctor and production no-logging configuration

Implement:

* shared deterministic invariant module;
* `npm run doctor`;
* `/health` use of safe invariant checks;
* production observability disabled;
* no sensitive logging;
* no third-party monitoring.

Doctor consumes no AI or Browser Run quota.

PASS before Task 0.7.

---

## Task 0.7 — Browser Run foundation and aggregate quota guard

Implement:

* private Browser Run binding;
* fixed service-owned synthetic HTML fixture;
* `/pdf` Quick Action;
* output PDF magic/size validation;
* UTC date + aggregate Browser Run ms storage only;
* eight-minute application ceiling;
* bounded final-PDF queue;
* fail-closed quota behavior.

Do not implement real report rendering yet.

PASS with synthetic fixture.

---

## Task 0.8 — Hybrid signing foundation

Implement:

* reproducible pinned `mldsa-native`;
* final expected build hash check;
* SHA-256;
* Ed25519;
* ML-DSA-65;
* detached manifest;
* changed-byte rejection;
* no public signer;
* no caller HTML/PDF/hash.

Build the production key-generation script now.

Resolve the old architecture phase-order problem permanently.

Use disposable keys in tests.

Production secret generation/upload occurs only through the approved reviewed process.

PASS:

* NIST vectors;
* cross-verification;
* exact-byte integration;
* changed byte rejected by both.

---

## Task 0.9 — CI and supply-chain gate

Configure only approved zero-cost GitHub-native CI.

Use standard public-repository runners.

No paid runner.

No uploaded CI artifact/cache unless explicitly proven zero-cost and later approved; default is no artifact/cache.

Run:

* build;
* TypeScript;
* Python checks where relevant;
* tests;
* CodeQL;
* Dependabot configuration;
* secret scanning;
* dependency/license checks.

Warnings fail.

PASS before Task 0.10.

---

## Task 0.10 — Phase 0 deployed verification

After code review/merge according to repository protections, perform the required non-destructive Free-plan deployment verification.

Verify:

```text
Pages
-> secret-free edge
-> external TrustedRuntime DO
-> Turnstile verification
-> Browser Run fixed report
-> exact PDF bytes
-> SHA-256
-> Ed25519
-> ML-DSA-65
-> independent verification
```

Verify:

* changed byte fails both signatures;
* public edge has zero secrets;
* private script has no public target;
* no `/sign`;
* no caller PDF/HTML/hash;
* production persistent application logging disabled;
* no user-data storage;
* no paid fallback;
* runtime CPU/memory/bundle margins;
* Browser Run guard.

---

## Task 0.11 — Migrate required secrets and retire obsolete target infrastructure safely

Do not delete the last working copy of a required secret before replacement is verified.

Required final private-runtime secrets:

* Turnstile;
* Groq;
* OpenRouter;
* Ed25519;
* ML-DSA-65.

Once the final Cloudflare secret locations are verified:

* revoke obsolete Groq/OpenRouter copies from superseded Google path;
* revoke obsolete Resend credential;
* remove obsolete Sentry Aethelgard configuration;
* remove obsolete GCP deployment variables/secrets;
* remove obsolete generic `ENCRYPTION_KEY` if no final purpose exists;
* retire Aethelgard's superseded Google runtime/IAM/WIF/Secret Manager resources.

Do not delete unrelated owner resources.

Destructive external resource removal must follow normal owner review/authorization.

The target after retirement is operational dependence only on:

* Cloudflare;
* Groq;
* OpenRouter;
* GitHub.

---

# 41. PHASE 0 EXIT GATE

Stop feature work.

Run the complete Phase 0 gate.

PASS requires:

* final Architecture 2.1 is authoritative;
* repository hygiene complete;
* build log concise;
* Pages shell works;
* Scandinavian design-token foundation exists;
* public edge is secret-free;
* only named routes exist;
* TrustedRuntime direct external binding works;
* private runtime has no public route;
* Turnstile verification occurs inside TrustedRuntime;
* Browser Run synthetic PDF works;
* quota guard works;
* exact bytes are hashed;
* Ed25519 works;
* ML-DSA-65 works;
* both independently verify;
* one changed byte breaks both;
* public arbitrary signing inputs are impossible;
* Doctor passes;
* production application logging is disabled;
* CI/security checks pass;
* bundle/CPU/memory limits pass;
* exact-zero policy passes;
* no forbidden storage exists;
* no Phase 1 functionality was implemented early.

Return exactly one status:

`PHASE 0 — PASS`

or

`PHASE 0 — BLOCKED`

If PASS, report concisely:

* tasks completed;
* tests;
* important measurements;
* security/privacy state;
* zero-cost state;
* dependency changes;
* repository state;
* current commit/PR;
* any remaining human-only resource action.

Then STOP.

Ask:

> **Phase 0 is complete and verified. Do you approve starting Phase 1?**

Do not implement Phase 1 before the answer.

---

# 42. PHASE 1 — CORE MISSION

Implement only after explicit owner authorization. Tasks are binding and
sequential. Each task uses the registries in Sections 53–55.

## Task 1.1 — Browser input contract and early file bound
Purpose: Accept one supported local file before parser preparation.
Preconditions: Phase 0 exit passed and Phase 1 is owner-authorized.
Allowed scope: Browser selection types, validation, UI message, and tests.
Inputs: One browser `FileList` or readonly `File[]`.
Outputs: Schema `S-BROWSER-INPUT-RESULT`.
Required behavior: Accept exactly one non-empty supported file; apply size before extension handling; keep filename local.
Bounds: `B-SOURCE-BYTES`, `B-LOCAL-FILENAME-CHARS`, `B-SELECTION-COUNT`.
Schemas: `S-BROWSER-INPUT-RESULT`.
Failures: `F-UNSUPPORTED-FORMAT`, `F-OVERSIZED-DOCUMENT`, `F-INVALID-DOCUMENT`.
Forbidden: Network, persistence, parsing, filename egress, or future scaffold.
PASS: Exact/over boundaries, six extensions, empty/multiple/name/unsupported cases and affected checks pass.

## Task 1.2 — Hostile-container prevalidation
Purpose: Reject unsafe or inconsistent content before normal parsing.
Preconditions: Task 1.1 passed.
Allowed scope: Byte, ZIP/XML/Office/PDF preflight, disposable Worker, fixtures, tests.
Inputs: Accepted local bytes and declared format.
Outputs: Schema `S-PREFLIGHT-RESULT` with neutral metrics only.
Required behavior: Enforce Section 12.1, magic/extension agreement, every ZIP entry, and buffer wiping.
Bounds: `B-SOURCE-BYTES`, `B-ARCHIVE-ENTRIES`, `B-ARCHIVE-TOTAL-BYTES`, `B-ARCHIVE-ENTRY-BYTES`, `B-ARCHIVE-RATIO`, `B-ARCHIVE-PATH-BYTES`, `B-INFLATE-CHUNKS`, `B-PREFLIGHT-TIMEOUT-MS`.
Schemas: `S-PREFLIGHT-RESULT`.
Failures: `F-INVALID-DOCUMENT`, `F-HOSTILE-DOCUMENT`, `F-PARSER-TIMEOUT`.
Forbidden: Extraction, upload, partial acceptance, or persistence.
PASS: Frozen hostile/boundary fixtures pass in Chrome/Edge; all Section 12.1 hostile classes fail closed.

## Task 1.3 — PDF parser
Purpose: Extract source-referenced text from validated digital-text PDF.
Preconditions: Task 1.2 passed.
Allowed scope: Pinned Pyodide/pdfminer assets, PDF adapter, disposable Worker, fixtures, browser proof.
Inputs: Schema `S-PARSER-REQUEST` with format `pdf`.
Outputs: Schema `S-PARSER-RESULT` with ordered PDF-page references.
Required behavior: Use pdfminer.six directly; preserve page order; reject encrypted, malformed, empty/image-only, and over-bound results; terminate/wipe each attempt.
Bounds: `B-PARSER-TIMEOUT-MS`, `B-PARSER-RETRY-COUNT`, `B-PDF-PAGES`, `B-PARSER-STRUCTURAL-UNITS`, `B-SOURCE-TEXT-CHARS`, `B-DOCUMENT-TEXT-CHARS`, `B-PARSER-RESULT-BYTES`.
Schemas: `S-PARSER-REQUEST`, `S-PARSER-RESULT`, `S-SOURCE-REFERENCE`.
Failures: `F-PARSER-CRASH`, `F-PARSER-TIMEOUT`, `F-PARSER-ALLOCATION`, `F-INVALID-DOCUMENT`.
Forbidden: Unsupported runtime debugging, server parsing, CDN, OCR, network fallback, Worker reuse.
PASS: Pinned assets pass clean Chrome/Edge module-Worker text/page proof; invalid cases fail; zero external request/storage; hashes and fresh-Worker recovery pass.

## Task 1.4 — DOCX parser
Purpose: Extract ordered paragraph and table-cell text from validated DOCX.
Preconditions: Task 1.3 passed.
Allowed scope: Pinned python-docx/lxml assets, adapter, fixtures, browser proof.
Inputs: Schema `S-PARSER-REQUEST` with format `docx`.
Outputs: Schema `S-PARSER-RESULT` with paragraph/table-cell references.
Required behavior: Use python-docx directly; preserve document order; expose no filename, target, author, or metadata.
Bounds: `B-PARSER-TIMEOUT-MS`, `B-PARSER-RETRY-COUNT`, `B-DOCX-PARAGRAPHS`, `B-DOCX-TABLES`, `B-DOCX-ROWS`, `B-DOCX-COLUMNS`, `B-PARSER-STRUCTURAL-UNITS`, `B-SOURCE-TEXT-CHARS`, `B-DOCUMENT-TEXT-CHARS`.
Schemas: `S-PARSER-REQUEST`, `S-PARSER-RESULT`, `S-SOURCE-REFERENCE`.
Failures: `F-PARSER-CRASH`, `F-PARSER-TIMEOUT`, `F-PARSER-ALLOCATION`, `F-INVALID-DOCUMENT`.
Forbidden: Server parsing, external content, macros, embedded content, metadata egress.
PASS: Ordering/references, hostile/malformed, hashes, no-network, disposal, Chrome/Edge and affected checks pass.

## Task 1.5 — PPTX parser
Purpose: Extract ordered slide text and tables from validated PPTX.
Preconditions: Task 1.4 passed.
Allowed scope: Pinned python-pptx, proven safe pruning, adapter, fixtures, browser proof.
Inputs: Schema `S-PARSER-REQUEST` with format `pptx`.
Outputs: Schema `S-PARSER-RESULT` with slide references.
Required behavior: Use python-pptx directly; preserve slide text/table order; keep Pillow/XlsxWriter absent.
Bounds: `B-PARSER-TIMEOUT-MS`, `B-PARSER-RETRY-COUNT`, `B-PPTX-SLIDES`, `B-PPTX-SHAPES`, `B-PPTX-TABLE-CELLS`, `B-SOURCE-TEXT-CHARS`, `B-DOCUMENT-TEXT-CHARS`.
Schemas: `S-PARSER-REQUEST`, `S-PARSER-RESULT`, `S-SOURCE-REFERENCE`.
Failures: `F-PARSER-CRASH`, `F-PARSER-TIMEOUT`, `F-PARSER-ALLOCATION`, `F-HOSTILE-DOCUMENT`.
Forbidden: Image decoding, macros, embedded/external content, server parsing, unsafe pruning.
PASS: Real text/table/image fixture, forbidden-package absence, hostile cases, hashes, no-network, Chrome/Edge and checks pass.

## Task 1.6 — XLSX parser
Purpose: Extract inert cell values with neutral worksheet references.
Preconditions: Task 1.5 passed.
Allowed scope: Pinned openpyxl/et_xmlfile, adapter, fixtures, browser proof.
Inputs: Schema `S-PARSER-REQUEST` with format `xlsx`.
Outputs: Schema `S-PARSER-RESULT` with sheet index and A1 cell reference.
Required behavior: Use read-only mode, disable external links, keep formulas inert, never expose sheet names.
Bounds: `B-PARSER-TIMEOUT-MS`, `B-PARSER-RETRY-COUNT`, `B-XLSX-SHEETS`, `B-XLSX-ROWS`, `B-XLSX-COLUMNS`, `B-XLSX-VISITED-CELLS`, `B-SOURCE-RECORDS`, `B-SOURCE-TEXT-CHARS`, `B-DOCUMENT-TEXT-CHARS`.
Schemas: `S-PARSER-REQUEST`, `S-PARSER-RESULT`, `S-SOURCE-REFERENCE`.
Failures: `F-PARSER-CRASH`, `F-PARSER-TIMEOUT`, `F-PARSER-ALLOCATION`, `F-HOSTILE-DOCUMENT`.
Forbidden: Formula evaluation, external retrieval, sheet-name egress, pandas, server parsing.
PASS: Values/formulas/references, malicious/invalid cases, hashes, no-network, disposal, Chrome/Edge and checks pass.

## Task 1.7 — CSV and TXT parsers
Purpose: Extract referenced UTF-8 text with Python standard library only.
Preconditions: Task 1.6 passed.
Allowed scope: CSV/TXT adapters, dispatch, fixtures, browser proof.
Inputs: Schema `S-PARSER-REQUEST` with format `csv` or `txt`.
Outputs: Schema `S-PARSER-RESULT` with row/column or line-range references.
Required behavior: Strict UTF-8 with optional BOM; strict comma CSV including multiline fields; inert formulas; physical TXT line numbers.
Bounds: `B-PARSER-TIMEOUT-MS`, `B-PARSER-RETRY-COUNT`, `B-CSV-ROWS`, `B-CSV-COLUMNS`, `B-SOURCE-RECORDS`, `B-SOURCE-TEXT-CHARS`, `B-DOCUMENT-TEXT-CHARS`.
Schemas: `S-PARSER-REQUEST`, `S-PARSER-RESULT`, `S-SOURCE-REFERENCE`.
Failures: `F-PARSER-CRASH`, `F-PARSER-TIMEOUT`, `F-PARSER-ALLOCATION`, `F-INVALID-DOCUMENT`.
Forbidden: Encoding guesses, pandas, formula execution, upload, CDN, persistence.
PASS: BOM/multiline/blank-line/formula/malformed/bounds/hashes/no-network/disposal Chrome/Edge proofs pass.

## Task 1.8 — Source-reference normalization
Purpose: Convert all parser results into one deterministic local record form.
Preconditions: Task 1.7 passed.
Allowed scope: Local normalization types/functions and six-format tests.
Inputs: Valid Schema `S-PARSER-RESULT`.
Outputs: Ordered readonly Schema `S-NORMALIZED-SOURCE-RECORD` array.
Required behavior: Preserve content/order; emit exact neutral references; reject gaps, duplicates, invalid indices, unknown fields, bounds.
Bounds: `B-SOURCE-RECORDS`, `B-SOURCE-TEXT-CHARS`, `B-SOURCE-REFERENCE-CHARS`, `B-DOCUMENT-TEXT-CHARS`.
Schemas: `S-PARSER-RESULT`, `S-SOURCE-REFERENCE`, `S-NORMALIZED-SOURCE-RECORD`.
Failures: `F-INVALID-DOCUMENT`.
Forbidden: Filenames, sheet names, metadata, mutation, network, storage.
PASS: Six-format goldens are exact/stable; invalid, unknown and over-bound cases fail; checks pass.

## Task 1.9 — 8,000-word enforcement
Purpose: Reject normalized text above the mission limit.
Preconditions: Task 1.8 passed.
Allowed scope: Local Unicode word counter, fixtures, UI failure mapping.
Inputs: Ordered Schema `S-NORMALIZED-SOURCE-RECORD` array.
Outputs: Same records plus integer `word_count`, or Safe Mode.
Required behavior: Count Unicode letter/number runs across records; accept 8,000; reject 8,001 before redaction/network; never truncate.
Bounds: `B-EXTRACTED-WORDS`, `B-SOURCE-RECORDS`, `B-DOCUMENT-TEXT-CHARS`.
Schemas: `S-NORMALIZED-SOURCE-RECORD`, `S-SAFE-MODE`.
Failures: `F-OVERSIZED-DOCUMENT`.
Forbidden: Truncation, online service, persistence, partial analysis.
PASS: 0/1/7,999/8,000/8,001 Unicode counts are exact; over-bound makes zero network request.

## Task 1.10 — English-language gate
Purpose: Admit only clearly English content locally.
Preconditions: Task 1.9 passed.
Allowed scope: Pinned offline franc-min adapter and frozen fixtures.
Inputs: Word-bounded normalized content.
Outputs: Schema `S-LANGUAGE-DECISION`.
Required behavior: Apply exact Section 5.3 rule before redaction/network.
Bounds: `B-LANGUAGE-MIN-LETTERS`, `B-LANGUAGE-MIN-TOKENS`, `B-LANGUAGE-MARGIN`, `B-LANGUAGE-SAMPLE-CHARS`.
Schemas: `S-LANGUAGE-DECISION`, `S-SAFE-MODE`.
Failures: `F-UNSUPPORTED-LANGUAGE`.
Forbidden: Online detection, translation, multilingual model, guessed acceptance, persistence.
PASS: Frozen English/international-name cases pass; non-English/mixed/tied/short cases fail locally in Chrome/Edge.

## Task 1.11 — Redaction Worker
Purpose: Replace supported PII locally and retain a browser-only mapping.
Preconditions: Task 1.10 passed.
Allowed scope: Disposable Redaction Worker, deterministic/context rules, pinned Compromise, tests.
Inputs: Schema `S-REDACTION-REQUEST`.
Outputs: Schema `S-REDACTION-RESULT`; mapping exists only inside Worker and is destroyed.
Required behavior: Structured rules, context rules, then Compromise; suppress nested lower-priority matches; stable typed counters; wipe/terminate.
Bounds: `B-REDACTION-TIMEOUT-MS`, `B-REDACTION-RETRY-COUNT`, `B-PII-MAPPINGS`, `B-PLACEHOLDER-CHARS`, `B-SOURCE-RECORDS`, `B-DOCUMENT-TEXT-CHARS`.
Schemas: `S-REDACTION-REQUEST`, `S-REDACTION-RESULT`, `S-NORMALIZED-SOURCE-RECORD`.
Failures: `F-REDACTION-FAILURE`, `F-PII-GATE-FAILURE`.
Forbidden: Network, persistence, mapping egress, rehydration, server redaction, Worker reuse.
PASS: Precedence/placeholders/destruction/timeout/crash/zero-storage/no-network tests pass Chrome/Edge.

## Task 1.12 — Frozen PII corpus integration
Purpose: Make the approved English-context PII baseline a release regression.
Preconditions: Task 1.11 passed.
Allowed scope: Corpus runner, metrics, leak checks, additive fixtures.
Inputs: Approved 84-case, 576-entity corpus and hash.
Outputs: Schema `S-PII-CORPUS-RESULT`.
Required behavior: Preserve cases; exact precision/recall; every must-redact leak fails.
Bounds: `B-PII-CORPUS-CASES`, `B-PII-CORPUS-ENTITIES`.
Schemas: `S-PII-CORPUS-RESULT`.
Failures: `F-PII-GATE-FAILURE`.
Forbidden: Replacing/removing cases, universal claims, lowering floors.
PASS: Hash and all Section 12.4 floors pass with zero must-redact leaks.

## Task 1.13 — Network-boundary proof
Purpose: Prove source, unredacted text, filenames and mappings never cross or persist.
Preconditions: Task 1.12 passed.
Allowed scope: Chrome/Edge request and storage instrumentation with privacy fixtures.
Inputs: Six supported fixtures through redaction.
Outputs: Schema `S-NETWORK-BOUNDARY-RESULT` with counts/hashes only.
Required behavior: Observe every request/storage write; first document-derived egress is strict redacted records; local Workers terminate.
Bounds: `B-NETWORK-REQUESTS`, `B-BROWSER-STORAGE-WRITES`, `B-ANALYZE-BODY-BYTES`.
Schemas: `S-ANALYZE-REQUEST`, `S-NETWORK-BOUNDARY-RESULT`.
Failures: `F-NETWORK-BOUNDARY-FAILURE`.
Forbidden: Real PII/secrets, ignored requests, proof-only bypass.
PASS: All Section 14 assertions pass for six formats with zero forbidden egress/storage.

## Task 1.14 — Redacted analysis request schema
Purpose: Freeze exact public and trusted request contracts.
Preconditions: Task 1.13 passed.
Allowed scope: Shared Zod, serialization, public envelope and trusted validation tests.
Inputs: Redacted result, fresh Turnstile token, focus, requested outputs.
Outputs: Schemas `S-ANALYZE-REQUEST` and `S-TRUSTED-ANALYZE-REQUEST`.
Required behavior: Reject unknown/duplicate/invalid/unredacted/over-bound data twice.
Bounds: `B-ANALYZE-BODY-BYTES`, `B-TURNSTILE-TOKEN-CHARS`, `B-REQUESTED-OUTPUTS`, `B-NETWORK-SOURCE-RECORDS`, `B-SOURCE-TEXT-CHARS`, `B-SOURCE-REFERENCE-CHARS`.
Schemas: `S-ANALYZE-REQUEST`, `S-TRUSTED-ANALYZE-REQUEST`, `S-FOCUS`, `S-REQUESTED-OUTPUTS`.
Failures: `F-NETWORK-BOUNDARY-FAILURE`, `F-PII-GATE-FAILURE`.
Forbidden: Binary, filename, prompt, provider, URL, API key, email, extra field.
PASS: Exact/unknown/enums/references/size/double-validation tests pass; only redacted typed data serializes.

## Task 1.15 — Groq/OpenRouter router
Purpose: Provide one bounded free-only private model transport.
Preconditions: Task 1.14 passed.
Allowed scope: TrustedRuntime direct HTTPS adapter, reviewed config, privacy request, tests.
Inputs: Stage identifier and validated stage request.
Outputs: Schema `S-AI-TRANSPORT-RESULT` for immediate validation.
Required behavior: Allow only configured Groq Free/OpenRouter Free; enforce privacy; keys remain private.
Bounds: `B-AI-REQUEST-BYTES`, `B-AI-TIMEOUT-MS`, `B-AI-RESPONSE-BYTES`, `B-MODEL-OUTPUT-TOKENS`.
Schemas: `S-AI-TRANSPORT-REQUEST`, `S-AI-TRANSPORT-RESULT`.
Failures: `F-GROQ-FAILURE`, `F-OPENROUTER-FAILURE`, `F-AI-TIMEOUT`, `F-INVALID-AI-SCHEMA`.
Forbidden: SDK, browser provider call, arbitrary/paid endpoint, BYOK, logging, persistence.
PASS: Exact request/privacy/secret/timeout/size/HTTP/free-route/no-log tests pass.

## Task 1.16 — Strawman schema and prompt
Purpose: Produce first source-linked analysis stage.
Preconditions: Task 1.15 passed.
Allowed scope: Fixed prompt, focus instructions, Zod schema, fixtures.
Inputs: Trusted redacted sources and focus.
Outputs: Schema `S-STRAWMAN-OUTPUT`.
Required behavior: Source is data; every finding has confidence/evidence; full uses one call for three lenses.
Bounds: `B-STRAWMAN-FINDINGS`, `B-EVIDENCE-REFERENCES`, `B-QUANTITATIVE-CANDIDATES`, `B-RISKS`, `B-ASSUMPTIONS`, `B-AI-RESPONSE-BYTES`, `B-MODEL-OUTPUT-TOKENS`.
Schemas: `S-STRAWMAN-OUTPUT`, `S-FOCUS`.
Failures: `F-INVALID-AI-SCHEMA`, `F-AI-TIMEOUT`.
Forbidden: Tools, HTML, invented references, extra fields, specialist/router call.
PASS: Golden valid and invalid/unknown/bound/reference/injection fixtures pass.

## Task 1.17 — Steelman schema and prompt
Purpose: Critique Strawman against the same evidence.
Preconditions: Task 1.16 passed.
Allowed scope: Fixed critic prompt, Zod schema, fixtures.
Inputs: Redacted sources and Schema `S-STRAWMAN-OUTPUT`.
Outputs: Schema `S-STEELMAN-OUTPUT`.
Required behavior: Identify omissions/contradictions/counter-evidence/unsupported claims/nuance/connections; cite source-based items.
Bounds: `B-STEELMAN-ITEMS`, `B-EVIDENCE-REFERENCES`, `B-AI-RESPONSE-BYTES`, `B-MODEL-OUTPUT-TOKENS`.
Schemas: `S-STRAWMAN-OUTPUT`, `S-STEELMAN-OUTPUT`.
Failures: `F-INVALID-AI-SCHEMA`, `F-AI-TIMEOUT`.
Forbidden: Tools, HTML, unvalidated input, extra fields, report generation.
PASS: Golden and invalid IDs/references/status/unknown/bounds/injection fixtures pass.

## Task 1.18 — Oracle schema and prompt
Purpose: Produce final synthesis and resolve every critique.
Preconditions: Task 1.17 passed.
Allowed scope: Fixed prompt, Zod schema, resolution checks, fixtures.
Inputs: Redacted sources plus validated Strawman and Steelman.
Outputs: Schema `S-ORACLE-OUTPUT`.
Required behavior: Resolve/mark every critique; source-link findings/recommendations/risks; expose validated numeric candidates only.
Bounds: `B-ORACLE-FINDINGS`, `B-RECOMMENDATIONS`, `B-RISKS`, `B-EVIDENCE-REFERENCES`, `B-QUANTITATIVE-CANDIDATES`, `B-AI-RESPONSE-BYTES`, `B-MODEL-OUTPUT-TOKENS`.
Schemas: `S-STRAWMAN-OUTPUT`, `S-STEELMAN-OUTPUT`, `S-ORACLE-OUTPUT`.
Failures: `F-INVALID-AI-SCHEMA`, `F-AI-TIMEOUT`.
Forbidden: Tools, HTML, omitted critique, unchecked intermediate, invented evidence.
PASS: Golden/complete resolution and missing/duplicate/reference/number/unknown/bound/injection fixtures pass.

## Task 1.19 — Bounded provider failover
Purpose: Execute three stages with finite provider policy.
Preconditions: Task 1.18 passed.
Allowed scope: Request-local orchestrator, availability state, timers, tests.
Inputs: Validated request and three stage adapters.
Outputs: Schema `S-ORACLE-OUTPUT` or `S-SAFE-MODE`.
Required behavior: Each stage Groq once then OpenRouter Free once; failed provider unavailable for request; normal exactly 3 calls; wall stop.
Bounds: `B-PROVIDER-ATTEMPTS-PER-STAGE`, `B-PROVIDER-ATTEMPTS-TOTAL`, `B-AI-TIMEOUT-MS`, `B-ANALYSIS-WALL-MS`.
Schemas: `S-AI-TRANSPORT-RESULT`, `S-ORACLE-OUTPUT`, `S-SAFE-MODE`.
Failures: `F-GROQ-FAILURE`, `F-OPENROUTER-FAILURE`, `F-AI-TIMEOUT`, `F-INVALID-AI-SCHEMA`.
Forbidden: Retry loop, paid provider, resurrection, partial Oracle, persistence.
PASS: All permutations prove 3 normal and ≤6 total attempts; invalid schema hard-fails; terminal faults stop later stages.

## Task 1.20 — Prompt-injection controls
Purpose: Prove source instructions cannot control application or agents.
Preconditions: Task 1.19 passed.
Allowed scope: Fixed prompt delimiters/instructions and adversarial fixtures.
Inputs: Redacted hostile instruction records.
Outputs: Validated stage schema or Safe Mode.
Required behavior: Source is untrusted evidence; no tool/route/network/file/storage/signing/email/deployment capability.
Bounds: `B-AI-REQUEST-BYTES`, `B-AI-RESPONSE-BYTES`, `B-MODEL-OUTPUT-TOKENS`.
Schemas: `S-STRAWMAN-OUTPUT`, `S-STEELMAN-OUTPUT`, `S-ORACLE-OUTPUT`.
Failures: `F-INVALID-AI-SCHEMA`.
Forbidden: Dynamic system prompt, model HTML, tools, source-controlled role/messages.
PASS: Frozen direct/indirect/exfiltration/tool/HTML fixtures cannot alter destination/schema/order/control.

## Task 1.21 — Plain functional dashboard
Purpose: Complete unstyled mission journey for valid Oracle results.
Preconditions: Task 1.20 passed.
Allowed scope: Accessible UI states, escaped rendering, Turnstile reset, integration tests.
Inputs: Local flow, focus/outputs, validated Oracle or Safe Mode.
Outputs: Browser-only dashboard; downloads remain Phase 2.
Required behavior: Show progress, links/confidence, clear faults, fresh challenge after attempt, escaped text.
Bounds: `B-UI-FINDINGS`, `B-UI-TEXT-CHARS`, `B-ANALYSIS-WALL-MS`, `B-FRONTEND-JS-GZIP-BYTES`.
Schemas: `S-ORACLE-OUTPUT`, `S-SAFE-MODE`.
Failures: `F-INVALID-DOCUMENT`, `F-UNSUPPORTED-LANGUAGE`, `F-PII-GATE-FAILURE`, `F-AI-TIMEOUT`, `F-QUOTA-EXHAUSTED`.
Forbidden: Phase 2 finish, HTML, persistence, chat, email, BYOK, result route, upload fallback.
PASS: Keyboard/semantic success/fault states pass Chrome/Edge; escaped, no persistence, JS bound.

## Task 1.22 — Parser/redactor/AI fault reflexes
Purpose: Integrate deterministic recovery and fail-closed behavior.
Preconditions: Task 1.21 passed.
Allowed scope: Fault orchestration, approved recovery, cancellation, cleanup, tests.
Inputs: Injected local/provider/timeout/allocation faults.
Outputs: Approved retry success or Schema `S-SAFE-MODE`.
Required behavior: Parser gets one fresh Worker; redactor no retry; AI uses Task 1.19; terminal fault cancels later work, terminates/wipes, resets Turnstile, forbids improper egress.
Bounds: `B-PARSER-RETRY-COUNT`, `B-REDACTION-RETRY-COUNT`, `B-PROVIDER-ATTEMPTS-TOTAL`, `B-ANALYSIS-WALL-MS`.
Schemas: `S-SAFE-MODE`.
Failures: `F-PARSER-CRASH`, `F-PARSER-TIMEOUT`, `F-PARSER-ALLOCATION`, `F-REDACTION-FAILURE`, `F-GROQ-FAILURE`, `F-OPENROUTER-FAILURE`, `F-AI-TIMEOUT`.
Forbidden: Extra retry, partial output, silent degradation, network after privacy failure, Worker reuse.
PASS: Fault matrix proves counts, cleanup, forbidden downstream absence, fresh-parser recovery, labelled Safe Mode, Phase 0 regression.

## PHASE 1 EXIT GATE
Run complete Phase 1 plus Phase 0 regressions. PASS requires six formats,
exact bounds, hostile/English/PII gates, zero forbidden egress/storage, real
document to valid Oracle in exactly three normal calls, source/confidence links,
bounded failover, Chrome/Edge, exact-zero, and Doctor. Report `PHASE 1 — PASS`
or `PHASE 1 — BLOCKED`, then stop for Phase 2 owner authorization.

---

# 43. PHASE 2 — PROFESSIONAL OUTPUT

Implement only after explicit owner authorization and Phase 1 PASS.

## Task 2.1 — Complete premium UI system
Purpose: Apply the approved Scandinavian analytical-instrument visual system.
Preconditions: Phase 1 exit passed and Phase 2 is owner-authorized.
Allowed scope: Shared tokens, typography, spacing, layout, controls, responsive desktop states, tests.
Inputs: Existing functional application states.
Outputs: Accessible styled components using the typed token system.
Required behavior: Enforce Section 18, self-host fonts, semantic HTML, keyboard and reduced-motion behavior.
Bounds: `B-FRONTEND-JS-GZIP-BYTES`, `B-STATIC-ASSET-BYTES`, `B-UI-TEXT-CHARS`.
Schemas: `S-SAFE-MODE`.
Failures: `F-OUTPUT-SIZE`.
Forbidden: Generic SaaS/chat motifs, theme/localization system, third-party assets, mobile/browser claims.
PASS: Visual regression, accessibility, keyboard, reduced-motion, font/network and bundle gates pass Chrome/Edge.

## Task 2.2 — Dashboard information architecture
Purpose: Organize validated analysis for fast professional reading.
Preconditions: Task 2.1 passed.
Allowed scope: Dashboard hierarchy, sections, source-link navigation, empty/fault states, tests.
Inputs: Schema `S-ORACLE-OUTPUT`.
Outputs: Deterministic accessible dashboard view model.
Required behavior: Present executive summary, findings, recommendations, risks, confidence and evidence without changing content.
Bounds: `B-UI-FINDINGS`, `B-UI-TEXT-CHARS`, `B-EVIDENCE-REFERENCES`.
Schemas: `S-ORACLE-OUTPUT`, `S-SAFE-MODE`.
Failures: `F-INVALID-AI-SCHEMA`.
Forbidden: AI-generated layout/HTML, hidden evidence, chat, persistence.
PASS: Golden Oracle renders exact hierarchy/order/links; empty and bound cases are accessible; no content mutation.

## Task 2.3 — Recharts visualizations
Purpose: Render accessible charts from validated deterministic chart data.
Preconditions: Task 2.2 passed.
Allowed scope: Approved Recharts components, token styling, fallbacks, tests.
Inputs: Schema `S-CHART-DATA` only.
Outputs: Accessible deterministic charts or omitted chart.
Required behavior: Use shared tokens; label values/units/source; omit unsupported chart data.
Bounds: `B-CHARTS`, `B-CHART-POINTS`, `B-UI-TEXT-CHARS`.
Schemas: `S-CHART-DATA`.
Failures: `F-INVALID-AI-SCHEMA`.
Forbidden: Raw AI data, invented number, decorative chart, remote library/CDN.
PASS: Golden/accessibility/empty/invalid/bound cases pass and bundle remains within bound.

## Task 2.4 — Deterministic chart transforms
Purpose: Convert Oracle numeric candidates into safe chart data.
Preconditions: Task 2.3 passed.
Allowed scope: Validation/transformation functions and numeric fixtures.
Inputs: Valid quantitative candidates from Schema `S-ORACLE-OUTPUT`.
Outputs: Schema `S-CHART-DATA`.
Required behavior: Validate finite numbers, units, context, evidence and compatible series; omit invalid candidates.
Bounds: `B-QUANTITATIVE-CANDIDATES`, `B-CHARTS`, `B-CHART-POINTS`.
Schemas: `S-ORACLE-OUTPUT`, `S-CHART-DATA`.
Failures: `F-INVALID-AI-SCHEMA`.
Forbidden: Guessing, unit conversion without explicit rule, model call, persistence.
PASS: Finite/unit/evidence/grouping/order/omission cases pass deterministically.

## Task 2.5 — Shared report design tokens
Purpose: Make web and reports visibly one system.
Preconditions: Task 2.4 passed.
Allowed scope: Typed report-safe projection of approved tokens and tests.
Inputs: Canonical design tokens.
Outputs: Schema `S-REPORT-TOKENS`.
Required behavior: Map only fixed colors, typography, spacing and chart styles supported by Browser Run.
Bounds: `B-REPORT-TOKEN-COUNT`, `B-UI-TEXT-CHARS`.
Schemas: `S-REPORT-TOKENS`.
Failures: `F-PDF-VALIDATION`.
Forbidden: Duplicate token authority, remote font, arbitrary CSS, user style.
PASS: Web/report token equality snapshot and allowed-property validation pass.

## Task 2.6 — Service-owned HTML report template
Purpose: Render validated report data into fixed escaped HTML.
Preconditions: Task 2.5 passed.
Allowed scope: TrustedRuntime report model, fixed template, escaping, print CSS, tests.
Inputs: Schemas `S-REPORT-MODEL`, `S-REPORT-TOKENS`, `S-CHART-DATA`.
Outputs: Fixed service-owned UTF-8 HTML for Browser Run.
Required behavior: Escape every inserted string; deterministic section/order/page rules; accept no caller HTML.
Bounds: `B-REPORT-HTML-BYTES`, `B-REPORT-SECTIONS`, `B-CHARTS`, `B-UI-TEXT-CHARS`.
Schemas: `S-REPORT-MODEL`, `S-REPORT-TOKENS`, `S-CHART-DATA`.
Failures: `F-PDF-VALIDATION`, `F-OUTPUT-SIZE`.
Forbidden: Model HTML, scripts, remote resources, user CSS, arbitrary URL.
PASS: Golden bytes, escaping/injection, CSP/resource, bound and deterministic-repeat tests pass.

## Task 2.7 — Production Browser Run PDF
Purpose: Generate the final report PDF from service-owned HTML.
Preconditions: Task 2.6 passed.
Allowed scope: Private Browser Run call, quota/queue integration, PDF validation, timings, tests.
Inputs: Validated service-owned report HTML.
Outputs: Exact final PDF bytes held in TrustedRuntime request memory.
Required behavior: Preflight quota before AI when PDF required; fixed Quick Action; validate magic/size; never modify returned bytes.
Bounds: `B-BROWSER-RUN-DAY-MS`, `B-PDF-QUEUE-DEPTH`, `B-PDF-RENDER-TIMEOUT-MS`, `B-FINAL-PDF-BYTES`, `B-PDF-RENDER-MEDIAN-MS`.
Schemas: `S-QUOTA-STATE`.
Failures: `F-QUOTA-EXHAUSTED`, `F-BROWSER-RUN-FAILURE`, `F-PDF-VALIDATION`.
Forbidden: Caller HTML, paid renderer, unsigned substitute, second host/runtime, persistence.
PASS: Exact PDF, malformed/oversize/quota/queue/timeout paths and median target pass; state remains date+aggregate ms only.

## Task 2.8 — XLSX writer
Purpose: Produce optional deterministic spreadsheet output.
Preconditions: Task 2.7 passed.
Allowed scope: Minimal OOXML writer, tree-shaken fflate, fixed workbook model, tests.
Inputs: Schema `S-REPORT-MODEL` and optional `S-CHART-DATA`.
Outputs: Bounded XLSX bytes.
Required behavior: Fixed sheets/cells/styles; escape formulas as text unless service-owned formula allowlist says otherwise; deterministic archive.
Bounds: `B-XLSX-OUTPUT-BYTES`, `B-XLSX-OUTPUT-SHEETS`, `B-XLSX-OUTPUT-ROWS`, `B-XLSX-OUTPUT-COLUMNS`.
Schemas: `S-REPORT-MODEL`.
Failures: `F-OUTPUT-SIZE`.
Forbidden: pandas/openpyxl server use, macros, external links, arbitrary formulas, persistence.
PASS: Exact structure opens without repair in current Excel/LibreOffice; injection, bound and deterministic tests pass.

## Task 2.9 — Text and Markdown outputs
Purpose: Produce optional deterministic plain exports.
Preconditions: Task 2.8 passed.
Allowed scope: Fixed text/Markdown formatter and tests.
Inputs: Schema `S-REPORT-MODEL`.
Outputs: UTF-8 plain text and Markdown bytes.
Required behavior: Fixed headings/order/references; escape Markdown control where content is inserted.
Bounds: `B-TEXT-OUTPUT-BYTES`, `B-UI-TEXT-CHARS`.
Schemas: `S-REPORT-MODEL`.
Failures: `F-OUTPUT-SIZE`.
Forbidden: AI formatting, HTML, executable links, persistence.
PASS: Golden bytes, escaping, Unicode and bound cases pass deterministically.

## Task 2.10 — Bounded multipart analysis response
Purpose: Return requested outputs once without result storage.
Preconditions: Task 2.9 passed.
Allowed scope: Fixed response envelope/parts, headers, byte accounting, tests.
Inputs: Dashboard model and requested PDF/XLSX/text outputs.
Outputs: Schema `S-ANALYZE-RESPONSE` with fixed known parts.
Required behavior: Include only requested available outputs; no token/route/session; enforce total before send; `no-store`.
Bounds: `B-ANALYSIS-RESPONSE-BYTES`, `B-RESPONSE-PARTS`, `B-FINAL-PDF-BYTES`, `B-XLSX-OUTPUT-BYTES`, `B-TEXT-OUTPUT-BYTES`.
Schemas: `S-ANALYZE-RESPONSE`, `S-SIGNATURE-MANIFEST`.
Failures: `F-OUTPUT-SIZE`, `F-PDF-VALIDATION`, `F-SIGNING-FAILURE`.
Forbidden: Result/download route, token, storage, chunk retry, email.
PASS: Exact requested-part combinations, headers, total boundary, missing/failed PDF and no-storage tests pass.

## Task 2.11 — Direct object-URL downloads
Purpose: Deliver response outputs from browser memory under user control.
Preconditions: Task 2.10 passed.
Allowed scope: Browser Blob/object-URL lifecycle, download controls, cleanup tests.
Inputs: Validated Schema `S-ANALYZE-RESPONSE`.
Outputs: User-triggered downloads and revoked ephemeral object URLs.
Required behavior: Create on demand; revoke after use and page exit; retain nothing in browser storage.
Bounds: `B-OBJECT-URL-LIFETIME-MS`, `B-RESPONSE-PARTS`, `B-ANALYSIS-RESPONSE-BYTES`.
Schemas: `S-ANALYZE-RESPONSE`.
Failures: `F-OUTPUT-SIZE`.
Forbidden: Auto-download, server retrieval, token, service worker/cache/storage.
PASS: Download names/types/bytes and revoke-on-use/exit/failure tests pass Chrome/Edge with zero storage.

## Task 2.12 — Final signing integration
Purpose: Sign exact final production PDF bytes internally with both algorithms.
Preconditions: Task 2.11 passed.
Allowed scope: Existing Phase 0 signer integration after PDF validation, manifest return, tests.
Inputs: Exact Browser Run PDF bytes only.
Outputs: Schema `S-SIGNATURE-MANIFEST` and unchanged PDF bytes.
Required behavior: SHA-256 once; Ed25519 and ML-DSA-65 sign same digest; self-check; wipe working secrets; no post-hash mutation.
Bounds: `B-FINAL-PDF-BYTES`, `B-SIGNING-MEDIAN-MS`, `B-SIGNATURE-MANIFEST-BYTES`.
Schemas: `S-SIGNATURE-MANIFEST`.
Failures: `F-PDF-VALIDATION`, `F-SIGNING-FAILURE`.
Forbidden: Public/generic signer, caller bytes/hash, one-signature success, replacement primitive.
PASS: Exact-byte integration, independent verification, changed-byte rejection by both, vectors/hash and median target pass.

## Task 2.13 — Detached manifest UX
Purpose: Let users download and understand verification material.
Preconditions: Task 2.12 passed.
Allowed scope: Manifest download/control, key-ID display, verification link, accessible guidance, tests.
Inputs: PDF plus Schema `S-SIGNATURE-MANIFEST`.
Outputs: Detached `.sig.json` bytes and dashboard trust affordance.
Required behavior: Manifest stays detached; algorithms/key IDs are exact; no claim beyond verification properties.
Bounds: `B-SIGNATURE-MANIFEST-BYTES`, `B-UI-TEXT-CHARS`.
Schemas: `S-SIGNATURE-MANIFEST`.
Failures: `F-SIGNING-FAILURE`.
Forbidden: Embedded circular signature, private key, misleading trust claim, persistence.
PASS: Exact JSON, download pairing, accessibility and local parse/changed-byte tests pass.

## Task 2.14 — Synthetic signed static sample
Purpose: Keep the portfolio demonstrable when live compute is unavailable.
Preconditions: Task 2.13 passed.
Allowed scope: Synthetic input, generated dashboard representation/PDF/manifest, static Pages links, tests.
Inputs: Reviewed synthetic document containing no real person or owner data.
Outputs: Static sample artifacts and label.
Required behavior: Use production report/signing pipeline with dedicated published key IDs; commit final public artifacts only.
Bounds: `B-SOURCE-BYTES`, `B-FINAL-PDF-BYTES`, `B-SIGNATURE-MANIFEST-BYTES`.
Schemas: `S-REPORT-MODEL`, `S-SIGNATURE-MANIFEST`.
Failures: `F-PDF-VALIDATION`, `F-SIGNING-FAILURE`.
Forbidden: Real user data, second host, dynamic fallback, hidden sample label.
PASS: Static sample verifies locally/independently, changed byte fails both, links work, exact label and no real PII pass review.

## PHASE 2 EXIT GATE
Run Phase 2 plus all earlier regressions. PASS requires premium journey,
dashboard, default exact signed PDF, optional XLSX/text, independent manifest,
evidence-only charts, Excel/LibreOffice compatibility, direct memory delivery,
static fallback, zero persistence/tokens/email/BYOK, visual gates, Doctor and
exact-zero. Report `PHASE 2 — PASS` or `PHASE 2 — BLOCKED`, then stop for Phase
3 owner authorization.

---

# 44. PHASE 3 — RELEASE HARDENING

Implement only after explicit owner authorization and Phase 2 PASS.

## Task 3.1 — Complete hostile corpus
Purpose: Freeze comprehensive hostile-file release regressions.
Preconditions: Phase 2 exit passed and Phase 3 is owner-authorized.
Allowed scope: Additive synthetic fixtures and preflight/parser regression runner.
Inputs: All Section 12.1 hostile classes across applicable formats.
Outputs: Versioned corpus manifest with hashes and results.
Required behavior: Retain every earlier fixture; classify expected failure exactly.
Bounds: `B-HOSTILE-CORPUS-CASES`, `B-SOURCE-BYTES`, `B-PREFLIGHT-TIMEOUT-MS`.
Schemas: `S-PREFLIGHT-RESULT`.
Failures: `F-HOSTILE-DOCUMENT`, `F-INVALID-DOCUMENT`.
Forbidden: Removing/weaking fixtures, real malware, remote scanning.
PASS: Manifest hashes and all expected rejections pass Chrome/Edge with no egress.

## Task 3.2 — Frozen PII corpus release gate
Purpose: Reverify the approved baseline against release code.
Preconditions: Task 3.1 passed.
Allowed scope: Corpus runner and additive regressions only.
Inputs: Approved PII corpus and release redactor.
Outputs: Schema `S-PII-CORPUS-RESULT`.
Required behavior: Preserve hash/cases and Section 12.4 floors.
Bounds: `B-PII-CORPUS-CASES`, `B-PII-CORPUS-ENTITIES`.
Schemas: `S-PII-CORPUS-RESULT`.
Failures: `F-PII-GATE-FAILURE`.
Forbidden: Floor reduction, case replacement, universal claim.
PASS: Exact corpus hash, all floors and zero leaks pass release build.

## Task 3.3 — Language fixtures release gate
Purpose: Freeze the exact English-only decision under release code.
Preconditions: Task 3.2 passed.
Allowed scope: Additive local language fixtures and runner.
Inputs: Section 13 fixture classes.
Outputs: Schema `S-LANGUAGE-DECISION` per fixture.
Required behavior: Apply exact Section 5.3 rule locally.
Bounds: `B-LANGUAGE-MIN-LETTERS`, `B-LANGUAGE-MIN-TOKENS`, `B-LANGUAGE-MARGIN`, `B-LANGUAGE-SAMPLE-CHARS`.
Schemas: `S-LANGUAGE-DECISION`.
Failures: `F-UNSUPPORTED-LANGUAGE`.
Forbidden: Online call, threshold drift, translation.
PASS: Expected accept/reject matrix passes Chrome/Edge and no language-data request occurs.

## Task 3.4 — Prompt-injection fixtures release gate
Purpose: Freeze adversarial source handling across all AI stages.
Preconditions: Task 3.3 passed.
Allowed scope: Additive synthetic injection fixtures and mocked/live-free reviewed tests.
Inputs: Direct, indirect, role, tool, exfiltration, HTML and signing-control attacks.
Outputs: Valid schemas or Safe Mode without control-plane change.
Required behavior: Preserve Task 1.20 protections and exact stage order.
Bounds: `B-AI-REQUEST-BYTES`, `B-AI-RESPONSE-BYTES`, `B-MODEL-OUTPUT-TOKENS`.
Schemas: `S-STRAWMAN-OUTPUT`, `S-STEELMAN-OUTPUT`, `S-ORACLE-OUTPUT`.
Failures: `F-INVALID-AI-SCHEMA`.
Forbidden: Tool capability, dynamic destination, ignored fixture.
PASS: Every frozen attack fails to change routes, tools, schemas, report/signing control or privacy.

## Task 3.5 — Browser Worker crash handling
Purpose: Verify disposable Worker crash isolation.
Preconditions: Task 3.4 passed.
Allowed scope: Deterministic crash injection and lifecycle assertions.
Inputs: Synthetic parser and redactor crash signals.
Outputs: Approved retry or Safe Mode.
Required behavior: Terminate crashed Worker; parser only gets fresh retry; redactor none.
Bounds: `B-PARSER-RETRY-COUNT`, `B-REDACTION-RETRY-COUNT`.
Schemas: `S-SAFE-MODE`.
Failures: `F-PARSER-CRASH`, `F-REDACTION-FAILURE`.
Forbidden: Worker reuse, crash detail leakage, network after redaction crash.
PASS: Exact lifecycle/retry/cleanup/no-egress assertions pass Chrome/Edge.

## Task 3.6 — Parser timeout handling
Purpose: Verify hard parser deadlines and cleanup.
Preconditions: Task 3.5 passed.
Allowed scope: Loop/hang injection, timers and lifecycle tests.
Inputs: Parser operation exceeding deadline.
Outputs: One fresh attempt then Safe Mode.
Required behavior: Terminate at deadline and wipe owned buffers.
Bounds: `B-PARSER-TIMEOUT-MS`, `B-PARSER-RETRY-COUNT`.
Schemas: `S-SAFE-MODE`.
Failures: `F-PARSER-TIMEOUT`.
Forbidden: Extended/adaptive timeout, upload fallback, reused Worker.
PASS: Bounded elapsed time, exact retry, cleanup and zero egress pass Chrome/Edge.

## Task 3.7 — Allocation failure handling
Purpose: Verify local memory pressure fails closed.
Preconditions: Task 3.6 passed.
Allowed scope: Deterministic allocation failure injection and cleanup tests.
Inputs: Parser/redactor allocation failure.
Outputs: Approved parser retry or Safe Mode.
Required behavior: Catch named failure, terminate Worker, release buffers, never upload.
Bounds: `B-PARSER-RETRY-COUNT`, `B-BROWSER-TEST-ALLOCATION-BYTES`.
Schemas: `S-SAFE-MODE`.
Failures: `F-PARSER-ALLOCATION`, `F-REDACTION-FAILURE`.
Forbidden: Server fallback, persistence, unbounded allocation.
PASS: Chrome/Edge pressure fixture proves cleanup, retry counts and zero network.

## Task 3.8 — Fresh-Worker recovery
Purpose: Prove recovery uses a newly initialized parser runtime.
Preconditions: Task 3.7 passed.
Allowed scope: Worker identity instrumentation and deterministic recovery fixture.
Inputs: First-attempt injected parser failure then valid document.
Outputs: Valid parser result from distinct Worker identity.
Required behavior: Destroy first Worker; initialize pinned assets anew once.
Bounds: `B-PARSER-RETRY-COUNT`, `B-PARSER-TIMEOUT-MS`.
Schemas: `S-PARSER-RESULT`.
Failures: `F-PARSER-CRASH`, `F-PARSER-TIMEOUT`, `F-PARSER-ALLOCATION`.
Forbidden: Same Worker/context reuse, more than one retry.
PASS: Distinct identity, correct result, asset hashes, termination and retry bound pass Chrome/Edge.

## Task 3.9 — Zero browser user-data storage
Purpose: Prove the browser persists no user-derived content.
Preconditions: Task 3.8 passed.
Allowed scope: Storage API instrumentation across success/failure/download journeys.
Inputs: Six formats and all output selections.
Outputs: Schema `S-NETWORK-BOUNDARY-RESULT` storage counts.
Required behavior: Detect local/session/IndexedDB/cache/OPFS/service-worker/cookie writes.
Bounds: `B-BROWSER-STORAGE-WRITES`.
Schemas: `S-NETWORK-BOUNDARY-RESULT`.
Failures: `F-NETWORK-BOUNDARY-FAILURE`.
Forbidden: Allowlisting document/report writes, persistent object URL registry.
PASS: Zero user-data writes for every journey in Chrome/Edge.

## Task 3.10 — Provider outage handling
Purpose: Verify exact free-only outage reflexes.
Preconditions: Task 3.9 passed.
Allowed scope: Transport fault injection and orchestrator assertions.
Inputs: Timeout, network, 429, 5xx, policy, invalid schema per provider/stage.
Outputs: Fallback result or Safe Mode.
Required behavior: Enforce Groq→OpenRouter Free and request-local unavailability.
Bounds: `B-PROVIDER-ATTEMPTS-PER-STAGE`, `B-PROVIDER-ATTEMPTS-TOTAL`, `B-AI-TIMEOUT-MS`, `B-ANALYSIS-WALL-MS`.
Schemas: `S-AI-TRANSPORT-RESULT`, `S-SAFE-MODE`.
Failures: `F-GROQ-FAILURE`, `F-OPENROUTER-FAILURE`, `F-AI-TIMEOUT`.
Forbidden: Paid/third provider, extra retry, partial report.
PASS: Full outage matrix proves exact attempts, cancellation and Safe Mode.

## Task 3.11 — Rate-limit handling
Purpose: Verify abuse limits fail cheaply and without stored IPs.
Preconditions: Task 3.10 passed.
Allowed scope: Public edge limiter configuration and tests.
Inputs: Analyze attempts by synthetic location/IP keys.
Outputs: Fixed 429 or forwarded request.
Required behavior: Apply 5 accepted attempts per 60 seconds per source IP/location before trusted work.
Bounds: `B-RATE-ATTEMPTS`, `B-RATE-WINDOW-SECONDS`, `B-ANALYZE-BODY-BYTES`.
Schemas: `S-SAFE-ERROR`.
Failures: `F-RATE-LIMITED`.
Forbidden: Application IP persistence, bypass, expensive call on denial.
PASS: Boundary, location isolation, limiter failure and no-trusted-call tests pass.

## Task 3.12 — Schema failure handling
Purpose: Verify every external boundary rejects malformed data.
Preconditions: Task 3.11 passed.
Allowed scope: Mutation/fuzz fixture tables for registered schemas.
Inputs: Missing, extra, wrong-type, invalid-enum/reference and over-bound payloads.
Outputs: Fixed safe error or Safe Mode.
Required behavior: Strict validation at browser, public ingress, trusted consumer and AI stages.
Bounds: `B-SCHEMA-MUTATIONS`, `B-ANALYZE-BODY-BYTES`, `B-AI-RESPONSE-BYTES`.
Schemas: `S-ANALYZE-REQUEST`, `S-TRUSTED-ANALYZE-REQUEST`, `S-STRAWMAN-OUTPUT`, `S-STEELMAN-OUTPUT`, `S-ORACLE-OUTPUT`, `S-ANALYZE-RESPONSE`.
Failures: `F-INVALID-AI-SCHEMA`, `F-NETWORK-BOUNDARY-FAILURE`.
Forbidden: Coercion of security fields, unknown-field stripping then acceptance.
PASS: Mutation matrix fails at expected boundary with no later operation/logged content.

## Task 3.13 — Turnstile failure handling
Purpose: Verify private human-verification gate blocks expensive work.
Preconditions: Task 3.12 passed.
Allowed scope: Official test credentials/mocks and TrustedRuntime tests.
Inputs: Valid, invalid, missing, oversized, wrong action/hostname, replay and unavailable cases.
Outputs: Fixed allow/403/503 response.
Required behavior: Verify inside TrustedRuntime before AI/Browser Run/signing; require fresh client challenge after attempt.
Bounds: `B-TURNSTILE-TOKEN-CHARS`, `B-TURNSTILE-TIMEOUT-MS`, `B-TURNSTILE-RESPONSE-BYTES`.
Schemas: `S-SAFE-ERROR`.
Failures: `F-TURNSTILE-FAILURE`.
Forbidden: Edge secret, remoteip, bypass, retry with same token.
PASS: Entire matrix and zero-expensive-call assertions pass; public edge secrets remain zero.

## Task 3.14 — Quota failure handling
Purpose: Verify exact-zero quota exhaustion behavior.
Preconditions: Task 3.13 passed.
Allowed scope: Quota-state boundary/rollover tests and UI mapping.
Inputs: Daily aggregate below/at/above reservation boundary and UTC rollover.
Outputs: Reservation or Safe Mode/no-PDF result.
Required behavior: Lazy UTC reset; preflight before AI when PDF required; no paid overflow or unsigned substitute.
Bounds: `B-BROWSER-RUN-DAY-MS`, `B-PDF-QUEUE-DEPTH`.
Schemas: `S-QUOTA-STATE`, `S-SAFE-MODE`.
Failures: `F-QUOTA-EXHAUSTED`.
Forbidden: User/job state, cron, charged fallback, quota bypass.
PASS: Boundary/concurrency/rollover/crash-settlement tests pass with only approved two fields stored.

## Task 3.15 — Browser Run failure handling
Purpose: Verify renderer faults never create false reports.
Preconditions: Task 3.14 passed.
Allowed scope: Browser Run transport/content fault injection and UI response tests.
Inputs: Timeout, non-PDF, truncated, over-bound, unavailable responses.
Outputs: Safe Mode/no-PDF and no signing call.
Required behavior: Validate exact bytes, settle quota conservatively, omit unsigned substitute.
Bounds: `B-PDF-RENDER-TIMEOUT-MS`, `B-FINAL-PDF-BYTES`, `B-PDF-QUEUE-DEPTH`.
Schemas: `S-SAFE-MODE`.
Failures: `F-BROWSER-RUN-FAILURE`, `F-PDF-VALIDATION`.
Forbidden: Second renderer, malformed download, signing invalid bytes.
PASS: Fault matrix proves no presented PDF/signing and correct quota settlement.

## Task 3.16 — Signing failure handling
Purpose: Verify hybrid integrity fails as one atomic gate.
Preconditions: Task 3.15 passed.
Allowed scope: Key/wasm/sign/self-check fault injection and response tests.
Inputs: Valid PDF with each signing component faulted.
Outputs: Signed PDF+manifest only if both pass; otherwise Safe Mode.
Required behavior: Wipe buffers; return no authentic claim or partial signature.
Bounds: `B-SIGNING-MEDIAN-MS`, `B-SIGNATURE-MANIFEST-BYTES`.
Schemas: `S-SIGNATURE-MANIFEST`, `S-SAFE-MODE`.
Failures: `F-SIGNING-FAILURE`.
Forbidden: One-signature fallback, generic signer, key detail error.
PASS: All faults suppress PDF authenticity/output; success independently verifies; changed byte fails both.

## Task 3.17 — Privacy/network boundary release gate
Purpose: Reprove the complete privacy boundary in the release build.
Preconditions: Task 3.16 passed.
Allowed scope: Full browser/request/storage instrumentation.
Inputs: Six formats through all output choices and fault paths.
Outputs: Schema `S-NETWORK-BOUNDARY-RESULT`.
Required behavior: Enforce Sections 12 and 14 including provider/Browser Run payload inspection.
Bounds: `B-NETWORK-REQUESTS`, `B-BROWSER-STORAGE-WRITES`, `B-ANALYZE-BODY-BYTES`, `B-REPORT-HTML-BYTES`.
Schemas: `S-ANALYZE-REQUEST`, `S-NETWORK-BOUNDARY-RESULT`.
Failures: `F-NETWORK-BOUNDARY-FAILURE`.
Forbidden: Raw/unredacted/name/mapping egress, source bytes to Browser Run.
PASS: Chrome/Edge complete matrix has zero forbidden egress/storage and only service-owned report HTML reaches Browser Run.

## Task 3.18 — Production no-logging assertion
Purpose: Prove application content is not persistently logged.
Preconditions: Task 3.17 passed.
Allowed scope: Wrangler/config/source/response inspection and deployment assertion.
Inputs: Public/private production configuration and synthetic journey.
Outputs: Deterministic no-logging report.
Required behavior: Observability/logs disabled explicitly; source contains no sensitive logging path.
Bounds: `B-DOCTOR-CHECKS`.
Schemas: `S-DOCTOR-RESULT`.
Failures: `F-NETWORK-BOUNDARY-FAILURE`.
Forbidden: Tail/Logpush/Sentry/analytics, content logs, relying on provider defaults.
PASS: Static and deployed checks prove both Workers disabled and no content telemetry dependency.

## Task 3.19 — Performance corpus
Purpose: Measure release performance without weakening higher invariants.
Preconditions: Task 3.18 passed.
Allowed scope: Frozen representative local/synthetic corpus and timing harness.
Inputs: Clean-cache/warm supported-format journeys and full analyses.
Outputs: Stage median/p95 measurement report.
Required behavior: Record shell, engine, local processing, three AI stages, PDF, signing and total; no cherry-picking.
Bounds: `B-APP-SHELL-MS`, `B-ENGINE-COLD-MS`, `B-LOCAL-WARM-MS`, `B-ANALYSIS-MEDIAN-MS`, `B-ANALYSIS-WALL-MS`, `B-PDF-RENDER-MEDIAN-MS`, `B-SIGNING-MEDIAN-MS`.
Schemas: `S-PERFORMANCE-RESULT`.
Failures: `F-PERFORMANCE-GATE`.
Forbidden: Privacy/security/cost weakening, persistence of user data.
PASS: Frozen corpus meets every release target or reports exact blocker.

## Task 3.20 — Bundle, CPU, memory, and output limits
Purpose: Verify every deployable/resource margin.
Preconditions: Task 3.19 passed.
Allowed scope: Deterministic build measurement and synthetic load tests.
Inputs: Release artifacts and maximum-bound fixtures.
Outputs: Schema `S-RESOURCE-GATE-RESULT`.
Required behavior: Measure initial JS, assets, each Worker, public p99 CPU, trusted peak memory and responses.
Bounds: `B-FRONTEND-JS-GZIP-BYTES`, `B-STATIC-ASSET-BYTES`, `B-WORKER-GZIP-BYTES`, `B-PUBLIC-CPU-P99-MS`, `B-TRUSTED-MEMORY-BYTES`, `B-ANALYSIS-RESPONSE-BYTES`.
Schemas: `S-RESOURCE-GATE-RESULT`.
Failures: `F-OUTPUT-SIZE`, `F-PERFORMANCE-GATE`.
Forbidden: Provider-limit edge operation, unsafe pruning, hidden lazy-load regression.
PASS: Every measured value is below its bound with recorded evidence.

## Task 3.21 — CodeQL gate
Purpose: Resolve applicable code-scanning findings.
Preconditions: Task 3.20 passed.
Allowed scope: GitHub CodeQL configuration/results and smallest code fixes.
Inputs: Release branch CodeQL scan.
Outputs: Passing required CodeQL checks.
Required behavior: Triage every finding; fix active applicable findings without stack redesign.
Bounds: `B-CI-JOB-MINUTES`.
Schemas: `S-SECURITY-GATE-RESULT`.
Failures: `F-SECURITY-GATE`.
Forbidden: Disabling query/check, suppressing without documented false-positive evidence, new SaaS.
PASS: Required CodeQL checks pass with zero unresolved applicable high severity.

## Task 3.22 — Dependabot gate
Purpose: Resolve active dependency vulnerabilities normally.
Preconditions: Task 3.21 passed.
Allowed scope: Alert triage, obsolete removal, smallest compatible safe updates, lockfiles/tests.
Inputs: Current Dependabot alerts and active Architecture 2.1 trees.
Outputs: Passing audits and documented dispositions.
Required behavior: Remove obsolete; otherwise compatible update; high active alerts cannot remain.
Bounds: `B-DEPENDENCY-ALERTS`.
Schemas: `S-SECURITY-GATE-RESULT`.
Failures: `F-SECURITY-GATE`.
Forbidden: Stack replacement, broad modernization, ignored active high alert.
PASS: All alerts inspected; active high zero; compatible moderate fixes applied; build/test/audit pass.

## Task 3.23 — Secret-scanning gate
Purpose: Prove repository/history/release contain no secrets.
Preconditions: Task 3.22 passed.
Allowed scope: GitHub native secret scanning and deterministic local fixture checks.
Inputs: Release branch and generated static artifacts.
Outputs: Passing secret-scanning checks.
Required behavior: Investigate every alert; rotate/remediate true secret through reviewed process.
Bounds: `B-SECRET-ALERTS`.
Schemas: `S-SECURITY-GATE-RESULT`.
Failures: `F-SECURITY-GATE`.
Forbidden: Printing secret, committing production key, disabling scan.
PASS: Zero unresolved true secrets; tests ensure private names/values absent from public/repository outputs.

## Task 3.24 — License audit
Purpose: Verify every shipped dependency/asset has approved licensing evidence.
Preconditions: Task 3.23 passed.
Allowed scope: Existing license script, manifests, required notices, obsolete removal.
Inputs: Lockfiles, parser manifest, vendored cryptography/fonts/assets.
Outputs: Passing deterministic license report.
Required behavior: Every shipped item maps to approved dependency identity/license.
Bounds: `B-DEPENDENCY-COUNT`.
Schemas: `S-SECURITY-GATE-RESULT`.
Failures: `F-SECURITY-GATE`.
Forbidden: Unknown/unapproved license, runtime license service, dependency addition.
PASS: License check passes with complete notices and no obsolete package.

## Task 3.25 — Clean-machine disaster recovery
Purpose: Prove repository/configuration can rebuild and recover without hidden local state.
Preconditions: Task 3.24 passed.
Allowed scope: Disposable clean checkout/build/test/deploy-dry-run and reviewed runbook corrections.
Inputs: Protected-source equivalent commit, documented tools, non-secret configuration, test secrets.
Outputs: Reproducible build hashes and recovery report.
Required behavior: Follow runbook once; use no old chat/shell history; verify private/public topology and key-generation procedure.
Bounds: `B-RECOVERY-WALL-MS`, `B-CI-JOB-MINUTES`.
Schemas: `S-RECOVERY-RESULT`.
Failures: `F-RECOVERY-GATE`.
Forbidden: Production mutation, copied personal cache as requirement, undocumented step.
PASS: Clean environment builds/tests/dry-runs and reproduces pinned assets; disposable artifacts removed.

## Task 3.26 — Final exact-zero account re-attestation
Purpose: Confirm release has no charge path before trust/release work.
Preconditions: Task 3.25 passed.
Allowed scope: Read-only account/config/billing inspection and signed owner checklist record.
Inputs: Cloudflare, Groq, OpenRouter and GitHub target account configurations.
Outputs: Exact-zero attestation in `BUILD_LOG.md` without secrets.
Required behavior: Confirm Free-only routes, no paid overflow/top-up/second runtime and quota fail-closed controls.
Bounds: `B-BROWSER-RUN-DAY-MS`, `B-RATE-ATTEMPTS`, `B-PROVIDER-ATTEMPTS-TOTAL`.
Schemas: `S-ZERO-COST-RESULT`.
Failures: `F-QUOTA-EXHAUSTED`, `F-ZERO-COST-GATE`.
Forbidden: Enabling billing, accepting budget alert, charged fallback.
PASS: Owner and deterministic configuration checks attest GBP/USD 0.00 upfront/recurring.

## PHASE 3 EXIT GATE
Run all Phase 3 security, privacy, cost, reliability and performance gates plus
all earlier regressions. Doctor, architecture lint/hash, CI and exact-zero must
pass. Report `PHASE 3 — PASS` or `PHASE 3 — BLOCKED`, then stop for Phase 4
owner authorization.

---

# 45. PHASE 4 — TRUST AND PORTFOLIO FINISH

Implement only after explicit owner authorization and Phase 3 PASS.

## Task 4.1 — Trust page
Purpose: Publish accurate system trust, privacy and integrity behavior.
Preconditions: Phase 3 exit passed and Phase 4 is owner-authorized.
Allowed scope: Static Trust page, reviewed diagrams/text, links, tests.
Inputs: Binding Architecture 2.1 and verified release evidence.
Outputs: Static accessible Trust page.
Required behavior: State boundary, processors, exact-zero, English/desktop scope, no-copy and honest limits exactly.
Bounds: `B-TRUST-PAGE-CHARS`, `B-FRONTEND-JS-GZIP-BYTES`.
Schemas: `S-TRUST-CLAIMS`.
Failures: `F-TRUST-CONTENT-GATE`.
Forbidden: Malware-scanned/unhackable/universal-PII/no-provider-metadata claims or new telemetry.
PASS: Claim allow/deny lint, accessibility, links and owner content review pass.

## Task 4.2 — Collect/Never Collect disclosure
Purpose: Give visitors a concise plain-language data lifecycle.
Preconditions: Task 4.1 passed.
Allowed scope: Trust-page disclosure component and tests.
Inputs: Section 30 lifecycle and approved EDR.
Outputs: Exact Collect/Process/Never Collect disclosure.
Required behavior: Distinguish request-only processing, the anonymous quota state, public keys/sample and provider metadata.
Bounds: `B-TRUST-PAGE-CHARS`, `B-UI-TEXT-CHARS`.
Schemas: `S-TRUST-CLAIMS`.
Failures: `F-TRUST-CONTENT-GATE`.
Forbidden: Absolute no-recording claim, hidden AI processing, source-upload wording.
PASS: Every Section 30 row maps once to accurate plain language; owner review passes.

## Task 4.3 — Browser-local verifier
Purpose: Verify report digest and both signatures without network processing.
Preconditions: Task 4.2 passed.
Allowed scope: Static local verifier UI, existing pinned verification code, tests.
Inputs: User-selected PDF, Schema `S-SIGNATURE-MANIFEST`, published public keys.
Outputs: Per-check local verification result.
Required behavior: Read in browser memory; verify SHA-256, Ed25519 and ML-DSA-65 independently; require all three.
Bounds: `B-FINAL-PDF-BYTES`, `B-SIGNATURE-MANIFEST-BYTES`, `B-VERIFIER-TIMEOUT-MS`.
Schemas: `S-SIGNATURE-MANIFEST`, `S-VERIFICATION-RESULT`.
Failures: `F-SIGNING-FAILURE`, `F-OUTPUT-SIZE`.
Forbidden: Upload, private key, one-algorithm success, persistence.
PASS: Valid sample passes; changed PDF/manifest/key/signatures fail expected checks Chrome/Edge with zero network/storage.

## Task 4.4 — Independent CLI verifier
Purpose: Provide non-browser independent hybrid verification.
Preconditions: Task 4.3 passed.
Allowed scope: Small deterministic CLI using approved/pinned primitives, fixtures, docs.
Inputs: Paths to PDF, manifest and public-key document.
Outputs: Exit 0 with fixed success JSON or nonzero fixed error.
Required behavior: Strict parse/bounds; independently hash and verify both; no network.
Bounds: `B-FINAL-PDF-BYTES`, `B-SIGNATURE-MANIFEST-BYTES`, `B-VERIFIER-TIMEOUT-MS`.
Schemas: `S-SIGNATURE-MANIFEST`, `S-VERIFICATION-RESULT`.
Failures: `F-SIGNING-FAILURE`, `F-OUTPUT-SIZE`.
Forbidden: Private secret, remote service, partial success exit 0.
PASS: Valid/changed/malformed/key mismatch tests and clean-machine invocation pass.

## Task 4.5 — Public key publication
Purpose: Publish stable verification keys and identifiers safely.
Preconditions: Task 4.4 passed.
Allowed scope: Static public-key manifest, Pages links, rotation documentation, tests.
Inputs: Reviewed production Ed25519/ML-DSA-65 public keys and IDs.
Outputs: Strict public key document.
Required behavior: Match signer key-ID derivation; retain prior public keys after future rotation.
Bounds: `B-PUBLIC-KEY-DOCUMENT-BYTES`, `B-PUBLIC-KEYS`.
Schemas: `S-PUBLIC-KEY-DOCUMENT`.
Failures: `F-SIGNING-FAILURE`.
Forbidden: Private/seed material, secret logs, undocumented replacement.
PASS: IDs/lengths/algorithms match production signer and both verifiers; secret scan passes.

## Task 4.6 — Signed static sample presentation
Purpose: Present the pre-generated synthetic analysis as a credible fallback.
Preconditions: Task 4.5 passed.
Allowed scope: Static sample page/dashboard links/downloads/verification actions.
Inputs: Task 2.14 artifacts and published keys.
Outputs: Accessible labelled sample experience.
Required behavior: Label pre-generated synthetic sample, link PDF/manifest/verifiers, work without live analysis.
Bounds: `B-STATIC-ASSET-BYTES`, `B-FINAL-PDF-BYTES`, `B-SIGNATURE-MANIFEST-BYTES`.
Schemas: `S-SIGNATURE-MANIFEST`, `S-PUBLIC-KEY-DOCUMENT`.
Failures: `F-TRUST-CONTENT-GATE`.
Forbidden: Real data, live compute dependency, second host, misleading live label.
PASS: Offline/static journey and both verifiers pass; links/accessibility/label pass.

## Task 4.7 — README
Purpose: Give a concise accurate project entry point.
Preconditions: Task 4.6 passed.
Allowed scope: README and link checks.
Inputs: Final architecture, build/run/verify commands and trust links.
Outputs: Current concise README.
Required behavior: Explain mission, topology, privacy, exact-zero, supported scope, local setup, verification and phase status.
Bounds: `B-README-CHARS`.
Schemas: `S-TRUST-CLAIMS`.
Failures: `F-DOCUMENTATION-GATE`.
Forbidden: Stale Google/server/email/BYOK instructions, unsupported claims, duplicated architecture.
PASS: Commands/links/status/claims verified on clean checkout; Markdown lint passes.

## Task 4.8 — Operational runbook
Purpose: Enable low-attention operation and deterministic recovery.
Preconditions: Task 4.7 passed.
Allowed scope: Concise owner runbook using existing scripts/configuration.
Inputs: Deployment, secrets, Doctor, quota, key and incident procedures.
Outputs: Reviewed runbook.
Required behavior: Cover deploy/verify, secret/key compromise, provider model config, quota, rollback and disaster recovery with owner checkpoints.
Bounds: `B-RUNBOOK-CHARS`, `B-RECOVERY-WALL-MS`.
Schemas: `S-RECOVERY-RESULT`, `S-ZERO-COST-RESULT`.
Failures: `F-RECOVERY-GATE`, `F-ZERO-COST-GATE`.
Forbidden: Secret values, cron/AI maintenance, paid fallback, autonomous change.
PASS: Clean-machine operator follows every non-destructive procedure once; links/commands/claims pass.

## Task 4.9 — Architecture case study
Purpose: Explain the engineering decisions and evidence honestly.
Preconditions: Task 4.8 passed.
Allowed scope: Static case-study content and reviewed diagrams.
Inputs: Architecture, EDRs and concise build evidence.
Outputs: Portfolio case study.
Required behavior: Explain exact-zero pivot, browser boundary, direct DO, three-stage AI, Browser Run and hybrid signing with limitations.
Bounds: `B-CASE-STUDY-CHARS`, `B-STATIC-ASSET-BYTES`.
Schemas: `S-TRUST-CLAIMS`.
Failures: `F-DOCUMENTATION-GATE`.
Forbidden: Research diary, secret/resource identifiers, inflated claims, obsolete target as current.
PASS: Architecture/EDR consistency, links, accessibility and owner editorial review pass.

## Task 4.10 — Portfolio explanation
Purpose: Communicate Aethelgard's value to a non-specialist reviewer.
Preconditions: Task 4.9 passed.
Allowed scope: Static concise portfolio copy and navigation.
Inputs: Mission, verified features and honest limits.
Outputs: Accessible portfolio explanation.
Required behavior: Describe open→analyze→no-copy outcome and demonstrable engineering without jargon dependence.
Bounds: `B-PORTFOLIO-COPY-CHARS`, `B-UI-TEXT-CHARS`.
Schemas: `S-TRUST-CLAIMS`.
Failures: `F-DOCUMENTATION-GATE`.
Forbidden: SaaS promises, SLA, unsupported browser/language, false security/cost claim.
PASS: Claim lint, readability, links, responsive desktop and owner review pass.

## Task 4.11 — Clean-machine final verification
Purpose: Prove a reviewer can build, inspect, verify and understand the system.
Preconditions: Task 4.10 passed.
Allowed scope: Disposable clean checkout and full pre-production verification; documentation fixes only.
Inputs: Reviewed release candidate and runbook.
Outputs: Schema `S-RECOVERY-RESULT` with hashes/measurements only.
Required behavior: Build/test/Doctor/lint/hash, verify sample/changed byte/both algorithms, inspect privacy and dry-run deploy.
Bounds: `B-RECOVERY-WALL-MS`, `B-CI-JOB-MINUTES`.
Schemas: `S-RECOVERY-RESULT`, `S-VERIFICATION-RESULT`.
Failures: `F-RECOVERY-GATE`, `F-SECURITY-GATE`.
Forbidden: Production mutation, hidden local state, skipped gate, Phase 5 scaffold.
PASS: Clean machine completes every step from runbook and repository returns clean.

## Task 4.12 — Final production release and live verification
Purpose: Promote the owner-reviewed release and verify the final live system.
Preconditions: Task 4.11 passed; release commit/PR and production promotion are explicitly owner-reviewed.
Allowed scope: Existing Cloudflare Pages/public edge/private TrustedRuntime deployment, live synthetic verification, static evidence, rollback if gate fails.
Inputs: Owner-approved release commit, existing production secrets/bindings, synthetic fixtures only.
Outputs: Verified live Architecture 2.1 release or rolled-back blocked state.
Required behavior: Verify public Pages path, secret-free edge, private TrustedRuntime, live Turnstile, approved free AI, Browser Run, exact-byte hybrid signing, local/CLI verification, Doctor, no persistent application logging, exact-zero, sample, Trust page, no legacy dependency, clean repository.
Bounds: `B-ANALYSIS-WALL-MS`, `B-BROWSER-RUN-DAY-MS`, `B-WORKER-GZIP-BYTES`, `B-TRUSTED-MEMORY-BYTES`, `B-ANALYSIS-RESPONSE-BYTES`.
Schemas: `S-ANALYZE-REQUEST`, `S-ANALYZE-RESPONSE`, `S-SIGNATURE-MANIFEST`, `S-VERIFICATION-RESULT`, `S-ZERO-COST-RESULT`.
Failures: `F-TURNSTILE-FAILURE`, `F-GROQ-FAILURE`, `F-OPENROUTER-FAILURE`, `F-BROWSER-RUN-FAILURE`, `F-PDF-VALIDATION`, `F-SIGNING-FAILURE`, `F-ZERO-COST-GATE`, `F-RECOVERY-GATE`.
Forbidden: Paid fallback, second host, new runtime/persistence, generic signer, legacy service reactivation.
PASS: Owner-reviewed promotion and complete live synthetic path pass; independent verification and changed-byte rejection pass; Doctor/CI/cleanliness/exact-zero pass; evidence recorded without secrets.

Trust page must explain:

### Never leaves browser

* raw file;
* unredacted extracted text;
* PII mapping.

### Leaves browser

* redacted source content;
* Turnstile token.

### External processors

* Cloudflare;
* Groq or OpenRouter;
* Browser Run.

### Never stored by Aethelgard

* document;
* report history;
* prompt history;
* user account.

### Honest limits

* no malware scanning claim;
* English-only PII scope;
* no guarantee against compromised client device;
* provider/platform metadata outside Aethelgard application storage;
* no uptime SLA.

## PHASE 4 EXIT GATE — PROJECT COMPLETE

A clean machine can:

* inspect project;
* verify sample PDF;
* reject a changed byte;
* verify both algorithms;
* understand the privacy boundary;
* recover/deploy the project from the runbook.

Only after Tasks 4.1–4.12 and all prior phase regressions pass, the reviewed
production release is live, repository/production evidence is clean, and the
owner accepts the release, report `PROJECT COMPLETE`.

Do not add a Phase 5 feature playground.

A finished machine is allowed to remain finished.

---

# 46. MERGE AND REVIEW RULE

Human review is mandatory before code reaches protected `main`.

A phase branch may contain multiple completed task commits.

Every task must pass before the next begins.

A phase is not complete merely because code exists.

A phase is complete only after its exit test passes.

Never call:

* partial;
* mostly done;
* works locally;
* should work

a phase PASS.

---

# 47. PROJECT-FOLDER CLEANLINESS RULE

At the end of every task:

remove disposable:

* temporary builds;
* test PDFs;
* throwaway keys;
* temporary profiles;
* ad-hoc logs;
* local proof folders

unless deliberately retained as:

* frozen regression fixture;
* required source;
* published synthetic sample;
* required public verification artifact.

Do not let the repository accumulate analysis debris again.

---

# 48. NO WORK-AHEAD RULE

Do not create:

* future-phase interfaces;
* empty future folders;
* placeholder services;
* unused dependencies;
* TODO scaffolding;
* speculative abstractions

merely because later phases may need them.

Build the current task.

Nothing more.

---

# 49. NO RESEARCH LOOP RULE

Codex's job is implementation.

Do not respond to an implementation problem with a broad research project.

If exact syntax of an already-approved vendor API is needed, consult the minimum official documentation necessary to implement that named API.

That is implementation reference work.

It is not permission to:

* compare vendors;
* reconsider architecture;
* propose alternatives.

---

# 50. OWNER AUTHORIZATION GOVERNANCE

This specification defines the immutable phase/task order and gates. It does
not encode live phase authorization. `BUILD_LOG.md` and concise agent guidance
record current owner authorization and implementation state.

Each phase requires explicit owner authorization after the preceding phase PR
is reviewed, merged, and verified. Authorization for one phase never
authorizes the next phase, an architecture change, a paid service, or unrelated
work. Human review remains mandatory before protected `main` changes.

---

# 51. REQUIRED REPORTING STYLE

Do not return a long essay after every task.

For normal task completion use:

```text
Task N.x — PASS

Changed:
- ...

Verified:
- ...

Constraints:
- £0: PASS
- Privacy: PASS
- Security: PASS
- Architecture drift: NONE

Commit:
<hash>

Next:
Task N.y
```

Continue to the next authorized task in the same phase.

At a true phase boundary, stop.

At an actual architecture blocker use:

```text
PHASE N — BLOCKED

Task:
...

Hard invariant:
...

Evidence:
...

Why an Architecture 2.1-compliant implementation cannot satisfy both:
...

No alternative architecture has been implemented.
```

Do not bury blockers in prose.

---

# 52. FINAL SYSTEM SUMMARY

The target is intentionally small:

```text
FILE
|
v
LOCAL BROWSER
validate
parse
language gate
redact
|
| redacted records only
v
SECRET-FREE EDGE
rate / route / bounds
|
v
PRIVATE TRUSTEDRUNTIME
Turnstile
Groq -> OpenRouter Free
Strawman
Steelman
Oracle
report
Browser Run
SHA-256
Ed25519
ML-DSA-65
|
v
BROWSER MEMORY
dashboard
download
```

Persistent application state:

```text
UTC date
+
aggregate Browser Run milliseconds
```

That's all.

Runtime external relationships:

```text
Cloudflare
Groq
OpenRouter
GitHub
```

No user account.

No document store.

No report store.

No email.

No BYOK.

No server parser.

No second backend.

No autonomous repair AI.

No paid fallback.

No unnecessary machinery.

The design objective is not maximum capability.

It is:

> **the smallest durable machine that proves the complete Aethelgard mission with excellent engineering, strong privacy, strong security, exact-zero cost, cryptographic trust, premium Scandinavian information design, predictable fault protection, and very little maintenance.**

Build that machine.

Then stop.

---

# 53. CANONICAL BOUNDS REGISTRY

Every value is inclusive unless the comparison says otherwise. A bound failure
uses the named Failure Registry entry or the nearest task-named failure. No
implementation may silently truncate to satisfy a bound.

| Bound ID | Exact value | Unit | Scope | Failure behavior |
|---|---:|---|---|---|
| B-SOURCE-BYTES | 15,728,640 | bytes | One selected source file | `F-OVERSIZED-DOCUMENT` before parsing |
| B-LOCAL-FILENAME-CHARS | 512 | UTF-16 code units | Local filename only | `F-INVALID-DOCUMENT`; never transmit |
| B-SELECTION-COUNT | 1 | file | One operation | `F-INVALID-DOCUMENT` |
| B-ARCHIVE-ENTRIES | 512 | entries | ZIP/Office container | `F-HOSTILE-DOCUMENT` |
| B-ARCHIVE-TOTAL-BYTES | 67,108,864 | expanded bytes | Whole archive | `F-HOSTILE-DOCUMENT` |
| B-ARCHIVE-ENTRY-BYTES | 16,777,216 | expanded bytes | One archive entry | `F-HOSTILE-DOCUMENT` |
| B-ARCHIVE-RATIO | 100 | expanded/compressed ratio | One non-empty entry | `F-HOSTILE-DOCUMENT` |
| B-ARCHIVE-PATH-BYTES | 512 | UTF-8 bytes | One archive path | `F-HOSTILE-DOCUMENT` |
| B-INFLATE-CHUNKS | 8,192 | chunks | One entry stream | `F-HOSTILE-DOCUMENT` |
| B-PREFLIGHT-TIMEOUT-MS | 10,000 | ms | One preflight Worker | Terminate; `F-PARSER-TIMEOUT` |
| B-PARSER-TIMEOUT-MS | 30,000 | ms | One parser attempt | Terminate; apply retry registry |
| B-PARSER-RETRY-COUNT | 1 | fresh attempts after first | Parser crash/timeout/allocation only | Then Safe Mode |
| B-REDACTION-TIMEOUT-MS | 10,000 | ms | One Redaction Worker | Terminate; `F-REDACTION-FAILURE` |
| B-REDACTION-RETRY-COUNT | 0 | retries | Redaction | Safe Mode; no network |
| B-PARSER-STRUCTURAL-UNITS | 100,000 | units | One document/parser traversal | `F-INVALID-DOCUMENT` |
| B-PARSER-RESULT-BYTES | 10,485,760 | UTF-8 JSON bytes | Worker result | `F-INVALID-DOCUMENT` |
| B-PDF-PAGES | 500 | pages | PDF | `F-INVALID-DOCUMENT` |
| B-DOCX-PARAGRAPHS | 20,000 | paragraphs | DOCX | `F-INVALID-DOCUMENT` |
| B-DOCX-TABLES | 2,000 | tables | DOCX | `F-INVALID-DOCUMENT` |
| B-DOCX-ROWS | 5,000 | rows per table | DOCX | `F-INVALID-DOCUMENT` |
| B-DOCX-COLUMNS | 256 | cells per row | DOCX | `F-INVALID-DOCUMENT` |
| B-PPTX-SLIDES | 500 | slides | PPTX | `F-INVALID-DOCUMENT` |
| B-PPTX-SHAPES | 10,000 | shapes per slide | PPTX | `F-INVALID-DOCUMENT` |
| B-PPTX-TABLE-CELLS | 50,000 | cells per slide | PPTX | `F-INVALID-DOCUMENT` |
| B-XLSX-SHEETS | 200 | sheets | XLSX | `F-INVALID-DOCUMENT` |
| B-XLSX-ROWS | 100,000 | rows per sheet | XLSX | `F-INVALID-DOCUMENT` |
| B-XLSX-COLUMNS | 16,384 | columns per sheet | XLSX | `F-INVALID-DOCUMENT` |
| B-XLSX-VISITED-CELLS | 200,000 | cells | Whole XLSX | `F-INVALID-DOCUMENT` |
| B-CSV-ROWS | 100,000 | logical rows | CSV | `F-INVALID-DOCUMENT` |
| B-CSV-COLUMNS | 1,000 | fields per row | CSV | `F-INVALID-DOCUMENT` |
| B-SOURCE-RECORDS | 100,000 | local records | Parser/redactor operation | `F-INVALID-DOCUMENT` |
| B-NETWORK-SOURCE-RECORDS | 512 | records | Analyze request | `F-NETWORK-BOUNDARY-FAILURE` |
| B-SOURCE-TEXT-CHARS | 100,000 | Unicode code points | One local source record | `F-INVALID-DOCUMENT` |
| B-SOURCE-REFERENCE-CHARS | 128 | UTF-8 bytes | Serialized neutral reference | `F-INVALID-DOCUMENT` |
| B-DOCUMENT-TEXT-CHARS | 2,000,000 | Unicode code points | Extracted document | `F-INVALID-DOCUMENT` |
| B-EXTRACTED-WORDS | 8,000 | Unicode word runs | Extracted document | `F-OVERSIZED-DOCUMENT` |
| B-LANGUAGE-MIN-LETTERS | 40 | Unicode alphabetic letters | Language evidence | `F-UNSUPPORTED-LANGUAGE` below |
| B-LANGUAGE-MIN-TOKENS | 8 | letter-bearing tokens | Language evidence | `F-UNSUPPORTED-LANGUAGE` below |
| B-LANGUAGE-MARGIN | 2,000 | integer basis points | English normalized-score lead over runner-up | `F-UNSUPPORTED-LANGUAGE` below |
| B-LANGUAGE-SAMPLE-CHARS | 20,000 | Unicode code points | Deterministic leading normalized sample | `F-UNSUPPORTED-LANGUAGE` if inconclusive |
| B-PII-MAPPINGS | 10,000 | placeholders | One redaction operation | `F-PII-GATE-FAILURE` |
| B-PLACEHOLDER-CHARS | 64 | ASCII chars | One placeholder | `F-PII-GATE-FAILURE` |
| B-PII-CORPUS-CASES | 84 | cases | Frozen baseline | `F-PII-GATE-FAILURE` on mismatch |
| B-PII-CORPUS-ENTITIES | 576 | labelled entities | Frozen baseline | `F-PII-GATE-FAILURE` on mismatch |
| B-NETWORK-REQUESTS | 128 | observed requests | One browser proof journey | `F-NETWORK-BOUNDARY-FAILURE` above |
| B-BROWSER-STORAGE-WRITES | 0 | user-data writes | Every journey | `F-NETWORK-BOUNDARY-FAILURE` |
| B-ANALYZE-BODY-BYTES | 524,288 | bytes | Public/trusted request body | HTTP 413; no trusted work |
| B-BODY-CHUNKS | 1,024 | chunks | Request read | Safe 400/413 |
| B-BODY-READ-TIMEOUT-MS | 5,000 | ms | Request read | Safe 400 |
| B-TURNSTILE-TOKEN-CHARS | 2,048 | UTF-16 code units | Token | `F-TURNSTILE-FAILURE` |
| B-TURNSTILE-TIMEOUT-MS | 5,000 | ms | Siteverify | `F-TURNSTILE-FAILURE` |
| B-TURNSTILE-RESPONSE-BYTES | 8,192 | bytes | Siteverify response | `F-TURNSTILE-FAILURE` |
| B-REQUESTED-OUTPUTS | 3 | unique enum values | Analyze request | Strict schema rejection |
| B-AI-REQUEST-BYTES | 524,288 | UTF-8 bytes | One provider request | Safe Mode before call |
| B-AI-TIMEOUT-MS | 30,000 | ms | One provider attempt | `F-AI-TIMEOUT` |
| B-AI-RESPONSE-BYTES | 262,144 | bytes | One provider response | `F-INVALID-AI-SCHEMA` |
| B-MODEL-OUTPUT-TOKENS | 4,096 | tokens | One provider attempt | Hard provider failure |
| B-STRAWMAN-FINDINGS | 24 | items | Strawman | Strict schema rejection |
| B-STEELMAN-ITEMS | 24 | items | Steelman | Strict schema rejection |
| B-ORACLE-FINDINGS | 24 | items | Oracle | Strict schema rejection |
| B-RECOMMENDATIONS | 16 | items | Oracle/report | Strict schema rejection |
| B-RISKS | 16 | items | One AI stage/report | Strict schema rejection |
| B-ASSUMPTIONS | 16 | items | Strawman | Strict schema rejection |
| B-EVIDENCE-REFERENCES | 8 | refs per item | Any AI item | Strict schema rejection |
| B-QUANTITATIVE-CANDIDATES | 24 | items | One stage/report | Strict schema rejection |
| B-PROVIDER-ATTEMPTS-PER-STAGE | 2 | attempts | Groq then OpenRouter Free | Safe Mode after second |
| B-PROVIDER-ATTEMPTS-TOTAL | 6 | attempts | Whole analysis | Safe Mode above |
| B-ANALYSIS-WALL-MS | 180,000 | ms | Full analysis | Cancel; Safe Mode |
| B-APP-SHELL-MS | 2,000 | ms | Initial interactive target | `F-PERFORMANCE-GATE` |
| B-ENGINE-COLD-MS | 10,000 | ms | Clean-cache parser ready target | `F-PERFORMANCE-GATE` |
| B-LOCAL-WARM-MS | 2,000 | ms | Validate/parse/language/redact median target | `F-PERFORMANCE-GATE` |
| B-ANALYSIS-MEDIAN-MS | 90,000 | ms | Full release corpus median | `F-PERFORMANCE-GATE` |
| B-PDF-RENDER-MEDIAN-MS | 5,000 | ms | Browser Run median target | `F-PERFORMANCE-GATE` |
| B-PDF-RENDER-TIMEOUT-MS | 15,000 | ms | One Browser Run operation | `F-BROWSER-RUN-FAILURE` |
| B-SIGNING-MEDIAN-MS | 50 | ms | Exact-byte hybrid signing target | `F-PERFORMANCE-GATE` |
| B-FRONTEND-JS-GZIP-BYTES | 307,200 | compressed bytes | Initial JS excluding lazy parser assets | Release blocked |
| B-STATIC-ASSET-BYTES | 26,214,400 | bytes | One Pages static asset | Release blocked |
| B-WORKER-GZIP-BYTES | 2,516,582 | compressed bytes | Each Worker | Release blocked |
| B-PUBLIC-CPU-P99-MS | 8 | ms | Public edge p99 | `F-PERFORMANCE-GATE` |
| B-TRUSTED-MEMORY-BYTES | 100,663,296 | bytes | TrustedRuntime measured peak | `F-PERFORMANCE-GATE` |
| B-ANALYSIS-RESPONSE-BYTES | 8,388,608 | bytes | Complete response | `F-OUTPUT-SIZE` |
| B-FINAL-PDF-BYTES | 8,388,608 | bytes | Final PDF | `F-PDF-VALIDATION` |
| B-PDF-QUEUE-DEPTH | 2 | active+waiting jobs | TrustedRuntime instance | Fixed busy failure |
| B-BROWSER-RUN-DAY-MS | 480,000 | aggregate ms per UTC day | Anonymous DO state | `F-QUOTA-EXHAUSTED` |
| B-RATE-ATTEMPTS | 5 | accepted attempts | Source IP/location/window | `F-RATE-LIMITED` |
| B-RATE-WINDOW-SECONDS | 60 | seconds | Rate window | `F-RATE-LIMITED` |
| B-UI-FINDINGS | 24 | rendered findings | Dashboard | Safe Mode/schema failure |
| B-UI-TEXT-CHARS | 200,000 | Unicode code points | One rendered view/model | `F-OUTPUT-SIZE` |
| B-CHARTS | 8 | charts | One report | Omit above bound |
| B-CHART-POINTS | 64 | points per chart | Chart data | Omit chart |
| B-REPORT-TOKEN-COUNT | 64 | tokens | Report token projection | Build failure |
| B-REPORT-SECTIONS | 32 | sections | Report | `F-OUTPUT-SIZE` |
| B-REPORT-HTML-BYTES | 1,048,576 | UTF-8 bytes | Browser Run HTML | `F-OUTPUT-SIZE` |
| B-XLSX-OUTPUT-BYTES | 4,194,304 | bytes | XLSX output | `F-OUTPUT-SIZE` |
| B-XLSX-OUTPUT-SHEETS | 8 | sheets | XLSX output | `F-OUTPUT-SIZE` |
| B-XLSX-OUTPUT-ROWS | 1,000 | rows per sheet | XLSX output | `F-OUTPUT-SIZE` |
| B-XLSX-OUTPUT-COLUMNS | 32 | columns per row | XLSX output | `F-OUTPUT-SIZE` |
| B-TEXT-OUTPUT-BYTES | 1,048,576 | UTF-8 bytes | Text/Markdown output | `F-OUTPUT-SIZE` |
| B-RESPONSE-PARTS | 4 | fixed parts | Analyze response | `F-OUTPUT-SIZE` |
| B-OBJECT-URL-LIFETIME-MS | 300,000 | ms | Download object URL maximum | Revoke automatically |
| B-SIGNATURE-MANIFEST-BYTES | 32,768 | UTF-8 bytes | Detached manifest | `F-SIGNING-FAILURE` |
| B-HOSTILE-CORPUS-CASES | 256 | cases | Frozen hostile corpus maximum | Release blocked above/change mismatch |
| B-BROWSER-TEST-ALLOCATION-BYTES | 50,331,648 | bytes | Allocation-pressure proof | Must fail/recover within Worker |
| B-SCHEMA-MUTATIONS | 512 | cases per registry schema | Release mutation suite | Release blocked above |
| B-DOCTOR-CHECKS | 128 | checks | One Doctor run | Doctor failure above |
| B-CI-JOB-MINUTES | 20 | minutes | One standard CI job | Cancel/fail |
| B-DEPENDENCY-ALERTS | 100 | alerts | Bounded review batch | Phase blocked above |
| B-SECRET-ALERTS | 100 | alerts | Bounded review batch | Phase blocked above |
| B-DEPENDENCY-COUNT | 250 | resolved packages/assets | License audit | Phase blocked above |
| B-RECOVERY-WALL-MS | 1,800,000 | ms | Clean-machine procedure | `F-RECOVERY-GATE` |
| B-TRUST-PAGE-CHARS | 20,000 | Unicode code points | Trust page copy | `F-DOCUMENTATION-GATE` |
| B-VERIFIER-TIMEOUT-MS | 10,000 | ms | One local verification | Fail verification |
| B-PUBLIC-KEY-DOCUMENT-BYTES | 32,768 | UTF-8 bytes | Published key document | `F-SIGNING-FAILURE` |
| B-PUBLIC-KEYS | 16 | retained public keys | Published key document | Owner-reviewed rotation needed |
| B-README-CHARS | 20,000 | Unicode code points | README | `F-DOCUMENTATION-GATE` |
| B-RUNBOOK-CHARS | 40,000 | Unicode code points | Runbook | `F-DOCUMENTATION-GATE` |
| B-CASE-STUDY-CHARS | 40,000 | Unicode code points | Case study | `F-DOCUMENTATION-GATE` |
| B-PORTFOLIO-COPY-CHARS | 10,000 | Unicode code points | Portfolio explanation | `F-DOCUMENTATION-GATE` |

---

# 54. CANONICAL SCHEMA REGISTRY

All object schemas are strict: every listed field is required unless marked
optional, additional fields are rejected, arrays are readonly after validation,
integers are finite safe integers, and strings use the referenced bounds.

### S-BROWSER-INPUT-RESULT
Union: `{ok:true, document:{file:File, format:DocumentFormat, byteLength:int}}`
or `{ok:false, code:"selection_count"|"empty"|"too_large"|"invalid_name"|"unsupported_format", message:string}`.

### S-PREFLIGHT-RESULT
Union: `{ok:true, byteLength:int, archiveEntries:int}` or `{ok:false,
code:"size_invalid"|"magic_invalid"|"archive_malformed"|"archive_limit"|
"archive_encrypted"|"archive_path"|"xml_unsafe"|"external_relationship"|
"active_content"|"embedded_content"|"pdf_encrypted"|"pdf_active_content"|
"text_invalid", message:string}`.

### S-PARSER-REQUEST
Exact transferable object `{kind, format, buffer}`. `format` is
`pdf|docx|pptx|xlsx|csv|txt`; `buffer` is one transferred `ArrayBuffer` within
`B-SOURCE-BYTES`; `kind` is `preflight|parse_pdf|parse_docx|parse_pptx|parse_xlsx|parse_csv|parse_txt`
and must match `format` for parse operations.

### S-SOURCE-REFERENCE
Exact discriminated union: `{kind:"pdf_page",page:int}`;
`{kind:"docx_paragraph",paragraph:int}`;
`{kind:"docx_table_cell",table:int,row:int,column:int}`;
`{kind:"pptx_slide",slide:int}`;
`{kind:"xlsx_cell",sheet:int,cell:string}`;
`{kind:"csv_field",row:int,column:int}`; or
`{kind:"txt_lines",line_start:int,line_end:int}`. All indices are one-based,
positive and monotonic in document order. `cell` is uppercase A1 notation.

### S-PARSER-RESULT
Strict local union with `schema_version:"1"`, `format`, and one non-empty
ordered collection: PDF `{pages:[{page:int,content:string}]}`; other formats
`{sources:[...]}` using their parser-native exact structural fields and
`content:string`. Failure is the strict safe parser/preflight failure union.
The native fields map one-to-one to `S-SOURCE-REFERENCE` in Task 1.8.

### S-NORMALIZED-SOURCE-RECORD
Exact object `{schema_version:"1", ordinal:int, reference:S-SOURCE-REFERENCE,
content:string}`. `ordinal` is one-based contiguous document order. Before
redaction `content` is local-only; after redaction it contains placeholders.

### S-REDACTION-REQUEST
Exact object `{schema_version:"1", sources:S-NORMALIZED-SOURCE-RECORD[]}`;
local-only, no filename or binary.

### S-REDACTION-RESULT
Exact object `{schema_version:"1", sources:S-NORMALIZED-SOURCE-RECORD[],
placeholder_count:int, must_redact_leaks:0}`. The placeholder mapping is
deliberately absent and must be destroyed inside the Worker.

### S-LANGUAGE-DECISION
Union `{schema_version:"1",accepted:true,language:"eng",letters:int,tokens:int,
margin:int}` or `{schema_version:"1",accepted:false,reason:"insufficient"|
"non_english"|"mixed_or_uncertain"}`. It applies the exact Section 5.3 rule.
`margin` is exactly `round((eng_score - runner_up_score) * 10,000)` integer
basis points, where the named scores are the first two `francAll` tuple values.

### S-FOCUS
String enum `full|financial|strategic|security`.

### S-REQUESTED-OUTPUTS
Non-empty unique array in canonical order from `pdf|xlsx|text`, maximum
`B-REQUESTED-OUTPUTS`; PDF is selected by default in UI.

### S-ANALYZE-REQUEST
Exact object `{schema_version:"1",turnstile_token:string,focus:S-FOCUS,
requested_outputs:S-REQUESTED-OUTPUTS,sources:S-NORMALIZED-SOURCE-RECORD[]}`.
Sources must be redacted, at most `B-NETWORK-SOURCE-RECORDS`; the complete UTF-8
JSON body is at most `B-ANALYZE-BODY-BYTES`. No other field is permitted.

### S-TRUSTED-ANALYZE-REQUEST
The same exact fields/values as `S-ANALYZE-REQUEST` after a fresh strict Zod
parse inside TrustedRuntime. The Turnstile token is consumed before AI and is
not included in any AI request.

### S-AI-TRANSPORT-REQUEST
Exact internal object `{schema_version:"1",stage:"strawman"|"steelman"|
"oracle",provider:"groq"|"openrouter_free",model_id:string,messages:[fixed
system message, fixed user-data message],max_output_tokens:4096}`. Model ID must
equal reviewed configuration; no caller-provided URL/model/message role.

### S-AI-TRANSPORT-RESULT
Union `{ok:true,provider:"groq"|"openrouter_free",body:unknown}` or
`{ok:false,provider,reason:"network"|"rate_limit"|"unavailable"|"policy"|
"timeout"|"too_large"|"invalid_schema"}`. Raw body is request-memory only and
must be immediately parsed into the relevant strict stage schema.

### S-STRAWMAN-OUTPUT
Exact object `{schema_version:"1",findings:Finding[],risks:Risk[],
assumptions:Assumption[],quantitative_candidates:Candidate[]}`. `Finding` is
`{id:string,title:string,analysis:string,confidence:"high"|"medium"|"low",
evidence:S-SOURCE-REFERENCE[]}`. `Risk`/`Assumption` use `{id,text,confidence,
evidence}`. `Candidate` is `{id,label,value:number,unit:string,context:string,
evidence:S-SOURCE-REFERENCE[]}`. Collections use Bounds Registry limits.

### S-STEELMAN-OUTPUT
Exact object `{schema_version:"1",items:Critique[]}` where `Critique` is
`{id:string,strawman_finding_ids:string[],kind:"omission"|"contradiction"|
"counter_evidence"|"unsupported"|"nuance"|"missed_connection",critique:string,
evidence:S-SOURCE-REFERENCE[]}`. IDs are unique and referenced Strawman IDs exist.

### S-ORACLE-OUTPUT
Exact object `{schema_version:"1",executive_summary:string,findings:Finding[],
recommendations:Recommendation[],risks:Risk[],quantitative_candidates:Candidate[],
critique_resolutions:Resolution[]}`. `Recommendation` is `{id,title,action,
priority:"high"|"medium"|"low",confidence,evidence}`. `Resolution` is
`{steelman_item_id,status:"resolved"|"unresolved",explanation:string}` and
covers every Steelman item exactly once. Shared types match `S-STRAWMAN-OUTPUT`.

### S-REPORT-MODEL
Exact service-owned object `{schema_version:"1",focus:S-FOCUS,title:string,
executive_summary:string,findings:Finding[],recommendations:Recommendation[],
risks:Risk[],charts:S-CHART-DATA[],verification:{ed25519_key_id:string,
mldsa65_key_id:string}}`; derived only from validated Oracle data/configuration.

### S-CHART-DATA
Exact object `{schema_version:"1",id:string,title:string,unit:string,
kind:"bar"|"line",points:[{label:string,value:number,
evidence:S-SOURCE-REFERENCE[]}]}` with finite values and registry bounds.

### S-REPORT-TOKENS
Exact readonly projection `{schema_version:"1",paper:string,charcoal:string,
terracotta:string,display_font:string,body_font:string,spacing:number[],
rule_width:number}` from the canonical typed design tokens.

### S-SIGNATURE-MANIFEST
Exact version-1 object `{schema_version:"1",pdf_sha256:string,
ed25519_algorithm:"Ed25519",ed25519_public_key_id:string,
ed25519_signature_b64:string,mldsa65_algorithm:"ML-DSA-65",
mldsa65_public_key_id:string,mldsa65_signature_b64:string}`. Digest is exactly
64 lowercase hexadecimal characters. Signatures are canonical padded base64;
decoded lengths are 64 bytes for Ed25519 and 3,309 bytes for ML-DSA-65. Key IDs
are `ed25519:` or `mldsa65:` plus the first 32 lowercase hex characters of the
SHA-256 of the published public-key bytes. No timestamp exists in version 1.

### S-ANALYZE-RESPONSE
Exact object `{schema_version:"1",dashboard:S-REPORT-MODEL,pdf?:{bytes_b64:string,
signature_manifest:S-SIGNATURE-MANIFEST},xlsx_b64?:string,text_utf8?:string}`.
Optional fields appear only when requested and successfully produced. Entire
serialized response is within `B-ANALYSIS-RESPONSE-BYTES` and is `no-store`.

### S-SAFE-MODE
Exact object `{schema_version:"1",ok:false,category:"document"|"language"|
"privacy"|"verification"|"analysis"|"quota"|"pdf"|"signing"|"client_resource"|
"service",code:string,message:string,retry:"none"|"fresh_document"|
"fresh_turnstile"|"later"}`. Message is fixed and contains no input/provider secret.

### S-SAFE-ERROR
Exact HTTP JSON `{ok:false,error:{code:string,message:string}}` with fixed
allow-listed code/message and `cache-control:no-store`.

### S-PII-CORPUS-RESULT
Exact object `{schema_version:"1",corpus_sha256:string,cases:84,entities:576,
structured_recall:number,named_recall:number,named_precision:number,
overall_recall:number,overall_precision:number,must_redact_leaks:0,passed:boolean}`.

### S-NETWORK-BOUNDARY-RESULT
Exact object `{schema_version:"1",requests_observed:int,storage_writes:0,
raw_source_egress:0,unredacted_text_egress:0,filename_egress:0,mapping_egress:0,
workers_terminated:boolean,passed:boolean}`. Contains no captured content.

### S-QUOTA-STATE
Exact persistent object `{utc_date:string,aggregate_browser_run_ms:int}`. Date
is `YYYY-MM-DD` UTC. No additional key or record is allowed.

### S-PUBLIC-KEY-DOCUMENT
Exact object `{schema_version:"1",ed25519:[{algorithm:"Ed25519",public_key_id,
public_key_spki_b64,status:"current"|"retired"}],mldsa65:[{algorithm:"ML-DSA-65",
public_key_id,public_key_raw_b64,status:"current"|"retired"}]}`.

### S-VERIFICATION-RESULT
Exact object `{schema_version:"1",digest_matches:boolean,ed25519_verified:boolean,
mldsa65_verified:boolean,valid:boolean}`; `valid` is true only when the other
three fields are true.

### S-DOCTOR-RESULT
Exact object `{status:"ok"|"failed",checks:[{name:string,ok:boolean}]}` with no
secret values or user content.

### S-PERFORMANCE-RESULT
Exact object `{schema_version:"1",corpus_hash:string,samples:int,stages:{shell,
engine,local,strawman,steelman,oracle,pdf,signing,total:{median_ms:number,
p95_ms:number}},passed:boolean}`.

### S-RESOURCE-GATE-RESULT
Exact object `{schema_version:"1",initial_js_gzip_bytes:int,static_asset_max_bytes:int,
public_worker_gzip_bytes:int,trusted_worker_gzip_bytes:int,public_cpu_p99_ms:number,
trusted_peak_memory_bytes:int,response_max_bytes:int,passed:boolean}`.

### S-SECURITY-GATE-RESULT
Exact object `{schema_version:"1",gate:"codeql"|"dependabot"|"secret_scanning"|
"license",items_reviewed:int,unresolved_applicable_high:int,passed:boolean}`.

### S-RECOVERY-RESULT
Exact object `{schema_version:"1",commit:string,architecture_sha256:string,
build_passed:boolean,tests_passed:boolean,doctor_passed:boolean,dry_run_passed:boolean,
sample_verified:boolean,changed_byte_rejected:boolean,clean:boolean}`.

### S-ZERO-COST-RESULT
Exact object `{schema_version:"1",gbp_upfront:0,gbp_monthly:0,usd_upfront:0,
usd_monthly:0,paid_fallbacks:0,automatic_topups:0,passed:true}`.

### S-TRUST-CLAIMS
Fixed allow-listed claim IDs mapped to owner-reviewed text: `mission_no_copy`,
`browser_local_source`, `redacted_ai_processing`, `anonymous_quota_state`,
`provider_metadata_limit`, `english_only`, `desktop_chrome_edge`,
`no_malware_scan`, `hybrid_exact_byte_signing`, and `exact_zero`.

---

# 55. CANONICAL FAILURE REGISTRY

Retry counts are total retries after the first attempt. “Forbid” means the
named downstream operation must not run for that request.

| Failure ID | Detection point | Retry | Next action / visible category | Downstream forbidden |
|---|---|---:|---|---|
| F-INVALID-DOCUMENT | Browser selection/preflight/parser | Parser-only failures use `B-PARSER-RETRY-COUNT`; otherwise 0 | Document Safe Mode | Network, AI, PDF, signing |
| F-HOSTILE-DOCUMENT | Hostile preflight | 0 | Document Safe Mode; terminate/wipe | Parser, network, AI, PDF, signing |
| F-UNSUPPORTED-FORMAT | Browser selection/magic | 0 | Document Safe Mode | Parser, network, AI, PDF, signing |
| F-OVERSIZED-DOCUMENT | File/body/word bound | 0 | Document Safe Mode or HTTP 413 | Later document work |
| F-PARSER-CRASH | Parser Worker error/exit | 1 fresh Worker | Retry once, then client-resource Safe Mode | Network until success |
| F-PARSER-TIMEOUT | Parser deadline | 1 fresh Worker | Terminate/wipe, retry once, then client-resource Safe Mode | Network until success |
| F-PARSER-ALLOCATION | Parser allocation/structured-clone failure | 1 fresh Worker | Terminate/wipe, retry once, then client-resource Safe Mode | Network until success |
| F-REDACTION-FAILURE | Redaction Worker error/deadline/schema | 0 | Terminate/wipe; privacy Safe Mode | Network, AI, PDF, signing |
| F-UNSUPPORTED-LANGUAGE | Local exact language rule | 0 | Language Safe Mode | Redaction request egress, AI, PDF, signing |
| F-PII-GATE-FAILURE | Redaction/corpus/leak validation | 0 | Privacy Safe Mode | Network, AI, PDF, signing |
| F-NETWORK-BOUNDARY-FAILURE | Serialization/instrumented boundary/storage | 0 | Privacy Safe Mode and release block | AI, PDF, signing |
| F-TURNSTILE-FAILURE | TrustedRuntime Siteverify | 0; fresh token for new user attempt | Verification Safe Mode/403/503 | AI, Browser Run, PDF, signing |
| F-GROQ-FAILURE | Groq transport/schema/privacy | 0 to Groq | Mark unavailable; one OpenRouter Free attempt | Further Groq calls this request |
| F-OPENROUTER-FAILURE | OpenRouter Free transport/schema/privacy | 0 | Analysis Safe Mode | Later AI stages, PDF, signing |
| F-INVALID-AI-SCHEMA | Immediate strict stage parse | Counts as provider hard failure | Approved fallback or analysis Safe Mode | Unvalidated text use/report/signing |
| F-AI-TIMEOUT | Provider or wall timer | Provider fallback if available; no wall retry | Approved fallback or analysis Safe Mode | Later work after wall stop |
| F-QUOTA-EXHAUSTED | TrustedRuntime Browser Run preflight | 0 | Quota Safe Mode; optional valid non-PDF journey only | Browser Run, PDF, signing |
| F-BROWSER-RUN-FAILURE | Browser Run transport/deadline | 0 | PDF Safe Mode | PDF presentation and signing |
| F-PDF-VALIDATION | PDF magic/size/content validation | 0 | PDF Safe Mode | Signing and PDF presentation |
| F-SIGNING-FAILURE | Digest/sign/self-check/manifest | 0 | Signing Safe Mode | PDF authenticity/presentation |
| F-OUTPUT-SIZE | Any output byte/count bound | 0 | Relevant output omitted or request Safe Mode atomically | Oversize send/download |
| F-RATE-LIMITED | Public rate binding | 0 | Fixed HTTP 429 | TrustedRuntime and all expensive work |
| F-PERFORMANCE-GATE | Release measurement | 0 | Block release; optimize within architecture | Production promotion |
| F-SECURITY-GATE | CodeQL/dependency/secret/license gate | 0 | Block phase/release | Production promotion |
| F-RECOVERY-GATE | Clean-machine/runbook verification | 0 | Block release and fix deterministic artifact | Production promotion |
| F-ZERO-COST-GATE | Account/configuration attestation | 0 | Block release; disable charged path | Production promotion |
| F-TRUST-CONTENT-GATE | Trust claim/link/review | 0 | Block release; correct content | Production promotion |
| F-DOCUMENTATION-GATE | README/runbook/case-study verification | 0 | Block release; correct documentation | Production promotion |
