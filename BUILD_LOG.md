# Aethelgard Build Log

Concise engineering status and evidence record. Git history contains detailed
historical work.

## Current State

- Architecture: **2.1 — APPROVED FOR BUILD**, execution-hardened under EDR 37.
- Authoritative exact Git-blob SHA-256:
  `56fdc13dcde678c35dc8ad0ab67c28b9340d5095ed1a63999adde140c0c091c2`.
- Phase -1: **CLOSED**.
- Preparation gate: **PASSED — MERGED** in PR #3 on 2026-08-28.
- Current implementation position: **PHASE 4 — IN PROGRESS** on
  `phase/4-trust-portfolio`; Task 4.1 passed.
- Phase 0 status: **PASSED — MERGED** in PR #7 on 2026-08-29.
- Phase 1 status: **PASSED — MERGED** in PR #11 on 2026-08-31.
- Phase 2 status: **PASSED — MERGED** in PR #16 on 2026-09-02.
- Phase 3 status: **PASSED — MERGED** in PR #18 on 2026-09-04.
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

### 34. Phase 1 Task 1.10 — English-language gate

- Task 1.10: **PASSED** on 2026-08-30. Added exact pinned offline
  `franc-min` 6.2.0 and a local gate that normalizes whitespace, takes the
  leading 20,000 Unicode code points, requires 40 letters and eight
  letter-bearing tokens, and applies the EDR 38 score-margin contract.
- Frozen clear-English and English-with-international-names cases passed with
  margins of 2,402 and 2,277 basis points. French, mixed English/French, and
  insufficient-text cases failed locally as `non_english`,
  `mixed_or_uncertain`, and `insufficient` in both Edge and Chrome with zero
  external requests.
- Four focused local tests, the two-browser proof, 57 root tests, 33 frontend
  tests, TypeScript, strict lint, architecture lint, Doctor, both npm audits
  with zero vulnerabilities, 176-package license checks, both Worker dry-runs,
  static export, and the 175,333-byte gzip initial-JavaScript gate passed.
  No translation, multilingual model, persistence, paid path, service, secret,
  production resource, or document-data network route was added.

### 35. Phase 1 Task 1.11 — Redaction Worker

- Task 1.11: **PASSED** on 2026-08-30. Added pinned offline Compromise
  14.16.0 behind structured PII rules and local context rules in a separate
  disposable module Worker. Exact/containing higher-priority spans suppress
  nested NER spans; stable typed ASCII placeholders are capped at 10,000 and
  64 characters.
- Strict local request/result validation preserves neutral source references
  and canonical source/text bounds. The PII mapping is absent from output,
  cleared on every core exit, and destroyed with Worker termination. Invalid
  input/output, startup, crash, allocation/limit, or the fixed 10-second
  deadline fails to privacy Safe Mode with zero retry and forbids later work.
- Real Edge and Chrome proofs replaced eight structured/context/NER entities,
  exposed no mapping, made zero external requests and storage writes, rejected
  an injected crash, and stopped injected loops at 10,005 and 10,012 ms. The
  complete lazy Redaction Worker bundle is 654,436 bytes, below 3 MiB.
- Eight focused local tests, the two-browser proof, 58 root tests, 41 frontend
  tests, TypeScript, strict lint, architecture lint, Doctor, both npm audits
  with zero vulnerabilities, 180-package license checks, both Worker dry-runs,
  static export, and the 175,333-byte gzip initial-JavaScript gate passed. No
  server redaction, mapping egress, rehydration, persistence, paid path,
  service, secret, or document-data network route was added.

### 36. Phase 1 Task 1.12 — frozen PII corpus integration

- Task 1.12: **PASSED** on 2026-08-30. The unchanged owner-approved corpus
  serializes to SHA-256
  `0c777c5fc3300eb0b00a29cf583b23ea6455a12a43d990531b88990d1d679467`
  and contains exactly 84 cases and 576 labelled entities across the six
  supported formats.
- The production redactor achieved 100% structured recall, 100% named-entity
  recall, 99.08% named-entity precision, 100% overall recall, 99.65% overall
  precision, and zero must-redact leaks. Every approved Section 12.4 floor
  passes; the runner exits nonzero on any hash, count, floor, or leak failure.
- The deterministic corpus regression, TypeScript, strict lint, architecture
  lint, and unchanged privacy/cost checks passed. No case was replaced,
  removed, or added, and no universal PII-accuracy claim, runtime dependency,
  network path, persistence, service, secret, or paid path was introduced.

### 37. Phase 1 Task 1.13 — network-boundary proof

- Task 1.13: **PASSED** on 2026-08-30. Instrumented Edge and Chrome page
  journeys processed synthetic PDF, DOCX, PPTX, XLSX, CSV, and TXT fixtures
  through the production hostile-preflight controller and production
  Redaction Worker, then emitted the first document-derived request only after
  successful local redaction.
- The first document-derived egress matched the exact bounded analyze shape.
  Asset and synthetic Turnstile requests contained no document material.
  Across 11 observed Edge requests and 10 Chrome requests, raw-source,
  unredacted-text, filename, object-URL, raw-label, and mapping egress were all
  zero; instrumented browser storage writes were zero; every created parser or
  redaction Worker terminated.
- The preflight-only proof stubs only the unreachable Pyodide parse import; it
  executes the production parser-worker preflight path and does not repeat or
  replace the already-passing six parser execution proofs. Raw byte markers
  and complete fixture encodings, private filenames, synthetic PII, mappings,
  storage APIs, request bodies, and resource URLs are all asserted.
- The two-browser boundary regression, 60 root tests, 41 frontend tests,
  TypeScript, strict lint, architecture lint, Doctor, both Worker dry-runs,
  static export, and the 175,338-byte gzip initial-JavaScript gate passed. No
  runtime dependency, persistence, service, secret, production resource,
  paid path, or additional application route was added.

### 38. Phase 1 Task 1.14 — redacted analysis request schema

- Task 1.14: **PASSED** on 2026-08-30. One shared strict Zod contract now
  defines browser serialization, public-edge validation, and a fresh
  TrustedRuntime validation for the exact redacted request shape. Unknown
  fields, invalid or duplicate references, non-canonical or duplicate output
  requests, invalid enums, unredacted structured PII, and every named request
  bound fail closed.
- Serialization accepts only a successful redaction result with zero declared
  leaks, emits only the five approved network fields, and enforces the
  524,288-byte UTF-8 body limit. Raw binary, filename, mapping, prompt,
  provider, URL, key, email, and extra fields cannot enter the contract.
- Six focused contract tests, the public-edge regressions, all 66 root and 41
  frontend tests including Edge/Chrome proofs, TypeScript, strict lint,
  architecture lint, Doctor, both Worker dry-runs, and the static export
  passed. Public/trusted Worker uploads were 741.59/795.50 KiB
  (114.97/131.94 KiB gzip), below the approved 3 MiB limit. No dependency,
  persistence, secret, paid path, service, route, or Phase 2 work was added.

### 39. Phase 1 Task 1.15 — Groq/OpenRouter router

- Task 1.15: **PASSED** on 2026-08-30. Added one project-owned direct HTTPS
  adapter inside TrustedRuntime with strict request/result schemas, fixed
  provider endpoints, 524,288-byte requests, 262,144-byte responses,
  30-second attempts, and 4,096 output tokens. It has no SDK, arbitrary URL,
  logging, persistence, retry, BYOK, browser call, or caller-selected model.
- Reviewed provider configuration pins Groq Free to current production model
  `openai/gpt-oss-20b` and OpenRouter to `openrouter/free`. OpenRouter requests
  require ZDR, deny data collection, require parameters, disable provider
  fallback, and set prompt/completion maximum prices to zero. Groq production
  release remains gated on the architecture-required account ZDR control.
- Five focused tests prove exact requests, private bearer placement, approved
  models and endpoints, OpenRouter privacy/free controls, bounds, timeout,
  HTTP/network failures, invalid JSON, and absence of logs/retries. TypeScript,
  strict lint, architecture lint, Doctor, both Worker dry-runs, and static
  export passed. No provider inference call, dependency, secret access,
  persistence, paid path, route, production mutation, or Phase 2 work occurred.

### 40. Phase 1 Task 1.16 — Strawman schema and prompt

- Task 1.16: **PASSED** on 2026-08-30. Added the exact strict
  `S-STRAWMAN-OUTPUT` Zod contract and one deterministic Strawman request
  builder. Findings are non-empty and every finding, risk, assumption, and
  quantitative candidate carries one to eight valid source references;
  invented and duplicate references, duplicate IDs, HTML, non-finite numbers,
  unknown fields, and all collection/response-bound violations fail closed.
- The fixed two-message prompt labels redacted sources as untrusted evidence
  data and forbids obeying embedded commands, tools, external knowledge,
  invented references, HTML, and prose outside JSON. `full` covers financial
  and operational, strategic and competitive, and security and compliance in
  one call; each narrower focus is selected by ordinary typed code.
