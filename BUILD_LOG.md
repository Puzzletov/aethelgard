# Aethelgard Build Log

Concise engineering status and evidence record. Git history contains detailed
historical work.

## Current State

- Architecture: **2.1 — APPROVED FOR BUILD**. Protected `main` receives this
  authority when the preparation pull request is reviewed and merged.
- Phase -1: **CLOSED**.
- Preparation gate: **PASSED — MERGED** in PR #3 on 2026-08-28.
- Current implementation phase: **PHASE 0** on `phase/0-foundation`.
- Phase 0 status: **IN PROGRESS — TASK 0.1 PASSED**.
- Exact-zero account gate: **PASSED** on 2026-08-27.
- Browser-local trust-boundary EDR: **APPROVED**.
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
- Authoritative `ARCHITECTURE.md` SHA-256:
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
