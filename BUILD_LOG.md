# Aethelgard Build Log

Concise engineering status and evidence record. Git history contains detailed
historical work.

## Current State

- Architecture: **2.1 — APPROVED FOR BUILD**, execution-hardened under EDR 37.
- Authoritative exact Git-blob SHA-256:
  `56fdc13dcde678c35dc8ad0ab67c28b9340d5095ed1a63999adde140c0c091c2`.
- Phase -1: **CLOSED**.
- Preparation gate: **PASSED — MERGED** in PR #3 on 2026-08-28.
- Current implementation phase: **PHASE 1** on `phase/1-core-mission`.
- Phase 0 status: **PASSED — MERGED** in PR #7 on 2026-08-29.
- Phase 1 status: **IN PROGRESS — TASK 1.9 PASSED**.
- Exact-zero account gate: **PASSED** on 2026-08-27.
- Browser-local trust-boundary EDR: **APPROVED**.
- Architecture execution-hardening EDR 37: **APPROVED**.
- Task 1.10 normalized-score correction EDR 38: **APPROVED**.
- Frozen PII baseline: **APPROVED**.
- Trusted PDF and hybrid-signing feasibility: **PASSED**.
- External Durable Object direct binding: **PASSED**.
- Architecture research: **CLOSED**.
- Production Architecture 2.1 implementation: **NOT COMPLETE**.

## Binding Evidence

### 1. Initial bootstrap and repository security

- Created the minimal Cloudflare Worker and static Pages scaffold.
- Enabled the protected-repository security path, including required CodeQL.
- Removed generated Next.js output and its false-positive secret from the
  bootstrap branch history. Added no production secret to Git.
- The Architecture 2.0 bootstrap pull request is superseded by the final 2.1
  preparation path and must not be merged merely as an archive.

### 2. Architecture 2.0 and superseded Google path

- Architecture 2.0 used Cloud Run, FastAPI, Google Secret Manager, keyless
  GitHub OIDC/WIF deployment, server-side parsing, email, and monitoring.
- The least-privilege Google design was verified before the exact-zero pivot.
- These components are historical. They are not dependencies of the final
  Architecture 2.1 target.

### 3. Exact-zero pivot

- The owner set the binding cost target to GBP 0.00 and USD 0.00 upfront and
  recurring, with no automatic paid path.
- The owner confirmed the final Free-account checklist on 2026-08-27.
- Quota exhaustion must fail closed. A budget alert is not a spending control.

### 4. Server-side Cloudflare Python rejection

- Tested native Worker ML-DSA and the smallest direct Python parser packages
  before trying larger stacks.
- The server-side parser route failed the Free Worker deployment-size gate.
  PDF or PPTX could not remain below 3 MiB without unsafe or correctness-changing
  pruning.
- Outcome: **FAIL-SERVER**. This rejected server-side document processing on
  Workers Free; it did not reject a zero-cost browser-local architecture.

### 5. Browser-local parsing and redaction proof

- Passed browser-local validation and parsing for PDF, DOCX, PPTX, XLSX, CSV,
  and TXT with source references.
- Passed the 15 MiB and 8,000-word boundaries, malformed inputs, archive/XML
  abuse controls, macro/embedded-content rejection, parser timeout, allocation
  failure, fresh-Worker recovery, and zero browser user-data storage checks.
- Chrome and Edge passed the disposable module Web Worker proof. The tested
  Pyodide heap was 76,349,440 bytes after 48 MiB allocation pressure.
- Architecture 2.1 supports English text documents only. It has no OCR and no
  source-byte network fallback.

### 6. Approved trust-boundary EDR and PII baseline

- The owner approved `docs/EDR_BROWSER_LOCAL_TRUST_BOUNDARY.md` on 2026-08-27.
- ClamAV was removed because source binaries no longer enter a backend. The
  project must not claim that files are malware-scanned. The EDR reopens if a
  future architecture sends source binaries to any remote service.
- The frozen corpus contains 84 cases, 576 labelled entities, and 14 cases per
  supported format.
- Canonical corpus SHA-256:
  `0c777c5fc3300eb0b00a29cf583b23ea6455a12a43d990531b88990d1d679467`.
- Measured baseline: structured recall 100%, named recall 100%, named
  precision 99.08%, overall recall 100%, overall precision 99.65%, and zero
  must-redact leaks.
- These values are Aethelgard regression evidence, not universal PII accuracy.

### 7. Browser Run exact-PDF and hybrid-signing proof

- Browser Run returned 33,736 exact PDF bytes from fixed service-owned HTML and
  reported 215.7097 ms of browser time.
- Exact proof PDF SHA-256:
  `b99a9910d29544820c8dd395755638c732818dd92df208f3df3560955438e070`.
- The internal Durable Object signed the same SHA-256 digest with disposable
  Ed25519 and ML-DSA-65 keys. Independent verification passed; changing one PDF
  byte made both signatures fail.
- Pinned `mldsa-native` commit:
  `6d661fd1865b38d8612692c52160cf76193785fb`.
- Integrated ML-DSA-65 Wasm SHA-256:
  `960ea1d9ceb0449f91301cb4168db83ab1cba3f0a86fa1bed0515f880b85f802`.
- All applicable official ML-DSA-65 ACVP cases passed. No formal end-to-end
  constant-time claim is made.

### 8. Direct external Durable Object minimisation proof

- A disposable secret-free edge Worker called `TrustedRuntime` directly
  through an external Durable Object binding with Wrangler `script_name`.
- The public environment contained only the Durable Object binding. Disposable
  trusted-runtime secret names stayed in the private Durable Object
  environment.
- Browser Run, signing, private bindings, Durable Object storage, local
  two-process development, and deployed invocation passed without a Service
  Binding dispatcher.