- Six focused golden/adversarial tests plus the affected analyze and transport
  regressions passed (17 tests total), together with TypeScript, strict lint,
  architecture lint, Doctor, both Worker dry-runs, and static export. No AI
  call, dependency, secret access, persistence, route, paid path, specialist,
  router call, production mutation, or Phase 2 work occurred.

### 41. Phase 1 Task 1.17 — Steelman schema and prompt

- Task 1.17: **PASSED** on 2026-08-30. Added the exact strict
  `S-STEELMAN-OUTPUT` contract and one deterministic critic request builder.
  Critique kinds are limited to the six approved values; item IDs, linked
  Strawman finding IDs, and evidence references must be unique and valid.
  Unknown/status/report fields, HTML, invented links/references, and item,
  evidence, or response-bound violations fail closed.
- The fixed two-message prompt accepts only validated redacted sources and a
  validated Strawman, treats both as untrusted evidence data, and directs one
  critic call to find omissions, contradictions, counter-evidence,
  unsupported claims, nuance, and missed connections. It forbids tools,
  external knowledge, report generation, HTML, and prose outside JSON.
- Six focused golden/adversarial tests plus affected Strawman and transport
  regressions passed (17 tests total), together with TypeScript, strict lint,
  architecture lint, Doctor, both Worker dry-runs, and static export. No AI
  call, unvalidated stage input, dependency, persistence, route, paid path,
  production mutation, report generation, or Phase 2 work occurred.

### 42. Phase 1 Task 1.18 — Oracle schema and prompt

- Task 1.18: **PASSED** on 2026-08-30. Added the exact strict
  `S-ORACLE-OUTPUT` contract and one deterministic synthesis request builder.
  Every Steelman item must have exactly one resolved/unresolved entry; missing,
  duplicate, invented, or invalid resolutions fail. Findings,
  recommendations, risks, and finite quantitative candidates require valid
  source references, and all item, evidence, response, HTML, numeric, and
  unknown-field gates fail closed.
- The fixed two-message prompt accepts only validated redacted sources,
  Strawman, and Steelman inputs; treats all as untrusted evidence data; and
  requires every critique to be resolved or explicitly left unresolved. It
  forbids tools, external knowledge, invented evidence, HTML, report/PDF
  rendering, and prose outside JSON.
- Six focused golden/adversarial tests plus affected Strawman and Steelman
  regressions passed (18 tests total), together with TypeScript, strict lint,
  architecture lint, Doctor, both Worker dry-runs, and static export. No AI
  call, unchecked intermediate, dependency, persistence, route, paid path,
  production mutation, report generation, or Phase 2 work occurred.

### 43. Phase 1 Task 1.19 — bounded provider failover

- Task 1.19: **PASSED** on 2026-08-30. Added a request-local three-stage
  orchestrator with explicit Groq-then-OpenRouter-Free execution, at most two
  provider attempts per stage and six overall, 30-second transport attempts,
  and one 180-second wall cancellation signal. Normal success makes exactly
  three calls and returns only the fully validated Oracle.
- Any transport, timeout, provider-envelope, JSON, or stage-schema failure
  permanently retires that provider for the remainder of the request. Groq is
  never resurrected after fallback; a terminal OpenRouter failure or wall stop
  returns a fixed analysis Safe Mode and forbids later stages, partial Oracle,
  PDF, and signing. Turnstile tokens and provider keys never enter prompts.
- Seven focused permutation/cancellation tests plus affected transport and
  Oracle regressions passed (18 tests total), together with TypeScript, strict
  lint, architecture lint, Doctor, both Worker dry-runs, and static export.
  Tests proved three normal calls, no more than six under every exercised
  failure permutation, hard invalid-schema failover, terminal-stage stopping,
  no persistence/logging/retry loop, and no paid provider. No live AI call,
  dependency, production mutation, route, persistence, or Phase 2 work occurred.

### 44. Phase 1 Task 1.20 — prompt-injection controls

- Task 1.20: **PASSED** on 2026-08-30. Added one shared fixed prompt boundary
  for all three stages. Only the developer-authored system message has
  instruction authority; each bounded JSON payload is held in one user message
  between fixed untrusted-data markers, and quoted marker/role/system text
  remains inert. The prompt explicitly grants no tool, route, network, file,
  storage, signing, email, or deployment capability.
- Froze five direct, indirect/delimiter, secret-exfiltration, tool/control, and
  HTML/schema attacks under canonical corpus SHA-256
  `41b2fb352e67266ce56563ce1ee242d880c94e79c8eba625c8e499d2d838238f`.
  None changed message roles/count, fixed system prompts, provider destination,
  transport fields, stage order, output schema, or application control.
  Malicious tool/HTML model outputs hard-failed both providers to Safe Mode.
- Five focused corpus/boundary tests plus every affected stage and orchestrator
  regression passed (30 tests total), together with TypeScript, strict lint,
  architecture lint, Doctor, both Worker dry-runs, and static export. No live
  model call, dynamic system prompt, tool, new capability, dependency,
  persistence, route, production mutation, paid path, or Phase 2 work occurred.

### 45. Phase 1 Task 1.21 — plain functional dashboard

- Task 1.21: **PASSED** on 2026-08-31. Connected the existing browser-local
  preflight/parser, normalization, 8,000-word, exact English, disposable
  Redaction Worker, fresh Turnstile, and private TrustedRuntime analysis path.
  Only the strict redacted request crosses the network; the private runtime
  returns either the fully validated Oracle or fixed Safe Mode. The attempt
  always consumes and resets its Turnstile challenge.
- Added a semantic browser-only dashboard with progress, fixed fault states,
  confidence, structural evidence links, critique resolutions, and neutral
  source-reference anchors. React text rendering is used exclusively; model
  HTML is neither accepted nor interpreted. The view has no download, report,
  result route, persistence, chat, email, BYOK, upload fallback, or Phase 2
  output behavior.
- Desktop Edge and Chrome passed keyboard/semantic success and fault proofs,
  escaped-text checks, and zero instrumented storage writes. All 105 root and
  45 frontend regressions passed, together with TypeScript, strict lint,
  architecture lint, Doctor, two Worker dry-runs, static export, and zero-
  vulnerability audits. Public/trusted Worker uploads were 741.65/764.76 KiB
  (114.98/119.57 KiB gzip). Lazy local-engine loading reduced initial
  JavaScript from the failing 321,128-byte measurement to 179,261 gzip bytes,
  below the 307,200-byte bound. No dependency, production mutation, paid path,
  persistence, new application route, or architecture drift was introduced.

### 46. Phase 1 Task 1.22 — parser/redactor/AI fault reflexes

- Task 1.22: **PASSED** on 2026-08-31. Parser crash, timeout, and allocation
  faults receive exactly one new parser-controller invocation and therefore
  one fresh disposable module Worker. A successful second attempt continues;
  a second fault returns fixed labelled client-resource Safe Mode. Invalid
  documents do not use the resource retry. Every parser completion terminates
  its Worker and wipes any locally accessible source buffer.
- Redaction has zero retry: error, timeout, invalid result, or thrown failure
  terminates locally in fixed privacy Safe Mode with no network or AI work.
  Provider failure remains solely under the already-passing bounded Task 1.19
  Groq-to-OpenRouter-Free orchestrator: at most six attempts, no provider
  resurrection, no partial output, and the 180-second wall signal forbids later
  stages. Every UI attempt consumes and resets Turnstile, including local
  runtime-load failure.
- The injected fault matrix passed all recovery counts, fresh-parser success,
  terminal labels, cleanup, zero forbidden downstream calls, and fixed-message
  checks. All 105 root and 54 frontend Phase 0/1 regressions passed, together
  with TypeScript, strict lint, architecture lint, Doctor, both Worker dry-runs,
  and static export. Initial JavaScript was 179,328 gzip bytes against the
  307,200-byte bound. Dependencies were unchanged from Task 1.21's zero-
  vulnerability audit. No extra retry, persistence, dependency, production
  mutation, paid path, partial output, Phase 2 behavior, or architecture drift
  was introduced.

### 47. Phase 1 exit gate

- **PHASE 1 — PASSED** on 2026-08-31. All Tasks 1.1–1.22 and the complete
  Phase 0/1 regression set passed. The gate covered all six formats, 15 MiB
  and 8,000-word boundaries, hostile containers, the exact English decision,
  the frozen 84-case/576-entity PII corpus with zero must-redact leaks, strict
  schemas, bounded provider failover, and fixed fault reflexes.
- A canonical supported-browser journey used a real TXT `File` containing
  clear English and structured PII. In both Edge and Chrome it traversed the
  production disposable parser Worker, language gate, disposable Redaction
  Worker, strict analyze boundary, and production orchestrator. It produced a
  valid source-linked Oracle through exactly one analyze request and exactly
  `strawman:groq`, `steelman:groq`, `oracle:groq`; both created Workers were
  terminated, raw/PII/filename egress was zero, and browser storage writes
  were zero.
