# Project Engineering Specification (PES)

**Project name:** Aethelgard
**Document type:** Build Guide, System Architecture, and Project Tracker
**Version:** 2.1
**Date:** 2026-08-28
**Status:** Approved for build
**Language:** Simplified Technical English
**Purpose:** Final system architecture, build guide, and phase authority
**Supersedes:** Architecture 2.0 and all earlier architecture proposals and handoffs

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

The job now is:

1. clean the repository;
2. compact the historical build log;
3. promote this exact final Architecture 2.1;
4. align `AGENTS.md`;
5. implement **Phase 0 only**;
6. implement Phase 0 **one task at a time**;
7. prove Phase 0 complete;
8. STOP;
9. ask the owner whether Phase 1 may begin.

Do not implement Phase 1, 2, 3, or 4 before the owner explicitly approves that phase.

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

# 1. CURRENT PROJECT STATE

Treat the current state as:

* Architecture 2.1 in this document is owner-approved for build. It becomes
  the protected-main authority when the preparation pull request is merged.
* Phase -1 technical feasibility is complete.
* Exact-zero account gate is complete.
* Browser-local trust-boundary EDR is approved.
* Frozen PII acceptance baseline is approved.
* External Durable Object direct-binding minimisation proof passed.
* The private dispatcher Worker and Service Binding are rejected as unnecessary.
* The old final Architecture 2.1 proposal hash is superseded by this owner revision.
* Production Architecture 2.1 implementation has not yet been completed.
* Architecture research is closed.
* Phase 0 is the only implementation phase authorized by this handoff.

The old proposal SHA-256:

`bd5ce7b55485965938270ec02ee590114f539da277adde9f1e09fabf9d2f9794`

is historical evidence only.

It is **not** the hash to promote because this final owner revision deliberately removes and changes additional features.

Compute the new SHA-256 after this file is final and record it in
`BUILD_LOG.md`. Do not place a self-referential hash inside this file.

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

Use a named conservative evidence threshold.

Freeze it in tests.

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

Dynamic public routes are exactly:

* `GET /health`
* `POST /analyze`

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

The public analysis request contains only fixed fields such as:

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

`requested_outputs` is an allow-listed bounded enum/set.

Each source record contains only redacted content and non-sensitive structural references.

Prefer structural references such as:

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

Use `franc-min` offline.

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

where relevant.

Output is one strict Zod schema containing bounded:

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

Output includes bounded:

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

Return requested outputs once in one bounded analysis response with fixed known parts.

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
10. Every allocation path has a named bound where relevant.
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
23. Prefer immutable / readonly values.
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

Keep the final Browser Run queue bounded.

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

The `.sig.json` contains only public/non-sensitive verification metadata such as:

* schema version;
* PDF SHA-256;
* Ed25519 signature;
* Ed25519 public-key ID;
* ML-DSA-65 signature;
* ML-DSA public-key ID;
* algorithm names;
* optional non-sensitive creation time.

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

Pin exact versions before implementation release.

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
* Current implementation phase: Phase 0
* Phase 0 status: NOT STARTED / IN PROGRESS as appropriate
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

**Authorized now, but only after the preparation gate is merged.**

No Phase 1 work is authorized.

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

# 41. PHASE 0 EXIT TEST

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

**Planned, not authorized by this handoff.**

When later authorized, implement one task at a time.

Suggested task sequence:

1. browser input contract / early file bound;
2. hostile-container prevalidation;
3. PDF parser;
4. DOCX parser;
5. PPTX parser;
6. XLSX parser;
7. CSV/TXT parser;
8. source-reference normalization;
9. 8,000-word enforcement;
10. English-language gate;
11. Redaction Worker;
12. PII corpus integration;
13. network-boundary proof;
14. redacted request schema;
15. Groq/OpenRouter router;
16. Strawman schema + prompt;
17. Steelman schema + prompt;
18. Oracle schema + prompt;
19. bounded provider failover;
20. prompt-injection controls;
21. plain functional dashboard;
22. parser/redactor/AI fault reflexes;
23. Phase 1 exit.