- Live trace: Durable Object 1 ms CPU and 93 ms wall time; public edge 0 ms CPU.
- Browser Run returned a 14,571-byte `%PDF-` result and used 171.45 ms.
- Both disposable deployments, state, test secrets, processes, bundles, and
  logs were removed. Former test URLs returned 404.
- Decision: remove the private dispatcher Worker and its Service Binding.

### 9. Final Architecture 2.1 owner direction

- On 2026-08-28 the owner closed architecture research and superseded the prior
  Architecture 2.1 proposal hash.
- Final scope removes BYOK, email, Resend, Sentry, UptimeRobot, Google runtime,
  server parsing, Router/Specialist fan-out, MCP, OCR, multilingual support,
  and paid fallbacks.
- Final AI flow is deterministic focus selection followed by exactly three
  model stages: Strawman, Steelman, and Oracle.
- Turnstile Siteverify belongs inside private `TrustedRuntime`; the public edge
  remains literally secret-free.
- Preparation and Phase 0 are sequential. Phase 0 cannot start until the final
  Architecture 2.1 preparation pull request merges to protected `main`.

### 10. Current preparation progress

- Gate Task A1 inventory: **PASSED** on 2026-08-28.
- Gate Task A2 repository hygiene: **PASSED** in signed commit `1e84bd2`.
- Preserved the active static frontend scaffold, approved EDR, and frozen PII
  fixture at `tests/fixtures/pii-corpus.mjs`.
- Removed local generated frontend/backend debris and did not restore obsolete
  research files or the superseded FastAPI backend.
- Frontend configuration tests: 3 passed, 0 failed.
- PII corpus: 84 cases and canonical hash matched.
- Gate Task A3 build-log compaction: **PASSED** on 2026-08-28.
- Gate Task A4 Architecture 2.1 promotion and EDR/agent alignment: **PASSED**
  on 2026-08-28.
- Historical initial Architecture 2.1 promotion SHA-256:
  `2798ded6dd80ac81d4e8d83fd8500c77dafdf2f9ba547d105d59cedc7c97c4d0`.
- Gate Task A5 preparation verification: **PASSED** on 2026-08-28.
- Architecture sections 0-52 and EDR decisions 1-36 are complete and ordered.
  Markdown links and table shapes pass. Obsolete research documents are absent.
- No removed target dependency appears in an active manifest. `AGENTS.md`, the
  approved EDR, and Architecture 2.1 agree on scope and phase authority.
- Frontend tests: 3 passed, 0 failed. Root and frontend TypeScript checks
  passed. Static export passed with 103 KiB initial shared JavaScript, below
  the 300 KiB gate. Package audit reported zero vulnerabilities.
- Generated install/build/typecheck output was removed. The preparation
  commits contain signed SSH signature headers.
- Preparation branch `chore/final-architecture-2.1` merged to protected `main`
  as `7ddad437` before the Phase 0 branch was created.

### 11. Phase 0 Task 0.1 — clean implementation baseline

- Task 0.1: **PASSED** on 2026-08-28.
- Classified all 11 active Dependabot alerts as transitive dependencies of
  approved tools. Root alerts followed `wrangler -> miniflare -> undici`.
  Frontend alerts followed `Next.js -> postcss -> nanoid` and
  `Next.js -> sharp`.
- Pinned Wrangler 4.126.0, Miniflare 5.20260825.0-alpha, and undici 7.29.0.
  Pinned Next.js 16.3.2, PostCSS 8.5.23, nanoid 3.3.18, and sharp 0.35.4.
- Removed obsolete Resend and Sentry binding examples from the public Worker.
- Root and frontend npm audits reported zero vulnerabilities at every
  severity. Five root/frontend tests, strict TypeScript, lint, Worker dry
  build, and static export passed.
- No document parsing, AI, signing, Browser Run, persistence, paid path, or
  other future-task feature was added.

### 12. Phase 0 Task 0.2 — static shell and design tokens

- Task 0.2: **PASSED** on 2026-08-28.
- Added one typed visual-token source, an architectural static Pages shell,
  valid `lang="en"`, keyboard focus, semantic landmarks, and reduced-motion
  behavior. No dashboard, parser, upload, or AI control was added.
- Self-hosted the required Latin Fraunces and Public Sans WOFF2 assets under
  the SIL Open Font License. SHA-256 values are
  `7234ed860a9cc83045413c4faee63c960a8f2d1917adcf728119307d56e0d783`
  and `5ed4d31c988e73b258894244f209069ebe77dc7e564861954b21198b6de90d68`.
- Static export, strict TypeScript, lint, and eight tests passed. Initial page
  JavaScript measured 172,578 gzip bytes against the 307,200-byte gate.

### 13. Phase 0 Task 0.3 — secret-free public edge

- Task 0.3: **PASSED** on 2026-08-28.
- The public Worker exposes only `GET /health`, `POST /analyze`, and the
  required restricted CORS preflight. Unknown routes, query strings, methods,
  origins, content types, and invalid envelopes fail with fixed safe errors.
- Analysis bodies use a 512 KiB streaming limit, 1,024-chunk limit, and
  five-second read deadline. The Workers Rate Limiting binding is configured
  for five attempts per source per Cloudflare location per 60 seconds.
- The edge configuration contains one public origin value and the rate-limit
  binding. It contains no secret, Turnstile verification, provider key,
  Browser Run binding, signing input, parser, AI call, or application state.
- Eleven root tests, six frontend tests, strict TypeScript, lint, Worker dry
  build, and static export passed. Edge upload measured 9.69 KiB raw and
  3.05 KiB gzip.

### 14. Phase 0 Task 0.4 — private TrustedRuntime binding

- Task 0.4: **PASSED** on 2026-08-28.
- Added a separate `aethelgard-trusted-runtime` script with a declarative
  SQLite Durable Object export. `workers_dev` and preview URLs are disabled,
  no route exists, and its default module entry fails with a fixed 404.