- Final evidence: 106 root tests and 54 frontend tests passed; TypeScript and
  warnings-as-errors lint passed; architecture lint and Doctor passed; all 180
  package licenses and three vendored assets passed; both npm trees reported
  zero vulnerabilities; both Worker dry-runs and the static Pages export
  passed; initial JavaScript was 179,328 gzip bytes against 307,200. Exact-zero
  and privacy boundaries are unchanged. No production resource, secret, live
  provider call, persistence, new dependency, paid path, Phase 2 behavior, or
  architecture drift was introduced. Phase 2 remains unauthorized pending
  explicit owner approval after review and merge of the Phase 1 pull request.

### 48. PR #11 check remediation

- On 2026-08-31, GitHub CodeQL correctly identified unnecessary incomplete
  regular-expression escaping in a redactor test. The test now checks the
  fixed literal placeholders with `String.includes`; no dynamic regular
  expression or production behavior changed.
- GitHub's Ubuntu runner could not start its headless browser because the
  shared proof launcher lacked Linux CI container flags. The one launcher now
  adds `--no-sandbox` and `--disable-dev-shm-usage` only when `CI=true`, and
  allows a bounded 30-second cold-start window. Proof assertions require both
  Chrome and Edge on the Windows release host and Chrome on GitHub's Linux
  host, where Edge is not installed. Local CI-mode proofs passed for the
  language gate, all six parsers, redaction, the network boundary, dashboard,
  and complete Phase 1 journey; strict lint and diff checks also passed.
- The unrelated Cloudflare Workers Builds status is the previously documented
  non-production branch deployment attempt, not the required GitHub-native CI
  job. Architecture 2.1's Durable Object has no Worker preview URL, production
  remains frozen, and no production deployment was attempted as remediation.

### 49. Canonical repository reconciliation and Next.js security patch

- On 2026-08-31, PR #11 was merged to protected `main` using GitHub's signed
  squash path because signed-commit protection correctly rejected an unsigned
  rebase merge. All required GitHub CI and security checks passed and the
  resolved CodeQL conversation had an underlying code fix.
- Obsolete or over-broad Dependabot PRs #4, #5, #6, #10 and #12 were closed
  with their remote branches removed. They were respectively superseded,
  based on obsolete dependency state, or bundled unrelated major TypeScript 7
  modernization.
- Dependabot closed conflicting PR #8 after `main` changed. Its exact required
  change was preserved on one signed replacement maintenance branch: active
  Next.js was updated only from 16.3.2 to security release 16.3.3 with a
  normally regenerated lockfile. The complete required CI gate passed: Doctor,
  licenses, both zero-vulnerability audits, typecheck, strict lint, 106 root
  tests, 54 frontend tests, both Worker dry-runs, and the static frontend build.
- Cloudflare non-production branch builds are disabled while production stays
  on `main`; no repository workaround, production deployment, architecture
  change, test weakening, or Phase 2 implementation was introduced.

### 50. Cloudflare production deployment ordering correction

- On 2026-08-31, the public production build failed with Cloudflare code 10061
  because deployed script `aethelgard-trusted-runtime` was still the deliberate
  Phase 0 secret-holder placeholder. That placeholder exported only a private
  404 handler; the canonical repository already correctly exported named
  Durable Object class `TrustedRuntime` and declared `[exports.TrustedRuntime]`.
- Relevant typecheck, 14 public/private boundary tests, and both Worker dry-runs
  passed. The canonical private Worker was then deployed first. Cloudflare
  reported `Created: TrustedRuntime`, no public target, 35 ms startup, and
  version `dd044786-d5aa-44af-bea1-6867788a12ba`. Its five required secret
  names remained present; no secret value was read or printed.
- The unchanged public Worker then deployed successfully with its external
  `TrustedRuntime` binding resolved, 24 ms startup, and version
  `fbf4c117-4697-4605-bfde-8bd8f679be2a`. Live `/health` returned HTTP 200 and
  Architecture 2.1 status `ok`.
- The correction was deployment order only: private runtime before dependent
  public edge. No source, architecture, boundary, route, persistence, paid
  path, secret, test, branch protection, or Phase 2 implementation changed.

### 51. Phase 2 Task 2.1 — complete premium UI system

- Task 2.1: **PASSED** on 2026-08-31. The existing typed Scandinavian token,
  palette and self-hosted font foundation now styles the complete document,
  analysis-option, verification, action, Oracle dashboard, evidence, source and
  Safe Mode surfaces. The implementation retains semantic fieldsets, headings,
  lists and sections; obvious focus states; restrained radii and transitions;
  and an explicit reduced-motion override without a theme or UI dependency.
- The shared build/Doctor phase marker now reports the authorized Phase 2.
- The deterministic Chrome/Edge proof passed computed palette, typography,
  divider, evidence, semantic-heading, keyboard-focus, reduced-motion, escaped
  output, Safe Mode and zero-storage checks. Four design-system tests and all
  55 frontend regressions passed with strict typecheck and lint.
- Static export passed. Initial JavaScript measured 179,545 gzip bytes against
  `B-FRONTEND-JS-GZIP-BYTES` 307,200; the largest static asset was pinned
  `pyodide.asm.wasm` at 9,597,831 bytes against `B-STATIC-ASSET-BYTES`
  26,214,400. Fonts remained local, licensed and hash-pinned. No architecture,
  network boundary, persistence, runtime dependency, production resource,
  Phase 3 behavior or unsupported-browser claim was introduced.

### 52. Phase 2 Task 2.2 — dashboard information architecture

- Task 2.2: **PASSED** on 2026-09-01. The validated Oracle dashboard now has
  one fixed professional reading order: executive summary, findings,
  recommendations, risks, quantitative candidates, critique resolutions and
  source references. A semantic section index exposes the same exact order;
  evidence links retain structural source targets and empty optional sections
  use explicit accessible statements instead of blank lists.
- The Chrome/Edge golden proof passed exact hierarchy, index destinations,
  four evidence targets, unchanged risk/quantitative content, keyboard focus,
  maximum 24-finding rendering, both empty states, Safe Mode, escaping and
  zero-storage checks. Strict typecheck/lint, Oracle schema/bound tests and the
  design-system regression passed.
- Layout and text remain deterministic application code over already validated
  `S-ORACLE-OUTPUT`; no AI HTML/layout, hidden evidence, content rewriting,
  persistence, dependency, network behavior or Phase 3 work was introduced.

### 53. Phase 2 Task 2.3 — Recharts visualizations

- Task 2.3: **PASSED** on 2026-09-01. Added the Architecture-approved Recharts
  implementation pinned at 3.10.1 and strict `S-CHART-DATA` parsing for bar or
  line charts, at most 64 finite source-linked points and at most eight charts.
  Invalid, empty, unknown-field, unsupported-kind and over-bound input omits
  the complete chart rather than rendering raw data.
- Each valid chart uses the shared visual tokens, an explicit title/kind/unit
  label, Recharts accessibility layer, and a visible semantic source-data table
  containing every value, unit and structural evidence link. No remote asset or
  invented number exists in the chart path.
- Chrome and Edge passed golden bar/line, accessibility, 64-point bound, empty,
  invalid and zero-remote-request proofs. The minified proof bundle measured
  264,410 gzip bytes against 307,200. Static production export passed with
  initial JavaScript at 179,764 gzip bytes; strict typecheck/lint, 219-package
  license validation and both zero-vulnerability audits passed. The only new
  license expression is permissive `MIT AND ISC`, whose two components were
  already approved. No chart is yet synthesized from Oracle data before Task
  2.4, and no persistence, provider, architecture or Phase 3 behavior changed.

### 54. Phase 2 Task 2.4 — deterministic chart transforms

- Task 2.4: **PASSED** on 2026-09-01. A pure typed transform now converts
  validated Oracle quantitative candidates into strict `S-CHART-DATA`, groups
  only candidates with exactly matching unit and context, preserves candidate
  and evidence order, and assigns stable chart IDs in first-seen order.
- Invalid candidates and groups above `B-CHARTS` are omitted deterministically;
  over-bound candidate collections fail closed. The transform never guesses,
  case-folds or converts units and has no provider, network or persistence path.
- Strict typecheck/lint and six focused schema/transform tests passed, covering
  finite values, units, evidence, grouping, ordering, invalid omission and all
  relevant bounds. No dependency, architecture, runtime topology, production
  resource or Phase 3 behavior changed.

### 55. Phase 2 Task 2.5 — shared report design tokens

- Task 2.5: **PASSED** on 2026-09-01. The approved web palette,
  typography, spacing and rule width now have one dependency-free canonical
  typed authority and one strict readonly `S-REPORT-TOKENS` projection for
  Browser Run reports. The existing frontend consumes that same authority.