Phase 1 exit requires:

* all six formats;
* exact file/word boundaries;
* hostile files rejected;
* English-only gate;
* PII baseline passes;
* no raw source/unredacted content crosses network;
* real supported document reaches Oracle;
* normal analysis uses exactly three model calls;
* every finding is source/confidence linked;
* provider failures fail closed;
* Phase 0 regression remains green.

Then STOP and request Phase 2 authorization.

---

# 43. PHASE 2 — PROFESSIONAL OUTPUT

**Planned, not authorized.**

Suggested sequence:

1. complete premium UI system;
2. dashboard information architecture;
3. Recharts visualizations;
4. deterministic chart transforms;
5. shared report design tokens;
6. service-owned HTML report template;
7. production Browser Run PDF;
8. XLSX writer;
9. text/Markdown;
10. bounded multipart response;
11. direct object-URL downloads;
12. final signing integration;
13. detached manifest UX;
14. synthetic signed static sample;
15. Phase 2 exit.

Exit requires:

* complete premium journey;
* dashboard;
* PDF default;
* XLSX/text optional;
* exact signed PDF;
* independent manifest verification;
* no invented chart numbers;
* Excel/LibreOffice compatibility;
* no result storage;
* no token;
* no email;
* no BYOK;
* static fallback works;
* visual design invariant passes.

Then STOP and request Phase 3 authorization.

---

# 44. PHASE 3 — RELEASE HARDENING

**Planned, not authorized.**

One task at a time:

* complete hostile corpus;
* frozen PII corpus;
* language fixtures;
* prompt-injection fixtures;
* browser Worker failure;
* parser timeout;
* allocation failure;
* fresh-worker recovery;
* zero browser user-data storage;
* provider outages;
* rate limits;
* schema failures;
* Turnstile failures;
* quota failures;
* Browser Run failure;
* signing failure;
* privacy/network boundary;
* production no-logging assertion;
* performance corpus;
* bundle/CPU/memory/output limits;
* CodeQL;
* Dependabot;
* secret scanning;
* license audit;
* clean-machine disaster recovery;
* final exact-zero account re-attestation.

Exit requires all security/privacy/cost/reliability/performance gates pass.

Then STOP and request Phase 4 authorization.

---

# 45. PHASE 4 — TRUST AND PORTFOLIO FINISH

**Planned, not authorized.**

One task at a time:

* Trust page;
* plain-language Collect/Never Collect;
* browser-local verifier;
* independent CLI verifier;
* public key publication;
* signed static sample presentation;
* README;
* concise operational runbook;
* architecture case study;
* portfolio explanation;
* clean-machine final verification.

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

Final exit:

A clean machine can:

* inspect project;
* verify sample PDF;
* reject a changed byte;
* verify both algorithms;
* understand the privacy boundary;
* recover/deploy the project from the runbook.

Then:

**PROJECT COMPLETE**

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

# 50. FINAL OWNER AUTHORIZATION

This handoff authorizes:

## Immediately

* repository inspection;
* approved repository hygiene;
* PII/security fixture preservation;
* BUILD_LOG compaction;
* final Architecture 2.1 promotion;
* EDR alignment;
* AGENTS alignment;
* preparation verification;
* preparation PR.

## After the preparation gate is merged

* Phase 0 implementation;
* Phase 0 task-by-task testing;
* Phase 0 PR;
* Phase 0 verification.

## Not authorized yet

* Phase 1;
* Phase 2;
* Phase 3;
* Phase 4;
* architecture changes outside this handoff;
* paid services;
* unrelated feature additions.

---

# 51. REQUIRED REPORTING STYLE

Do not return a long essay after every task.

For normal task completion use:

```text
Task 0.x — PASS

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
Task 0.y
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