- The public edge binds directly to external class `TrustedRuntime` through
  `script_name`. There is no Service Binding, dispatcher call, or shared
  edge/runtime secret.
- A two-process local workerd proof passed through the public `/analyze` route
  and returned the Durable Object marker `turnstile_not_ready`. Both
  disposable process trees were stopped after the proof.
- Tests, strict TypeScript, lint, and both dry builds passed. Public edge size
  measured 10.64 KiB raw / 3.31 KiB gzip; private runtime size measured
  1.49 KiB raw / 0.71 KiB gzip.

### 15. Phase 0 Task 0.5 — private Turnstile verification

- Task 0.5: **PASSED** on 2026-08-28.
- `TrustedRuntime` performs one bounded Turnstile Siteverify call before any
  future trusted operation. It sends only the private secret and response
  token, and does not send `remoteip`.
- Verification fails closed for missing or oversized tokens, invalid and
  replayed tokens, wrong action, wrong hostname, malformed or oversized
  responses, transport failure, and timeout. Expected action is `analyze` and
  expected hostname is the account-owned `aethelgard-3j9.pages.dev`.
- The browser helper holds only the public site key and an in-memory token. It
  consumes each token once and resets the widget after every attempt. The
  public edge remains secret-free and does not call Siteverify.
- No production secret was created or committed. The private configuration
  declares the `TURNSTILE_SECRET` slot; human-owned key migration remains a
  later Phase 0 gate.
- Tests using Cloudflare's documented disposable test credentials, strict
  TypeScript, lint, both Worker dry builds, static export, and the root npm
  audit passed. The audit reported zero vulnerabilities. Public edge size
  remained 10.64 KiB raw / 3.31 KiB gzip; private runtime size measured
  736.38 KiB raw / 113.29 KiB gzip.

### 16. Phase 0 Task 0.6 — Doctor and production no-logging

- Task 0.6: **PASSED** on 2026-08-28.
- Added one deterministic, read-only Doctor driven by shared Architecture 2.1
  invariants. `npm run doctor` checks 17 applicable repository and deployment
  conditions without calling AI, Browser Run, or any network service.
- Live `/health` reuses the safe public-runtime invariants. It returns only
  minimal service/version state when healthy and a fixed non-sensitive 503
  response when a binding, origin, or secret-free environment invariant fails.
- Persistent Workers observability is explicitly disabled in both the public
  and private Wrangler configurations. No Tail Worker, Logpush, Sentry,
  analytics binding, application logging, or third-party telemetry was added.
- Doctor, 19 root tests, eight frontend tests, strict TypeScript, lint, both
  Worker dry builds, and static export passed. Public edge size measured
  12.16 KiB raw / 3.75 KiB gzip; private runtime remained 736.38 KiB raw /
  113.29 KiB gzip.

### 17. Phase 0 Task 0.7 — Browser Run and aggregate quota guard

- Task 0.7: **PASSED** on 2026-08-28.
- Added the Browser Run binding only to the private runtime and used the
  `/pdf` Quick Action with fixed service-owned synthetic HTML. JavaScript and
  Quick Action caching are disabled; no caller HTML or real report rendering
  exists yet.
- PDF output fails closed unless the response is successful, has the PDF
  content type and `%PDF-` magic, remains within the 8 MiB complete-output
  bound, and supplies a valid `X-Browser-Ms-Used` value.
- The Durable Object stores only `utc_date` and
  `aggregate_browser_run_ms`. It resets lazily on a UTC-date change, reserves
  60 seconds before each call, reconciles only trusted usage values, and
  refuses calls that could exceed the eight-minute application ceiling.
- The in-memory final-PDF queue allows at most two active/waiting operations
  and spaces Quick Actions by at least ten seconds. Storage, Browser Run,
  malformed output, missing usage, provider, queue, and quota failures all
  fail closed. The unsigned synthetic PDF is discarded until signing exists.
- A secret-free disposable deployment ran the production helper against the
  real Browser Run binding. It returned a 17,934-byte `%PDF-` result and 382 ms
  of accounted browser time. The proof Worker was deleted; its URL returned
  404 afterward, and all local proof files were removed.
- Doctor passed 19 checks. Twenty-five root tests, eight frontend tests,
  strict TypeScript, lint, public/private dry builds, and static export passed.
  Public edge size stayed 12.16 KiB raw / 3.75 KiB gzip; the final private
  runtime measured 744.03 KiB raw / 115.30 KiB gzip.

### 18. Phase 0 Task 0.8 — hybrid signing foundation

- Task 0.8: **PASSED** on 2026-08-29.
- Vendored the approved import-free `mldsa-native` ML-DSA-65 Wasm built from
  source commit `6d661fd1865b38d8612692c52160cf76193785fb`. The committed artifact is
  40,843 bytes and its SHA-256 is
  `960ea1d9ceb0449f91301cb4168db83ab1cba3f0a86fa1bed0515f880b85f802`.
  The build record, upstream license, minimal C boundary, pinned Zig 0.15.2
  archive hash, exact flags, and a clean rebuild script are in the repository.
- The private runtime hashes the exact final Browser Run PDF bytes with
  SHA-256, signs the digest with Ed25519 through `node:crypto`, signs the same
  digest with the pinned ML-DSA-65 Wasm, self-verifies both, and creates only
  the approved public detached-manifest fields. Mutable decoded seed, expanded
  key, randomness, digest, and Wasm arena buffers are wiped in `finally` paths.
- Caller HTML, PDF bytes, hashes, extra envelope fields, and `/sign` routes are
  rejected. Signing is reachable only after the private Durable Object has
  produced and validated the service-owned PDF. A signing failure returns no
  PDF and no unsigned substitute.