- The report schema accepts only the fixed paper, charcoal, terracotta, local
  font stacks, exact spacing scale and rule width; unknown properties, remote
  font values, altered colors, arbitrary spacing and user styling fail closed.
  The projection uses 15 scalar/spacing entries against the 64-token bound.
- Web/report equality snapshots, allowed-property validation, strict
  typecheck/lint and the static production export passed. Existing local font
  license/hash checks also remained green. No remote asset, dependency,
  persistence, architecture, production resource or Phase 3 behavior changed.

### 56. Phase 2 Task 2.6 — service-owned HTML report template

- Task 2.6: **PASSED** on 2026-09-01. Added strict `S-REPORT-MODEL`
  validation and a fixed UTF-8 report template owned by TrustedRuntime. It
  renders executive summary, findings, recommendations, risks, bounded chart
  tables and verification key IDs in one deterministic A4 print order using
  the canonical `S-REPORT-TOKENS` projection.
- Every inserted string and structural evidence label is escaped. Strict input
  rejects caller HTML and unknown fields; fixed CSP permits no external
  resource, and the template contains no script, URL, remote font, user CSS or
  model-controlled markup. Five fixed sections remain below the 32-section
  bound; UI text and 1,048,576-byte HTML limits fail closed atomically.
- Golden output SHA-256
  `7a1eb1a3d91a980b75ddcbaac161eebee2fc1ad062ad7c784c83926033c1c9a7`
  passed deterministic-repeat, escaping/injection, CSP/resource, schema and
  bound tests. Strict typecheck/lint and the existing Browser Run/chart/token
  regressions passed. No dependency, persistence, production resource,
  architecture or Phase 3 behavior changed.

### 57. Phase 2 Task 2.7 — production Browser Run PDF

- Task 2.7: **PASSED** on 2026-09-01. Added the private production PDF
  path from branded service-owned report HTML through the fixed Browser Run
  `/pdf` Quick Action. JavaScript and caching remain disabled; both action and
  PDF timeouts are 15,000 ms. Returned bytes are held only in request memory
  and passed through unchanged after PDF header, trailer, content-type and
  8,388,608-byte validation.
- The production coordinator reserves the anonymous daily quota before its
  analysis/report callback, uses the existing two-job in-memory queue, settles
  trusted Browser Run milliseconds, refunds unused reservations before a
  Browser call, and fails closed on quota, state, queue, HTML, deadline,
  transport or PDF validation failure. Persistent state remains exactly UTC
  date plus aggregate Browser Run milliseconds.
- Exact-byte, malformed, oversized, quota, queue, timeout, fixed-option and
  state-schema regressions passed. A secret-free remote-development proof ran
  the production template through the real Browser Run binding five times:
  166, 458, 106, 99 and 182 ms, median 166 ms against the 5,000 ms target.
  The dev session was stopped and every disposable proof file was removed.
- Strict typecheck/lint and 14 focused Browser Run, quota, queue, HTML and PDF
  tests passed. No paid renderer, caller HTML path, second runtime, persistence,
  production deployment, architecture change or Phase 3 behavior was added.

### 58. Phase 2 Task 2.8 — deterministic XLSX writer

- Task 2.8: **PASSED** on 2026-09-01. Added the approved minimal OOXML
  writer with exact `fflate` 0.8.2 and named tree-shaken imports. It emits five
  fixed sheets—Analysis, Findings, Recommendations, Risks and Charts—with
  fixed canonical-token header styling, inline strings, numeric chart values,
  fixed relationships/properties and deterministic ZIP timestamps.
- Caller/model text never becomes a formula: leading formula characters are
  escaped as text, invalid XML controls fail closed, and the package contains
  no formula, macro, external-link or arbitrary workbook part. Sheet, row,
  column and 4,194,304-byte output bounds are checked without truncation; the
  maximal valid chart model produces exactly 513 rows on the Charts sheet.
- Golden XLSX SHA-256
  `8cc06315590d739dd2ed1bf4b259ac28dbb7fd020a533db56b35b981a0fb19e0`
  passed exact-entry, deterministic-repeat, injection, invalid-input and bound
  tests. A generated 5,028-byte proof opened read-only and without repair in
  installed Excel 16.0.20326.20112 with all five sheets and expected title;
  the generated workbook was then removed. The reproducible proof writer is
  retained for later compatibility gates.
- Strict typecheck/lint, nine focused report/XLSX regressions, the 220-package
  license gate and a zero-vulnerability production audit passed. No server
  Python, large workbook framework, persistence, architecture change,
  production resource or Phase 3 behavior was introduced.

### 59. Phase 2 Task 2.9 — deterministic text and Markdown outputs

- Task 2.9: **PASSED** on 2026-09-01. Added fixed UTF-8 plain-text and
  Markdown formatters over strict `S-REPORT-MODEL`. Both preserve the same
  service-owned order—title/focus, executive summary, findings,
  recommendations, risks, quantitative analysis and verification—and retain
  every structural evidence reference in deterministic source order.
- Markdown insertion escapes control punctuation, angle brackets, backslashes
  and URI-scheme colons. It creates no HTML, Markdown link, executable URI,
  model-selected heading or AI-formatted content. Both outputs fail closed
  atomically on invalid models or the 1,048,576-byte UTF-8 limit and retain
  Unicode without normalization or truncation.
- Golden plain-text SHA-256
  `dc12b10eccfc02bcfa33b96430830123ddc6cfad62fd1c02dcb91da9b64e10e5`
  and Markdown SHA-256
  `6a345cebc977cce6e05ea3aff6a76ee3708e1c710034f24360d4b7df55c078e1`
  passed repeat, fixed-order, evidence, escaping, Unicode, invalid-input and
  bound tests with strict typecheck/lint. No dependency, model call, HTML path,
  persistence, architecture, production resource or Phase 3 behavior changed.

### 60. Phase 2 Task 2.10 — bounded multipart analysis response

- Task 2.10: **PASSED** on 2026-09-01. Added strict
  `S-SIGNATURE-MANIFEST` and `S-ANALYZE-RESPONSE` contracts plus one fixed
  in-memory JSON response builder. It returns the validated dashboard and only
  successfully produced requested PDF, XLSX and text fields in canonical
  order, with `no-store`, JSON UTF-8 and `nosniff` headers.
- PDF inclusion requires valid bounded PDF header/trailer bytes, an exact
  matching SHA-256 digest, canonical 64-byte Ed25519 and 3,309-byte ML-DSA-65
  signatures, fixed algorithms and valid public-key IDs. XLSX and text fields
  enforce their own magic/UTF-8/byte bounds. Missing or failed PDF is omitted
  without presenting unsigned bytes; invalid request order, duplicates,
  unknown input fields and a serialized response over 8,388,608 bytes fail
  closed before any response is sent.
- All seven non-empty requested-part combinations, exact keys, headers,
  missing/changed PDF, total boundary, strict input and no-storage/no-token
  paths passed. Existing hybrid-signing cross-verification remained green;
  strict typecheck/lint passed. No result/download route, token, session,
  storage, retry, email, dependency, architecture change, production resource
  or Phase 3 behavior was introduced.

### 61. Phase 2 Task 2.11 — direct object-URL downloads

- Task 2.11: **PASSED** on 2026-09-01. Added browser-only download
  controls over validated `S-ANALYZE-RESPONSE`. PDF, detached signature JSON,
  XLSX and text are decoded into fixed-type Blobs only after the user selects
  the corresponding button, with fixed filenames and exact response bytes.
- Every object URL has a 300,000 ms maximum timer and is revoked after its
  click, on `pagehide`, `beforeunload`, component unmount, allocation/trigger
  failure or explicit disposal. Invalid/missing parts create no URL. Controls
  expose a polite success/failure status and never auto-download.
- Exact name/type/byte, delayed-use, maximum-lifetime, page-exit, failure and
  invalid-response unit cases passed. Real supported desktop Chrome and Edge
  passed user-trigger, exact Blob, four-name/type, revoke-on-use/exit/failure,
  zero-storage and zero-remote-request proofs.
- Strict frontend typecheck/lint passed. No retrieval route, token, service
  worker, cache, browser storage, network call, dependency, architecture
  change, production resource or Phase 3 behavior was introduced.

### 62. Phase 2 Task 2.12 — exact final-PDF hybrid signing

- Task 2.12: **PASSED** on 2026-09-01. Added the private production signing
  integration over exact Browser Run PDF bytes. It returns the original byte
  array unchanged only after the existing signer hashes it once, signs that
  digest with Ed25519 and ML-DSA-65, self-verifies both algorithms and emits a
  strict bounded `S-SIGNATURE-MANIFEST`.
- Independent Node verification accepted both signatures over the known
  SHA-256 fixture digest
  `904636248025ad20fb9c6bd8b700179a2a42edb5df3636e926c7e09055ee3f75`;
  changing one PDF byte made both verifications fail. Invalid PDFs, incomplete
  signature manifests and signer mutation fail closed; mutated input is
  restored and no partially signed output is returned.