- Official NIST ACVP v1.1.0.43 passed all 340 applicable ML-DSA-65 cases: 25
  key-generation, 270 signature-generation, and 45 signature-verification
  cases. Verification covered nine accepted and 36 rejected signatures.
- Independent Node 24 and Wasm signatures cross-verified. The exact-PDF
  integration passed, and changing one PDF byte caused both Ed25519 and
  ML-DSA-65 verification to fail.
- Added the reviewed key-generation/upload script. Disposable tests create no
  production key. The production path requires an explicit reviewed flag,
  prints no private value, uploads both seeds through one Wrangler secret-bulk
  process, writes public keys only, and wipes mutable seed buffers.
- No production key or secret was generated, read, uploaded, or committed.
  The private configuration declares only the current Turnstile and signing
  secret slots. Production secret migration remains a later Phase 0 gate.
- Doctor passed 22 checks. Thirty root tests and eight frontend tests, strict
  TypeScript, lint, dependency audit, public/private dry builds, and static
  export passed. The audit reported zero moderate-or-higher findings. Public
  edge size stayed 12.22 KiB raw / 3.79 KiB gzip; the private runtime measured
  791.36 KiB raw / 130.80 KiB gzip.

### 19. Phase 0 Task 0.9 — CI and supply-chain gate

- Task 0.9: **PASSED** on 2026-08-29.
- Added one GitHub-native workflow on the standard public `ubuntu-24.04`
  runner. Checkout and Node setup actions are pinned to full reviewed commit
  SHAs. The workflow uses Node 24.13.1, read-only repository permission, a
  20-minute job limit, no package-manager cache, no uploaded artifact, no
  uploaded cache, and no paid or self-hosted runner.
- The hosted push run `33220605474` passed the clean root and frontend installs,
  Doctor, license and lock integrity check, dependency audit, TypeScript,
  strict lint, all tests, both Worker dry builds, and static frontend build.
  A bounded command wrapper makes any emitted warning or non-zero command fail
  the job.
- Repaired eight malformed optional Next.js SWC records in the frontend
  lockfile. Their approved 16.3.2 versions did not change; each record now has
  its registry URL, SHA-512 integrity, platform bound, and MIT license. Clean
  `npm ci` now succeeds on the standard hosted Linux runner.
- The deterministic dependency gate checked 154 locked packages. Every real
  package has an approved recorded license, npm registry source, and SHA-512
  integrity. It also checks both self-hosted font licenses and the vendored
  `mldsa-native` license. Root and frontend audits reported zero
  vulnerabilities.
- Dependabot now covers both npm lockfiles on bounded weekly schedules.
  GitHub Dependabot security updates, CodeQL default setup, secret scanning,
  and push protection are enabled. CodeQL uses the default JavaScript and
  TypeScript suite on a standard runner. GitHub secret scanning reported zero
  open alerts after the Phase 0 branch push.
- Protected `main` still requires signed commits, linear history, pull-request
  review, the existing CodeQL check, and strict up-to-date checks. The passing
  `Build, test, and supply chain` job is now also required. No existing rule
  was removed or weakened.
- There is no active Python code in Phase 0, so no empty Python toolchain or
  dependency was added. Thirty-four root tests and eight frontend tests passed.
  Public edge size stayed 12.22 KiB raw / 3.79 KiB gzip; the private runtime
  stayed 791.36 KiB raw / 130.80 KiB gzip.
- A separate pre-existing Cloudflare Workers Builds check attempted the
  feature branch and failed. It is not a required protected-main status and is
  not part of the GitHub-native Task 0.9 workflow. No production deployment
  succeeded. Its deployment behavior remains inside the Task 0.10 deployment
  verification gate and was not hidden or converted into a CI exception.
- GitHub continues to show the 11 old Dependabot alerts on protected `main`
  until the already tested Phase 0 dependency fixes merge. The active Phase 0
  branch audits clean.

### 20. Phase 0 Task 0.10 — deployed verification

- Task 0.10: **PASSED** on 2026-08-29 using isolated non-production Free-plan
  resources. The protected production deployment was not changed before the
  Phase 0 pull request review.
- Cloudflare account inventory proved that the owned Pages project is
  `aethelgard`, with free hostname `aethelgard-3j9.pages.dev`.
  `aethelgard.pages.dev` is different content and is not owned by this account.
  The implementation now uses the owned free hostname; Architecture 2.1's
  binding requirement remains the approved free `pages.dev` route.
- Added an explicit Pages Wrangler configuration. The final warning-free branch
  preview deployed at `phase-0-foundation.aethelgard-3j9.pages.dev`. Three live
  shell checks returned HTTP 200 in 510 ms, 122 ms, and 111 ms. Responses were
  `noindex`; `robots.txt` returned HTTP 200 with `Disallow: /`. Production Pages
  content was not promoted.
- The private runtime now returns the bounded service-owned synthetic PDF,
  detached manifest, and public verification keys only after Turnstile,
  Browser Run, exact-byte hashing, and both signatures succeed. No caller PDF,
  HTML, or hash reaches signing. An independent Node verifier checks the exact
  response and changed-byte rejection.
- The canonical disposable proof used unique Worker names, official Turnstile
  test credentials, and disposable signing seeds. It proved the direct external
  Durable Object binding, Browser Run, SHA-256, Ed25519, and ML-DSA-65 chain in
  1,366 ms wall time. The PDF was 17,934 bytes with SHA-256
  `33e3d6589c6e6e6388f0ba981ef8eb89cc17a5d679165c180912812677449bef`.
  Both signatures independently verified; changing one byte failed both.
- The live public edge had zero secrets. The private proof runtime had exactly
  the three Task 0.10 slots, no public target, and no persistent observability.
  `/sign` returned 404 and a caller-HTML envelope returned 400 before expensive
  work. Only the anonymous UTC date and aggregate Browser Run milliseconds were
  stored. No paid fallback exists.