- Seven real pinned-Wasm signing integrations passed the 50 ms median gate.
  Strict typecheck/lint and 11 focused signing/response regressions passed.
  Secrets remain private and wiped by the established signer. No generic or
  public signing route, caller digest, dependency, persistence, architecture
  change, production resource or Phase 3 behavior was introduced.

### 63. Phase 2 Task 2.13 — detached signature-manifest UX

- Task 2.13: **PASSED** on 2026-09-01. Wired the validated complete analysis
  response through browser memory to the existing explicit download controls.
  The PDF and exact pretty-printed version-1 `.sig.json` remain separate,
  share fixed paired filenames and are never persisted.
- The dashboard trust affordance displays the exact Ed25519 and ML-DSA-65 key
  IDs, explains that both signatures cover the exact PDF bytes, and states
  that verification does not prove source or analysis correctness. Semantic
  headings, descriptions, explicit buttons, a live download status and the
  verification-limits link passed in supported desktop Chrome and Edge. A
  requested but unavailable PDF is labelled Safe Mode and no unsigned or
  unverifiable PDF is offered.
- Strict local parsing rejects malformed, unknown-field and over-32,768-byte
  manifests. The known PDF matches its manifest digest; changing one byte
  fails the local pairing check. The report response remains memory-only and
  retains the existing eight-MiB total-response bound.
- Strict typecheck/lint, seven focused detached-download unit cases, 11 mission
  flow cases and the real Chrome/Edge lifecycle/accessibility proof passed. No
  private key, embedded/circular signature, generic verifier, persistence,
  dependency, architecture change, production resource or Phase 3 behavior
  was introduced.

### 64. Phase 2 Task 2.14 — synthetic signed static sample

- Task 2.14: **PASSED** on 2026-09-02. Added a plainly labelled
  `Synthetic static sample — not a live analysis` portfolio set: reviewed
  invented TXT source, strict dashboard model, production PDF, detached
  signature manifest and dedicated public verification keys. All five fixed
  Pages links resolve to committed static artifacts; no live fallback exists.
- The approved service-owned HTML and production Browser Run PDF path produced
  the 54,241-byte PDF in 127 aggregate Browser Run ms. Ephemeral sample-only
  private seeds existed only in generator memory, were wiped, and were not
  committed. The disposable preview session, generated bundles and logs were
  removed after use; no production resource changed.
- Independent Node verification accepted Ed25519 and ML-DSA-65 over exact PDF
  SHA-256 `d5b1b2cec7fb641bc1e39f3b642fa0ee132bfb6bcce21fb9ea36475335a830c6`.
  Changing one byte failed both algorithms. The 4,886-byte manifest and all
  source/PDF/report bounds passed; report and manifest strict schemas and the
  dedicated key IDs agree exactly.
- The 255-byte source is entirely fixed synthetic programme data, visibly
  labelled on its first line, and manual plus deterministic review found no
  person, owner, contact, URL, account or other real PII. Focused independent
  verification, strict typecheck/lint and the production static frontend build
  passed. No second host, dynamic fallback, private key, dependency,
  architecture change, persistent data, production change or Phase 3 behavior
  was introduced.

### 65. Phase 2 exit gate

- **PHASE 2 — PASSED** on 2026-09-02. The full Phase 2 and all earlier
  regression suite, both Worker dry-run builds, static Pages production build,
  strict typecheck/lint, zero-vulnerability audits, 220-package licence gate,
  architecture lint and Doctor's 23 checks passed.
- The exit gate found and corrected one composition defect: the private
  `/analyze` route had not yet invoked the individually passing report modules.
  It now composes validated Oracle output into the strict report model and
  evidence-only charts, generates only requested XLSX/text, uses the existing
  bounded Browser Run quota/queue for PDF, signs the exact returned bytes with
  both approved algorithms and emits the bounded in-memory response. Turnstile
  and all secrets remain inside `TrustedRuntime`; no new route was added.
- The composed premium-journey regressions passed dashboard, PDF, detached
  manifest, XLSX and text together. Independent verification accepted both
  signatures; quota exhaustion made zero Browser/signing calls, omitted PDF,
  preserved safe optional outputs and retained exactly the approved UTC-date
  plus aggregate-Browser-ms durable state.
- Supported Chrome and Edge passed the chart golden/accessibility, dashboard
  success/Safe Mode and direct-download lifecycle proofs after chart rendering
  was deferred until a report contains charts. Initial application JavaScript
  is 268,974 gzip bytes against the 307,200-byte gate. Existing Excel opening,
  deterministic OOXML compatibility and the signed static fallback remain
  green.
- Exact-zero, no-email/BYOK, no application persistence, no source/unredacted
  egress, secret-free public edge, private trusted runtime and architecture
  drift gates passed. No production deployment or Phase 3 implementation was
  performed. Phase 3 remains owner-gated.

### 66. Phase 2 PR CodeQL remediation

- PR #16's first aggregate CodeQL scan identified one high-severity incomplete
  string-escaping dataflow in the Markdown writer. The chained escape calls
  were consolidated into one explicit character-class pass before fixed
  URI-scheme colon escaping; output semantics and golden hash are unchanged.
- A literal Windows-style backslash-path regression was added. Focused tests,
  strict typecheck/lint and diff hygiene passed. No check, security control or
  branch protection was weakened.
- Both first CI runs also exposed a startup race in the existing browser proof:
  the DevTools port could appear just before its `/proof` target. Target lookup
  now waits at most five seconds in 50 ms intervals; browser execution and its
  60-second proof bound are unchanged.
- The focused Chrome/Edge language-gate proof, strict typecheck, lint and diff
  hygiene pass with the bounded target wait.
- The rerun then completed all 144 root tests and exposed only Node's
  `MODULE_TYPELESS_PACKAGE_JSON` warning in frontend ESM tests. The frontend
  package now declares its existing ESM boundary explicitly; its Next config
  uses the equivalent ESM form so warnings-as-errors remains enforced.

### 67. Phase 3 Task 3.1 — complete hostile corpus

- Task 3.1: **PASSED** on 2026-09-02. Froze a version-1 manifest of 47
  deterministic synthetic hostile cases with SHA-256 hashes and exact expected
  outcomes. All 20 Section 12.1 classes are represented; Office-specific
  threats cover DOCX, PPTX and XLSX, and the PDF/text boundaries remain
  explicit. Existing earlier regressions were retained unchanged.
- Chrome and Edge rejected all 47 cases exactly with zero external requests.
  The 256-case maximum, 15 MiB early source limit and 10-second preflight Worker
  bound remain unchanged. No real malware, scanner, remote dependency,
  persistence, production change or architecture drift was introduced.
- The frozen-manifest/hash test, focused browser proof, existing six preflight
  regressions, strict typecheck/lint, architecture lint and diff hygiene pass.

### 68. Phase 3 Task 3.2 — frozen PII corpus release gate

- Task 3.2: **PASSED** on 2026-09-02 without changing the approved corpus,
  release redactor or acceptance floors. The release-target browser bundle
  reproduced exact corpus SHA-256
  `0c777c5fc3300eb0b00a29cf583b23ea6455a12a43d990531b88990d1d679467`
  across 84 cases and 576 labelled entities.
- Structured recall, named recall and overall recall were `1.0`; named
  precision was `0.9908256880733946` and overall precision was
  `0.9965397923875432`, with zero must-redact leaks. These remain the frozen
  project regression baseline, not a universal accuracy claim.
- The static release build, exact corpus regression and existing Chrome/Edge
  Redaction Worker proof passed. Both browsers exposed no mapping, external
  request or persistent write and failed closed on crash and the ten-second
  timeout. No floor, dependency, production resource or architecture changed.

### 69. Phase 3 Task 3.3 — language fixtures release gate

- Task 3.3: **PASSED** on 2026-09-02. Froze the nine required local fixture
  classes: clear English prose, English XLSX table content, English with
  international names, Spanish, French, German, Swedish, mixed/ambiguous text
  and insufficient text. Each fixture records its exact schema-version-1
  decision under the release code.
- Chrome and Edge produced the complete expected matrix. All three English
  fixtures ranked `eng` first with integer margins of 2,402, 2,402 and 2,277
  basis points; all other fixtures failed closed with their exact reason.
  No language-data request occurred.
- The browser matrix, strict typecheck/lint and diff hygiene pass. The local
  `franc-min` dependency, 40-letter/eight-token evidence floors, 20,000-code-
  point sample and 2,000-basis-point threshold are unchanged; no translation,
  online service, persistence, production change or architecture drift exists.

### 70. Phase 3 Task 3.4 — prompt-injection fixtures release gate

- Task 3.4: **PASSED** on 2026-09-02. Preserved the five existing synthetic
  attacks and added explicit role-confusion and signing-control cases. The
  seven-case frozen corpus SHA-256 is
  `da270a2108e9454d6fa10a01bd645378bec28725bbbb71d3d8a55f6065a8affc`.
- Every attack remains inert untrusted JSON under the fixed system prompts for
  Strawman, Steelman and Oracle. Routes, provider destinations, request fields,
  tool availability and exact stage order cannot be source-controlled.
  Invalid tool, HTML/schema and signing-control output at each respective stage
  exhausts only the approved provider pair and returns analysis Safe Mode;
  nothing reaches reporting or signing.
- The five focused injection regressions, 31 affected AI transport/orchestrator/
  schema regressions, strict typecheck/lint and diff hygiene pass. No live AI,
  secret, capability, dynamic destination, dependency, production change or
  architecture drift was introduced.

### 71. Phase 3 Task 3.5 — Browser Worker crash handling

- Task 3.5: **PASSED** on 2026-09-04. Added one deterministic Chrome/Edge
  lifecycle proof on the existing mission, parser-controller and redaction-
  controller implementation. A crashing Parser Worker is terminated, exactly
  one fresh Worker completes the retry, and analysis proceeds once. No Worker
  instance is reused.
- A crashing Redaction Worker is terminated with zero retry and zero network
  call. Both browsers return the exact privacy Safe Mode object; the injected
  private crash marker is absent from the result. Created and terminated Worker
  counts match exactly in both scenarios.
- The browser lifecycle proof, 17 affected mission/parser/controller
  regressions, strict typecheck/lint and diff hygiene pass. No runtime behavior,
  dependency, production resource, persistence or architecture changed.

### 72. Phase 3 Task 3.6 — parser timeout handling

- Task 3.6: **PASSED** on 2026-09-04. Extended the Task 3.5 browser lifecycle
  harness with a hanging Parser Worker matrix. The release controller remains
  fixed at exactly 30,000 ms with no adaptive extension; the deterministic
  browser proof scales that same controller timer to 100 ms per attempt so the
  lifecycle path is exercised without weakening or delaying the release gate.
- Chrome and Edge each terminated two distinct hanging Workers after exactly
  one fresh retry, released both transferred buffers, made zero redaction or
  network calls and returned the exact client-resource Safe Mode. Two serial
  proof deadlines completed within the fixed 180–2,000 ms test window.
- The complete browser timeout proof, affected parser/mission regressions,
  strict typecheck/lint and diff hygiene pass. No timeout, retry policy, runtime
  code, dependency, upload fallback, production resource or architecture
  changed.

### 73. Phase 3 Task 3.7 — allocation failure handling

- Task 3.7: **PASSED** on 2026-09-04. Added one strict internal parser-Worker
  allocation signal containing only schema version, failure state and the named
  `allocation` reason. The Worker emits it only for `RangeError` or a matching
  WebAssembly memory failure; all details remain private. The controller maps
  the signal to the existing parser allocation result and still terminates the
  disposable Worker and releases its transferred buffer.
- The shared lifecycle harness now applies the exact 50,331,648-byte pressure
  allocation in Chrome and Edge. One injected parser allocation failure
  recovers on exactly one fresh Worker; two failures return exact client-
  resource Safe Mode. A redactor allocation failure gets zero retry and exact
  privacy Safe Mode. Every created Worker terminates, owned pressure buffers
  are wiped, transferred page buffers are released and network calls remain
  zero.
- The complete pressure matrix, affected parser/mission regressions, strict
  typecheck/lint and diff hygiene pass. No server/upload fallback, persistence,
  unbounded allocation, dependency, production resource or architecture
  changed.

### 74. Phase 3 Task 3.8 — fresh-Worker recovery

- Task 3.8: **PASSED** on 2026-09-04. Extended the shared lifecycle proof so
  the first injected parser crash is followed by the actual release Parser
  Worker and its newly initialized, self-hosted Pyodide runtime. Chrome and
  Edge each used two distinct Worker identities and terminated the first
  Worker before creating the recovery Worker.
- The fresh Worker returned the exact strict TXT parser result, analysis
  continued once, and the lifecycle event order proved both Workers
  terminated. Exactly one retry occurred under the unchanged 30,000 ms
  release deadline; Task 3.6 alone retains its isolated proof-time scaling.
- All 26 pinned parser/runtime/source assets matched their canonical SHA-256
  manifest. The supported-browser lifecycle proof, strict typecheck/lint and
  diff hygiene pass. No Worker reuse, external request, persistence,
  dependency, production resource or architecture change was introduced.

### 75. Phase 3 Task 3.9 — zero browser user-data storage

- Task 3.9: **PASSED** on 2026-09-04. Extended the existing Chrome/Edge
  boundary proof into a deterministic matrix covering all six source formats
  and all seven canonical combinations of PDF, XLSX and text outputs, plus an
  invalid-document failure journey and all four direct download actions.
- Instrumentation observes Web Storage, IndexedDB, Cache Storage, service-
  worker registration, OPFS/file-handle access and writes, Cookie Store and
  document-cookie writes. Every success, failure and download journey recorded
  exactly zero writes; all Workers terminated and every object URL was revoked.
- The exact `S-NETWORK-BOUNDARY-RESULT` remained passing in both supported
  browsers with zero raw-source, unredacted-text, filename or mapping egress.
  Browser matrices, download regressions, strict typecheck/lint and diff
  hygiene pass. No allowlist, persistence, dependency, production resource or
  architecture change was introduced.

### 76. Phase 3 Task 3.10 — provider outage handling

- Task 3.10: **PASSED** on 2026-09-04. Added a deterministic table-driven
  matrix for timeout, network, HTTP 429, HTTP 5xx/unavailable, policy and
  invalid-schema faults at Strawman, Steelman and Oracle for both approved
  providers. Transport status mapping is proven for Groq and OpenRouter Free.
- Every Groq fault triggers exactly one OpenRouter Free attempt at that stage
  and suppresses Groq for the remainder of the request. A matching
  OpenRouter fault returns the exact analysis Safe Mode, performs no later
  stage, emits no partial report and stays within two attempts per stage and
  six total attempts. No paid or third provider is reachable.
- A controlled in-flight request proves that the fixed 30,000 ms attempt
  signal cancels transport; the existing 180,000 ms wall-signal proof cancels
  the complete analysis. All 14 focused transport/orchestrator tests, strict
  typecheck/lint and diff hygiene pass. Runtime code, provider policy,
  dependency, persistence, production resources and architecture are
  unchanged.

### 77. Phase 3 Task 3.11 — rate-limit handling

- Task 3.11: **PASSED** on 2026-09-04. The existing public-edge Rate Limiting
  binding remains fixed at five accepted attempts per source IP per Cloudflare
  location per 60 seconds and executes before body reads or TrustedRuntime.
- A deterministic boundary matrix proves attempts one through five forward,
  attempt six returns the fixed HTTP 429 `rate_limited` response, a different
  source IP remains isolated, and a separate synthetic Cloudflare location has
  its own allowance. Denial performs zero trusted calls.
- Binding failure returns the fixed no-store HTTP 503 service response and
  performs zero trusted calls. All 14 public-edge/config tests, strict
  typecheck/lint and diff hygiene pass. No IP is stored in application state;
  runtime code, limits, dependency, production resources and architecture are
  unchanged.

### 78. Phase 3 Task 3.12 — schema failure handling

- Task 3.12: **PASSED** on 2026-09-04. Added one deterministic mutation table
  covering missing, additional, wrong-type, invalid-enum/reference and
  over-bound payloads for the Analyze request, independently revalidated
  TrustedRuntime request, Strawman, Steelman, Oracle and Analyze response
  schemas. The suite contains 36 bounded mutations.
- Every mutation fails at its registered strict boundary. Existing public-
  ingress tests prove rejected requests make zero TrustedRuntime calls;
  orchestrator tests prove invalid AI stage output uses only the approved
  fallback or fixed analysis Safe Mode with no later stage or partial report.
- All 50 directly affected schema, ingress and orchestrator tests, strict
  typecheck/lint and diff hygiene pass. No unknown-field stripping, security-
  field coercion, content logging, runtime change, dependency, production
  resource or architecture change was introduced.

### 79. Phase 3 Task 3.13 — Turnstile failure handling

- Task 3.13: **PASSED** on 2026-09-04. The official Cloudflare test-key path
  and deterministic mocks cover valid, invalid, missing, 2,049-character,
  wrong-action, wrong-hostname, replayed and unavailable verification cases.
  Each accepted-size token causes exactly one Siteverify call; missing and
  oversized tokens cause none, and `remoteip` is never sent.
- A controlled in-flight request proves the fixed 5,000 ms Siteverify signal
  cancels transport. The 8,192-byte response bound remains enforced. Private-
  route structure proves unavailable verification returns fixed no-store HTTP
  503, every other rejection returns fixed no-store HTTP 403 requesting a
  fresh challenge, and both return before AI, Browser Run, PDF or signing.