- Cloudflare's current official test response includes the provider-controlled
  `metadata.result_with_testing_key` field and omits `action`. The strict parser
  now accepts that response only when the private runtime is explicitly set to
  test mode. Production still requires exact `action=analyze` and the owned
  production hostname.
- The deployed private bundle measured 792.62 KiB raw / 131.08 KiB gzip against
  the 3 MiB Free-plan limit. Startup was 27 ms against the 1,000 ms limit. The
  pinned Wasm linear memory is 2 MiB against the 128 MiB isolate limit. The live
  invocation completed without a CPU or memory-limit outcome, and the Browser
  Run application guard remained active.
- All disposable Worker scripts, Durable Object definition, test secrets, keys,
  and temporary configuration files were removed automatically. No production
  key or secret was generated, read, uploaded, logged, or committed.
- Doctor passed 22 checks. Thirty-seven root tests and eight frontend tests,
  strict TypeScript, lint, dependency/license checks, zero-vulnerability audits,
  public/private dry builds, and static export passed without warnings.

### 21. Phase 0 Task 0.11 — secret migration and obsolete-runtime retirement

- Task 0.11: **PASSED** on 2026-08-29 after explicit owner approval of the
  exact destructive scope. No unrelated owner resource was removed.
- Created the final route-less `aethelgard-trusted-runtime` secret holder with
  Workers development URLs, preview URLs, and persistent observability disabled.
  The public Worker has zero secret slots. The private Worker has exactly the
  five required slots: Turnstile, Groq, OpenRouter, Ed25519, and ML-DSA-65.
- The account-owned Turnstile secret was copied directly to the private Worker.
  Groq and OpenRouter credentials passed live authentication-only checks against
  their model-list/key-information endpoints without inference or user data,
  were copied without printing their values, and remained present in Cloudflare
  after the superseded Google copies were removed.
- Generated the production Ed25519 and ML-DSA-65 seeds in mutable memory,
  uploaded them directly through Wrangler, wiped the mutable seed buffers, and
  printed or persisted no private value. Committed only the public verification
  record with key IDs `ed25519:1bb84280f5f88947bbcc33761c96e8ae` and
  `mldsa65:57ec85ded568caa2c382a85f64359777`.
- Retired only the approved obsolete resources: all five Aethelgard GCP Secret
  Manager objects, the `aethelgard-runtime` and `github-actions-deployer`
  service accounts, the `github-actions` WIF pool and provider, GitHub's generic
  `ENCRYPTION_KEY`, the three GCP deployment variables, and the ignored local
  `.dev.vars`. The obsolete Resend credential returned HTTP 401 before its last
  stored copy was removed. The obsolete Sentry DSN and repository/runtime
  configuration are absent. GCP had no Cloud Run service or Artifact Registry
  repository to remove.
- Post-retirement verification found zero GCP secrets, neither custom service
  account, no active Aethelgard WIF pool, none of the obsolete GitHub entries,
  and no local `.dev.vars`. The unrelated default Compute Engine service account
  was deliberately retained. The Cloudflare replacement still reported exactly
  five private slots and zero public slots.
- Added guarded, bounded migration tooling and tests that require an explicit
  reviewed flag, never print private values, validate providers without model
  inference, and check that the published signing-key record contains public
  verification material only.
- The complete local Phase 0 gate passed without warnings: Doctor, license and
  lock integrity, zero-vulnerability dependency audits, TypeScript, strict lint,
  41 root tests, eight frontend tests, both Worker dry builds, static export, and
  the initial-JavaScript measurement. No dependency was added or changed.
- Architecture 2.1 remains unchanged. Target operational dependence is now only
  Cloudflare, Groq, OpenRouter, and GitHub, all within the approved exact-zero
  configuration.

### 22. Phase 0 exit gate

- Phase 0 exit gate: **PASSED** on 2026-08-29. Tasks 0.1 through 0.11 passed in
  order. No Phase 1 document parsing, redaction, NER, AI analysis, report
  generation, or user-facing workflow was implemented early.
- The historical initial Architecture 2.1 Git-blob SHA-256 was
  `2798ded6dd80ac81d4e8d83fd8500c77dafdf2f9ba547d105d59cedc7c97c4d0`.
  Repository hygiene, the Scandinavian design-token shell, named-route edge,
  direct external Durable Object binding, private-only runtime, Turnstile,
  Browser Run quota guard, and production no-logging invariants all passed.
- The isolated deployed chain produced a 17,934-byte PDF in 1,366 ms, hashed
  its exact final bytes, independently verified Ed25519 and ML-DSA-65, and
  rejected both signatures after one byte changed. The private bundle was
  792.62 KiB raw / 131.08 KiB gzip with 27 ms startup and 2 MiB Wasm memory.
  No public arbitrary-signing path or forbidden storage exists.
- The final local gate passed Doctor, license and lock integrity, audits,
  TypeScript, strict lint, 41 root tests, eight frontend tests, Worker builds,
  static export, and the initial-JavaScript limit without warnings. Hosted
  GitHub run `33245071127` passed the clean-install Phase 0 CI gate on exact
  implementation commit `ca5f305e26f5b23861ce88caa9f433267cf6e1d1`.
- The active branch has zero known dependency-audit findings. Eleven historical
  Dependabot alerts remain visible only against protected `main` until the
  Phase 0 pull request merges. No dependency or approved technology changed in
  Tasks 0.10 or 0.11.
- Raw source files, unredacted extracted text, private signing keys, and provider
  credentials were not persisted or exposed. The public edge remains
  secret-free, the private runtime has only the five approved secret slots, and
  obsolete Google, Sentry, Resend, generic-encryption, and local secret paths
  are no longer operational dependencies.
- The target uses only approved free allocations and has no paid fallback,
  storage service, logging product, or superseded Google runtime. The next
  human-only action is review and merge of the single Phase 0 pull request;
  Phase 1 remains unauthorized.

### 23. Phase 1 Task 1.1 — browser input contract and early file bound

- Task 1.1: **PASSED** on 2026-08-29 from protected-main merge `6c36e14`.
  The shared build/Doctor phase marker is now Phase 1.
- Added one local single-file contract for exactly PDF, DOCX, PPTX, XLSX, CSV,
  and TXT. The extension is only an initial format choice; MIME and extension
  are not treated as trusted content evidence. Task 1.2 retains responsibility
  for magic and hostile-container validation.
- The browser rejects zero, invalid, multi-file, unsupported, overlong-name,
  and oversized selections before reading file bytes. Exactly 15 MiB is
  accepted; 15 MiB plus one byte fails closed with a fixed safe error.
- Added an accessible file-selection control that reports only neutral format
  and size status. It performs no parse, network request, browser persistence,
  or content read, and it exposes no raw filename outside local browser memory.
- Twelve frontend tests, frontend TypeScript, strict lint, static export,
  Doctor, its regression test, and root strict TypeScript passed without
  warnings. Initial frontend JavaScript measured 173,769 gzip bytes against the
  307,200-byte limit. No dependency, paid path, storage, or external processor
  was added.

### 24. Phase 1 Task 1.2 — hostile-container prevalidation

- Task 1.2: **PASSED** on 2026-08-29. Selected bytes now enter one disposable
  module Web Worker through transferable memory, pass strict prevalidation,
  return only a bounded result, and terminate on success, rejection, crash, or
  the ten-second wall stop. No source byte crosses the network or enters browser
  persistence.
- Added real-magic and false-extension checks for PDF, OOXML Office containers,
  and UTF-8 CSV/TXT. PDF checks reject missing terminal structure, encryption,
  JavaScript/actions, rich media, XFA, file attachments, and embedded files.
- The ZIP boundary accepts only stored/deflate single-disk non-ZIP64 packages.
  It validates central/local records, CRC-32, real expansion length, duplicate
  names, overlapping data, and traversal paths. Named limits are 512 entries,
  16 MiB per entry, 64 MiB total expansion, 100:1 compression ratio, 512-byte
  entry names, and 8 MiB per inspected XML part.
- DOCX, PPTX, and XLSX require their exact package parts and main content type.
  Every XML/relationship part is decoded as strict UTF-8 before parsing and
  rejects doctypes, entities, external relationships, macros, ActiveX, OLE,
  nested packages, and embedded content.
- The frozen regressions cover all three valid Office formats plus false magic,
  malformed/truncated ZIP, encryption, traversal, entry/total/per-entry/ratio
  bombs, XML entities, external relationships, macros, ActiveX, OLE, embedded
  PDF, encrypted/active PDF, and binary text. Nineteen frontend tests,
  TypeScript before and after static export, strict lint, static export, Doctor,
  and the initial-JavaScript gate passed without warnings.
- Initial JavaScript remains 175,298 gzip bytes under 307,200 bytes. The lazy
  preflight Worker is 11,979 raw / 3,969 gzip bytes. No dependency, parser,
  provider, paid path, storage, or malware-scanning claim was added.

### 25. Phase 1 Task 1.3 — PDF parser

- Task 1.3: **PASSED** on 2026-08-29. Added the approved direct
  `pdfminer.six` 20260107 parser on Pyodide 314.0.5 / Python 3.14.2. It runs
  only inside the disposable browser module Worker after Task 1.2 prevalidation
  and returns bounded page text with one-based page source references.
- All runtime files are same-origin, locally served, version-pinned, and
  SHA-256-pinned. The reproducible asset manifest covers Pyodide core, Python
  standard library, pdfminer and its exact transitive wheels, parser source,
  and required license texts. The self-hosted parser assets total 22,580,055
  bytes; no file exceeds the Cloudflare Pages 25 MiB file limit.
- A bounded headless Edge proof executed the exact self-hosted runtime and
  fixed parser source in a module Web Worker with external name resolution
  blocked. It extracted the expected text from a real PDF, preserved page 1 as
  its source reference, made zero external network requests, wiped disposable
  byte buffers, and completed cold in 4,221 ms against the 10-second engine
  readiness gate.
- The parser bounds pages at 500, layout elements at 10,000 per page, page text
  at 100,000 code points, total text at 2,000,000 code points, asset chunks at
  4,096, and each parser proof attempt at thirty seconds; the separate hostile
  preflight Worker remains ten seconds. Asset, schema, parse, or
  runtime failures return one fixed safe failure and persist nothing.
- Native-code audit note: Pyodide core, `cryptography` 47.0.0, and `cffi` 2.0.0
  are exact official Pyodide Wasm wheels required by the approved runtime and
  pdfminer dependency graph. Their bytes and licenses are pinned; they execute
  only inside the disposable parser Worker, receive no key or remote data, and
  are not used for Aethelgard signing. Task 1.2 rejects encrypted PDFs before
  parsing, and any unexpected native/import failure fails closed.
- Forty-four root and nineteen frontend tests, Doctor, license integrity,
  zero-vulnerability audits, strict TypeScript, lint, and static export passed
  without warnings. Initial JavaScript is 175,319 gzip bytes under 307,200;
  the lazy parser Worker bundle is 34,966 raw / 12,406 gzip bytes. No paid path,
  remote parser, source-data network route, or browser storage was added.

### 26. Phase 1 Task 1.4 — DOCX parser

- Task 1.4: **PASSED** on 2026-08-29. Added the approved direct `python-docx`
  1.2.0 parser with exact Pyodide `lxml` 6.0.2 and `typing-extensions` 4.15.0
  dependencies. The common asset verifier/runtime is shared with PDF without
  changing the PDF contract.