- All 19 affected Turnstile, private-boundary, public-secret and request-
  contract tests, strict typecheck/lint and diff hygiene pass. The public edge
  remains secret-free; no bypass, token retry, runtime change, dependency,
  production resource or architecture change was introduced.

### 80. Phase 3 Task 3.14 — quota failure handling

- Task 3.14: **PASSED** on 2026-09-04. Corrected the existing PDF quota
  sequence so `TrustedRuntime` atomically reserves Browser Run capacity after
  Turnstile and before AI whenever PDF is requested. The reservation is passed
  into the existing renderer, refunded when analysis/report preparation stops
  early, settled to measured usage after rendering, and conservatively remains
  fully charged when Browser Run crashes without a trustworthy measurement.
- Below/at/above the 60,000 ms reservation boundary, concurrent reservation,
  lazy UTC rollover, queue depth two, queue saturation, rendering failure and
  crash settlement all pass. Exhausted PDF requests return exact quota Safe
  Mode before AI, Browser Run or signing; non-PDF requests require no quota.
- Persistent quota state contains only `utc_date` and
  `aggregate_browser_run_ms`, capped at 480,000 ms. Chrome and Edge render the
  fixed quota Safe Mode without an unsigned substitute. All 15 quota/report/
  route/browser tests, strict typecheck/lint and diff hygiene pass. No paid
  overflow, cron, user/job state, dependency, production resource or
  architecture change was introduced.

### 81. Phase 3 Task 3.15 — Browser Run failure handling

- Task 3.15: **PASSED** on 2026-09-04. Added one table-driven production
  renderer matrix for timeout, unavailable transport, non-PDF content,
  truncated PDF and declared over-bound output under the unchanged 15,000 ms
  deadline, 8,388,608-byte limit and queue depth two.
- Every fault returns no PDF bytes. Measured invalid responses settle quota to
  their reported usage; timeout and unavailable responses conservatively keep
  the 60,000 ms reservation. Composed report tests prove non-PDF, truncated
  and over-bound bytes make zero signing calls and expose no PDF or unsigned
  substitute; direct-download browser proofs remain passing.
- All 14 affected renderer, report, signing-boundary and Chrome/Edge download
  tests, strict typecheck/lint and diff hygiene pass. No second renderer,
  paid fallback, malformed download, dependency, production resource or
  architecture change was introduced.

### 82. Phase 3 Task 3.16 — signing failure handling

- Task 3.16: **PASSED** on 2026-09-04. Corrected report composition so a
  failure after valid PDF rendering is an atomic signing failure rather than
  an optional PDF omission. Invalid key material, Wasm failure, signing
  failure and either self-check failure now return only the fixed signing Safe
  Mode, with no PDF bytes, manifest, partial signature or private detail.
- Successful signing still covers the exact unchanged PDF bytes with SHA-256,
  Ed25519 and ML-DSA-65; independent verification passes and one changed byte
  fails both signatures. The manifest remains below 32,768 bytes and the
  measured seven-run median remains below 50 ms.
- The complete signing, supply-chain and report-boundary suites, strict
  typecheck/lint and diff hygiene pass. Existing seed, digest, randomness,
  snapshot and Wasm arenas retain their deterministic wipe paths. No one-
  signature fallback, generic signer, dependency, production resource or
  architecture change was introduced.

### 83. Phase 3 Task 3.17 — privacy/network boundary release gate

- Task 3.17: **PASSED** on 2026-09-04. Reused the release-target Chrome/Edge
  instrumentation across all six formats, seven output combinations, failure
  and download paths. The exact boundary result reports zero raw-source,
  unredacted-text, filename and mapping egress, zero browser storage writes,
  complete Worker termination and at most 128 observed requests.
- Explicit trusted-boundary assertions prove Groq and OpenRouter Free receive
  only strict redacted stage payloads. Browser Run receives only bounded,
  service-rendered report HTML and no source bytes, source filenames, archive/
  PDF encodings or known raw markers.
- The full privacy release matrix, provider/prompt, Browser Run and direct-
  download suites, strict typecheck/lint and diff hygiene pass. No persistence,
  logging, runtime dependency, production resource or architecture change was
  introduced.

### 84. Phase 3 Task 3.18 — production no-logging assertion

- Task 3.18: **PASSED** on 2026-09-04. Doctor now emits the exact bounded
  `S-DOCTOR-RESULT` contract: 23 named boolean checks, no secret values or user
  content, and a fixed failed status whenever any check fails.
- Both canonical production configs explicitly disable observability and omit
  Tail consumers, Logpush and Analytics Engine. Read-only inspection of the
  active public version `54ed4f13-cc3d-4edd-a217-482c4fded048` and private
  version `dd044786-d5aa-44af-bea1-6867788a12ba` found no deployed
  observability, Tail-consumer or Analytics Engine configuration. Source and
  dependency inspection found no application-content logging or telemetry
  product.
- Doctor, public/private boundary, Turnstile and supported Chrome/Edge network
  regressions, strict typecheck/lint and diff hygiene pass. No runtime,
  dependency, production resource or architecture change was introduced.

### 85. Phase 3 Task 3.19 — performance corpus

- Task 3.19: **PASSED** on 2026-09-04. Added one fixed, reproducible performance
  corpus (`1bcf99938b2e2c111659098541ed3be11b990f47a8b279a12518efe379244396`)
  spanning the supported Chrome/Edge shell and local pipeline, deterministic
  full analysis orchestration, the frozen Browser Run measurements and actual
  exact-byte hybrid signing.
- Controlled serial results were: shell p95 748 ms; clean engine p95 3,887.1
  ms; warm validation/parse/language/redaction median 18.5 ms; PDF median 166
  ms; signing median 3.268 ms; and synthetic full-analysis median 203.96 ms,
  p95 482.873 ms. All named Architecture 2.1 targets pass.
- All 24 affected browser, parser, language, redaction, AI, PDF, signing and
  performance tests, strict typecheck/lint and diff hygiene pass. The harness
  stores no document data and introduces no runtime dependency, production
  resource, privacy/security weakening or architecture change.

### 86. Phase 3 Task 3.20 — bundle, CPU, memory and output limits

- Task 3.20: **PASSED** on 2026-09-04. Read-only attribution proved the earlier
  166,456,174-byte result was measurement-harness contamination: response-size
  search and peak measurement shared one process. The corrected deterministic
  gate searches in disposable processes, then measures each maximum response
  shape once in a fresh process.
- Maximum PDF-only response was 8,388,606 bytes with a 73,100,822-byte measured
  peak; maximum mixed PDF/XLSX/text response was 8,388,607 bytes with a
  62,402,348-byte peak. Adding the exact 1,048,576-byte report-HTML and
  8,388,608-byte signing-arena bounds produced a conservative final peak of
  82,188,398 bytes, below `B-TRUSTED-MEMORY-BYTES` (100,663,296).
- Initial JS was 268,974 gzip bytes; the largest static asset was 9,597,831
  bytes; public/private Worker gzip sizes were 117,740/155,864 bytes; public
  CPU p99 was 0.222 ms; and the maximum response was 8,388,607 bytes. All 26
  affected output/PDF/signing/resource tests, strict typecheck/lint and diff
  hygiene pass. No runtime behavior, bound, dependency or architecture changed.

### 87. Phase 3 Task 3.21 — CodeQL gate

- Task 3.21: **PASSED** on 2026-09-04. The bounded CodeQL review examined the
  sole open result: medium alert #3 (`js/overly-large-range`) in XLSX XML-text
  validation. It was active and applicable; no high-severity result was open.
- Replaced the ambiguous literal control-character range with exact numeric
  XML 1.0 control checks. A complete table-driven regression rejects U+0000–
  U+0008, U+000B, U+000C and U+000E–U+001F while preserving permitted tab,
  line-feed and carriage-return characters.
- Focused XLSX tests, strict typecheck/lint and diff hygiene pass. The release-
  branch CodeQL check reports zero unresolved applicable high-severity alerts;
  no query, check, suppression, dependency or architecture was changed.

### 88. Phase 3 Task 3.22 — Dependabot gate

- Task 3.22: **PASSED** on 2026-09-04. Inspected both open Dependabot records
  (#12 manifest, #13 lockfile); both represented the same active direct
  `fflate` ZIP64 denial-of-service advisory (`GHSA-px8p-9vwx-vf98`). No active
  high- or critical-severity vulnerability was present.
- Applied the smallest compatible exact patch, `fflate` 0.8.2 → 0.8.3, and
  updated the root lockfile normally. Root and frontend audits now report zero
  vulnerabilities. The only full-gate repair made a static-sample assertion
  line-ending portable; sample bytes and signatures remain unchanged.
- All 227 root/frontend tests, release builds, strict typecheck/lint, audits and
  diff hygiene pass. No stack replacement, broad update, ignored finding,
  runtime service or architecture change was introduced.

### 89. Phase 3 Task 3.23 — secret-scanning gate

- Task 3.23: **PASSED** on 2026-09-04. GitHub native secret scanning and push
  protection remain enabled; the bounded API review returned zero open alerts,
  so zero true secrets required rotation or remediation. PR #18's GitGuardian
  check also passes.
- Deterministic Doctor, public-edge/config, private-migration and cryptographic
  supply-chain proofs pass. Generated Pages artifacts contain none of the five
  private runtime secret identifiers; committed signing records contain public
  verification material only, and migration tooling never prints secret values.
- All 12 focused tests and diff hygiene pass. No scan was disabled and no
  production value, key, fixture, dependency or architecture change was made.

### 90. Phase 3 Task 3.24 — license audit

- Task 3.24: **PASSED** on 2026-09-04. The deterministic license audit reviewed
  220 resolved root/frontend packages and three vendored assets, within the
  250-item bound. Every shipped item maps to an approved dependency identity
  and license; required Pyodide, font and `mldsa-native` notices match.
- The focused dependency, CI, browser-parser and cryptographic supply-chain
  suites pass, including all six pinned parser/runtime browser proofs. Both npm
  audits report zero vulnerabilities and diff hygiene is clean.
- No obsolete package, unknown license, missing notice, runtime license service,
  dependency addition or architecture change was found or introduced.

### 91. Phase 3 Task 3.25 — clean-machine disaster recovery

- Task 3.25: **PASSED** on 2026-09-04. Added a concise clean-machine runbook
  and one deterministic recovery runner. It uses a disposable remote clone,
  empty npm user configuration, isolated package cache and no production
  credential or copied personal state; all temporary checkout/cache/config/key
  artifacts are removed in its unconditional cleanup path.
- The warning-free proof recovered commit
  `f3ee6d345b0dbe4e4b82e0e94ed6c74b7e88421b` in 270 seconds. Exact
  architecture hash, Doctor, full tests, both Worker dry-runs, static build,
  pinned assets, synthetic sample, both signatures, changed-byte rejection and
  the disposable public-only key-generation procedure passed; the clone ended
  clean.
- The exact `S-RECOVERY-RESULT` reported every boolean true. No production
  mutation, hidden cache requirement, undocumented step, dependency, runtime
  service or architecture change was introduced.

### 92. Phase 3 Task 3.26 — exact-zero re-attestation

- Task 3.26: **PASSED** on 2026-09-04. The signed owner Free-account
  attestation from 2026-08-27 remains canonical. Current account evidence
  confirms the single static `aethelgard` Pages project on
  `aethelgard-3j9.pages.dev`, a secret-free public Worker and a route-less
  private runtime containing only the five approved secret bindings.
- Added one deterministic configuration proof covering the free hostname,
  public rate guard, private runtime boundary, Browser Run daily guard,
  bounded free-only provider route, standard GitHub-hosted CI and absence of
  paid/retired dependencies. It emits the exact `S-ZERO` result with GBP and
  USD upfront/monthly amounts, paid fallbacks and automatic top-ups all zero.
- The focused 23-test cost/quota/provider/config matrix, Doctor, strict
  typecheck/lint, both npm audits and diff hygiene pass. No paid fallback,
  billing mutation, runtime dependency, production resource or architecture
  change was introduced.

### 93. Phase 3 exit gate

- **PHASE 3 — PASSED** on 2026-09-04. All 26 sequential hardening tasks and
  all earlier regressions pass: 166 root tests and 63 frontend tests, both
  supported-browser matrices, production builds, strict typecheck/lint,
  Doctor, architecture lint and exact Git-blob hash, dependency audits,
  license audit, secret/security gates, recovery proof and exact-zero proof.
- Controlled serial performance remains within every release target: shell p95
  900 ms, clean engine p95 4,759.7 ms, warm local p95 24.8 ms, PDF p95 458 ms,
  signing p95 14.178 ms and full-analysis median 207.954 ms. The fixed corpus
  hash remains `1bcf99938b2e2c111659098541ed3be11b990f47a8b279a12518efe379244396`.
- Controlled resources pass: initial JS 268,974 gzip bytes, largest static
  asset 9,597,831 bytes, public/private Worker gzip 117,740/155,925 bytes,
  public CPU p99 0.304 ms, maximum response 8,388,607 bytes and conservative
  trusted-runtime peak 82,188,670 bytes against the 100,663,296-byte bound.
- Architecture hash remains
  `56fdc13dcde678c35dc8ad0ab67c28b9340d5095ed1a63999adde140c0c091c2`;
  privacy, exact-zero, no-persistence, secret-free edge, private runtime,
  provider order and hybrid exact-byte signing invariants are unchanged. Phase
  4 remains unauthorized pending owner review and merge of PR #18.

### 94. Phase 4 Task 4.1 — Trust page

- Task 4.1: **PASSED** on 2026-09-04. Added the static `/trust` route with the
  ten allow-listed trust claims, exact processing boundary, external
  processors, exact-zero behavior and owner-approved honest limits. The home
  navigation links to it without adding a runtime or external dependency.
- Claim allow/deny, accessibility and local-link proofs pass. The page states
  English-only and desktop Chrome/Edge scope, makes no malware-scanning or
  compromised-device guarantee, identifies external metadata limits and makes
  no uptime SLA claim.
- Seven focused trust/design tests, static production build, strict frontend
  typecheck/lint, diff hygiene and the initial-JS gate pass at 268,975 gzip
  bytes against the 307,200-byte bound. Exact-zero, privacy and security
  invariants are unchanged; architecture drift is none.

### 95. Phase 4 Task 4.2 — Collect / Never collect disclosure

- Task 4.2: **PASSED** on 2026-09-04. Added one concise Trust-page lifecycle
  component mapping every Section 30 row exactly once across Never collected,
  Processed for one request and Stored by design states.
- The disclosure distinguishes browser-only source/PII data, redacted request
  processing, private signing material, the anonymous two-field quota state,
  public verification keys and the persistent synthetic sample. It explicitly
  states that Aethelgard keeps no user, document, prompt, report or analysis-job
  history without making an absolute platform-metadata claim.
- Four focused claim/lifecycle tests, static production build, strict frontend
  typecheck/lint and diff hygiene pass. No source-upload wording, hidden AI
  processing, dependency, runtime behavior or architecture drift was introduced.

### 96. Phase 4 Task 4.3 — browser-local verifier

- Task 4.3: **PASSED** on 2026-09-04. Added the static `/verify` UI and a
  bounded local verifier using the exact version-1 manifest schema, published
  public keys, WebCrypto Ed25519 and the existing pinned `mldsa-native` Wasm.
  The result reports SHA-256, Ed25519 and ML-DSA-65 independently and is valid
  only when all three pass.
- The table-driven supported-browser matrix passes in desktop Chrome and Edge:
  valid sample, changed PDF, changed manifest digest, each changed signature,
  changed keys and malformed manifest all produce the exact expected result.
  Verification performs zero network requests and zero storage writes.
- Ten focused verifier/manifest/sample/trust tests, static production build,
  strict frontend typecheck/lint, diff hygiene and the initial-JS gate pass at
  268,883 gzip bytes. No private key, upload, persistence, dependency,
  partial-success validity or architecture drift was introduced.

### 97. Phase 4 Task 4.4 — independent CLI verifier

- Task 4.4: **PASSED** on 2026-09-04. Added the dependency-free Node CLI
  `npm run verify:report -- PDF MANIFEST KEYS`. It strictly bounds and parses
  all three inputs, derives and checks both public-key IDs, hashes the exact PDF
  bytes and independently verifies native Ed25519 and ML-DSA-65 signatures.
- Exit zero is possible only for the exact `S-VERIFICATION-RESULT` with all
  three booleans true. Changed PDF, malformed manifest, key mismatch and
  signature mutation return nonzero; failures expose only the fixed error.
- Six focused CLI/sample tests, including invocation from a disposable
  dependency-free directory, strict typecheck/lint, Doctor and diff hygiene
  pass. No network, private material, remote service, dependency, partial
  success or architecture drift was introduced.

### 98. Phase 4 Task 4.5 — public key publication

- Task 4.5: **PASSED** on 2026-09-04. Promoted the production and synthetic
  sample key records to strict version-1 retained-key documents with algorithm,
  derived identifier, public bytes and `current`/`retired` status. The existing
  reviewed production IDs remain `ed25519:1bb84280f5f88947bbcc33761c96e8ae`
  and `mldsa65:57ec85ded568caa2c382a85f64359777`.
- Added the static `/signing-keys.json` Trust-page link and concise owner-reviewed
  rotation procedure: retain old public keys as retired, never replace an ID,
  verify both runtimes before promotion and remain within 32,768 bytes and 16
  total keys. Both verifiers and the generator now consume the exact schema.
- Nine focused supply-chain/sample/CLI tests, Chrome/Edge browser-verifier
  matrix, static build, strict typecheck/lint and diff hygiene pass. Documents
  contain public material only; no secret, seed, dependency or architecture
  drift was introduced.