- DOCX output contains text only and neutral one-based paragraph or
  table/row/column references. Body paragraphs and tables retain document
  order. No filename, relationship target, style, author, or other source
  metadata is returned.
- A real DOCX with a table before a paragraph passed in a disposable Edge
  module Worker. The exact self-hosted packages and fixed parser source kept
  both structural references in order, made zero external network requests,
  and completed cold in 6,179 ms against the 10-second readiness gate.
- The parser bounds structural units at 100,000, paragraphs at 20,000, tables
  at 2,000, rows per table at 5,000, cells per row at 256, returned sources at
  20,000, each source at 100,000 code points, total text at 2,000,000 code
  points, and each parser proof attempt at thirty seconds; hostile preflight
  remains ten seconds. Empty, malformed, schema,
  asset, native, and runtime failures fail closed with fixed safe output.
- Native-code audit note: the exact official Pyodide `lxml` Wasm wheel is the
  required python-docx XML dependency. It runs after the hostile OOXML/DTD/
  entity/external-content gate, only inside the disposable parser Worker, and
  receives no secret or network data. Its bytes and license are pinned.
- Parser assets now total 24,516,507 bytes; the largest individual Pages file
  is 9,597,831 bytes under 25 MiB. Nineteen frontend tests, the PDF regression,
  the DOCX browser proof, manifest hashes, strict TypeScript, lint, licenses,
  and static export passed without warnings. Initial JavaScript is 175,321
  gzip bytes; the lazy parser Worker is 37,293 raw / 13,003 gzip bytes. No npm
  dependency, paid path, persistence, or source-data network route was added.

### 27. Phase 1 Task 1.5 — PPTX parser

- Task 1.5: **PASSED** on 2026-08-29. Added the approved direct `python-pptx`
  1.0.2 parser, reusing the exact pinned `lxml` and `typing-extensions` runtime.
  It returns bounded slide text with neutral one-based slide references and
  includes visible text-frame and table-cell content in slide order.
- Pillow 12.2.0 was not added: its current official advisory record contains
  applicable memory, denial-of-service, and native-memory issues fixed in
  12.3.0, which is not in the approved Pyodide 314.0.5 package set. The fixed
  parser installs a fail-closed image/font-decoder import stub. XlsxWriter is
  also omitted because it is reachable only through presentation/chart-writing
  code, not the read-only text extraction path.
- A real text-bearing PPTX containing a text shape, table cell, and PNG passed
  in a disposable Edge module Worker. Text and table content retained slide 1;
  the image was not decoded, Pillow and XlsxWriter remained absent, two
  write-only package-data files were pruned, external network requests were
  zero, and cold completion was 5,838 ms against the 10-second readiness gate.
- The parser bounds slides at 500, shapes per slide at 10,000, table cells per
  slide at 50,000, slide text at 100,000 code points, total text at 2,000,000
  code points, and each parser proof attempt at thirty seconds; hostile
  preflight remains ten seconds. Image/font access,
  empty text, malformed structure, schema, asset, native, or runtime failure
  fails closed. It adds no OCR or image-processing claim.
- Native-code audit note: no vulnerable Pillow native wheel is present. The
  exact `python-pptx` wheel uses the already-audited pinned `lxml` Wasm only
  after hostile OOXML prevalidation and inside the disposable parser Worker.
  The proof and manifest regressions enforce the Pillow/XlsxWriter absence.
- Parser assets total 24,989,295 bytes; the largest individual file remains
  9,597,831 bytes under 25 MiB. Nineteen frontend tests, parser asset hashes,
  the focused PPTX browser regression, TypeScript, strict lint, licenses, and
  static export passed without warnings. Initial JavaScript is 175,334 gzip
  bytes; the lazy parser Worker is 38,678 raw / 13,242 gzip bytes. No npm
  dependency, paid path, persistence, or source-data network route was added.

### 28. Phase 1 Task 1.6 — XLSX parser

- Task 1.6: **PASSED** on 2026-08-29. Added the approved direct `openpyxl`
  3.1.5 reader with its exact pure-Python `et-xmlfile` 2.0.0 dependency. The
  workbook is opened read-only with links disabled and formulas returned as
  inert source text, never calculated or executed.
- Output contains only bounded cell text plus neutral one-based sheet indexes
  and cell coordinates. Raw sheet names, workbook metadata, relationship
  targets, filenames, styles, and links are not returned.
- A real XLSX with a deliberately sensitive sheet name, inline text, and a
  formula passed in a disposable Edge module Worker. It returned `A1` and the
  inert `B2` formula under sheet index 1, exposed no sheet name, made zero
  external network requests, and completed cold in 3,962 ms against the
  10-second readiness gate.
- The parser bounds sheets at 200, rows at 100,000, columns at 16,384, visited
  cells at 200,000, returned sources at 100,000, each source at 100,000 code
  points, total text at 2,000,000 code points, and each parser proof attempt at
  thirty seconds; hostile preflight remains ten seconds. Non-finite numbers,
  empty text, malformed structure, schema, asset, or runtime failure fail closed.
- Parser assets total 25,258,264 bytes; the largest individual file remains
  9,597,831 bytes under 25 MiB. Nineteen frontend tests, parser asset hashes,
  the focused XLSX browser regression, TypeScript, strict lint, licenses, and
  static export passed without warnings. Initial JavaScript is 175,333 gzip
  bytes; the lazy parser Worker is 40,573 raw / 13,669 gzip bytes. No native or
  npm dependency, paid path, persistence, or source-data network route was added.

### 29. Architecture 2.1 execution hardening

- Owner-approved execution hardening: **PASSED** on 2026-08-29 under EDR 37.
  Runtime topology, mission, privacy boundary, exact-zero policy, providers,
  cryptography, supported browsers and visual direction are unchanged.
- Canonical tasks are Phase 1: 22, Phase 2: 14, Phase 3: 26 and Phase 4: 12.
  Phase exits are separate gates; Task 4.12 is the reviewed production release.
- Registries contain 118 Bounds, 37 Schemas and 28 Failures. Every Phase 1–4
  task has a complete execution contract and only known registry references.
- `architecture:lint` and seven tooling/consistency tests pass. Task-context
  extraction returns only the requested task and referenced registry entries.
  The exact staged Git-blob hash is
  `ccf4897db878f27a49aa609dc6cdb523890a1980e303996f8ccecbf873d5d053`.
- Consistency regressions preserve completed Phase 0 and Tasks 1.1–1.6 values.
  No runtime dependency, paid path, persistence, secret, production resource,
  source-data network route, Phase 2 implementation or architecture drift was
  introduced.
### 30. Phase 1 Task 1.7 — CSV and TXT parsers

- Task 1.7: **PASSED** on 2026-08-29. Added only fixed project-owned Python
  using the approved Python 3.14 standard-library `csv`, UTF-8 decoding, and
  line handling. No package, native code, or service was added.
- CSV is parsed strictly as comma-delimited RFC-style records. Quoted multiline
  fields retain one logical row, formulas remain inert text, and output uses
  neutral one-based row/column references. TXT accepts strict UTF-8 with an
  optional BOM and returns non-empty content with its original one-based line
  range, including gaps for blank lines.
- Combined real CSV/TXT proofs passed in disposable Edge and Chrome module
  Workers. They
  preserved a multiline CSV field at row 2, an inert formula at row 3, and TXT
  content at lines 1 and 3, made zero external network requests, and completed
  cold in at most 3,800 ms against the 10-second readiness gate. Strictly
  malformed CSV, invalid UTF-8, 1,001 CSV columns, 100,001 CSV rows, and 200,001
  TXT lines all failed closed in both supported browsers.
- CSV bounds rows at 100,000, columns at 1,000, fields at 100,000 code points,
  returned sources at 100,000, and total text at 2,000,000 code points. TXT
  bounds lines at 200,000 with the same source and text bounds. Both retain the
  thirty-second parser proof hard stop, while hostile preflight remains ten
  seconds; both fail closed on encoding, syntax,
  schema, asset, size, empty-text, or runtime failure.
- Parser asset bytes remain 25,258,264 with the largest individual file at
  9,597,831 bytes. Nineteen frontend tests, parser source hashes, the focused
  CSV/TXT browser regression, TypeScript, strict lint, and static export passed
  without warnings. Initial JavaScript is 175,331 gzip bytes; the complete lazy
  parser Worker is 43,321 raw / 14,275 gzip bytes. No paid path, persistence,
  or source-data network route was added.

### 31. Phase 1 Task 1.8 — source-reference normalization

- Task 1.8: **PASSED** on 2026-08-30. All six strict parser-success
  envelopes now normalize locally into immutable schema-versioned records with
  contiguous ordinals and exact neutral PDF, DOCX, PPTX, XLSX, CSV, or TXT
  structural references.
- Normalization preserves source order and content and fails closed on unknown
  fields or formats, missing schema versions, gaps, duplicates, non-monotonic
  or invalid indices, empty content, or the canonical source-count,
  per-source, reference-byte, and total-text bounds. It emits no filename,
  sheet name, document metadata, network request, or stored state.
- The task exposed and corrected one prerequisite contract defect: validated
  parser-success results now retain `schema_version:"1"`. Textless PDFs also
  fail closed; the pinned parser source is 1,649 bytes with SHA-256
  `d6d30c0ffd379bb2f392a36e5fc8410366c0d7bd89da8e6f667fa553dbb16437`,
  and its supported-browser proof verifies both extraction and empty-PDF
  rejection with zero external requests.
- Five focused normalization tests, 55 root tests, 24 frontend tests,
  TypeScript, strict lint, architecture lint, Doctor, license checks, both
  Worker dry-runs, static export, and the 175,333-byte gzip initial-JavaScript
  gate passed without warnings. No dependency, paid path, persistence,
  secret, production resource, or source-data network route was added.

### 32. Phase 1 Task 1.9 — 8,000-word enforcement

- Task 1.9: **PASSED** on 2026-08-30. A local Unicode letter/number-run
  counter returns the unchanged immutable normalized records and exact integer
  word count through 8,000 words. At 8,001 it returns the fixed document Safe
  Mode result before redaction or network work; it never truncates or performs
  partial analysis.
- Exact 0, 1, 7,999, 8,000, 8,001 and multi-record Unicode fixtures passed.
  The over-limit proof made zero network requests. Five focused tests, all 29
  frontend regressions, TypeScript, strict lint, Doctor, license checks,
  static export, and the 175,333-byte gzip initial-JavaScript gate passed.
  No dependency, persistence, service, secret, paid path, or network route was
  added.

### 33. Architecture 2.1 Task 1.10 contract correction

- Owner-approved EDR 38: **PASSED** on 2026-08-30. Pinned `franc-min`
  returns normalized scores rather than integer distances. The language margin
  is now exactly `round((eng_score - runner_up_score) * 10,000)` integer basis
  points, and English must rank first with a margin of at least 2,000.
- This corrects an impossible implementation contract without changing
  English-only behavior, evidence thresholds, local-only classification,
  fail-closed handling, topology, privacy, cost, providers, cryptography, or
  phase scope. Architecture lint and eight tooling regressions passed.
- The authoritative exact Git-blob SHA-256 is
  `56fdc13dcde678c35dc8ad0ab67c28b9340d5095ed1a63999adde140c0c091c2`.
