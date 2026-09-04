# Agent guidance for Aethelgard

`ARCHITECTURE.md` 2.1 is the single source of truth. Architecture research is
closed. Protected `main` changes require human review.

## Efficient context protocol

At the start of a fresh phase/model session:

1. run `npm run architecture:hash` and compare it with `BUILD_LOG.md`;
2. understand the complete architecture once if it is not already available to
   that session;
3. run `npm run task:context -- N.x` for the current task.

While the hash is unchanged, do not reread the whole architecture. Load only
the current task capsule, referenced registry entries, and relevant code/tests.
After interruption, recover from branch, `git status --short`, diff, current
task and its capsule. Do not reconstruct history from old chats, shell history,
deleted research, or unreachable Git objects. Never debug an unsupported
runtime beyond proving the failure is runtime-specific.

## Current authority

- Phase 0 is complete and merged.
- Phase 1 Tasks 1.1–1.22 and its exit gate are complete and merged in PR #11.
- Phase 2 Tasks 2.1–2.14 and its exit gate are complete and merged in PR #16.
- Phase 3 is owner-authorized on `phase/3-hardening`, one task at a time.
- Tasks 3.1–3.22 are passed; Task 3.23 is the next implementation task.
- Phase 4 implementation is not authorized.

## Task protocol

Implement only the named task contract. Run its required tests and affected
regressions; fix ordinary defects; verify cost/privacy/security/storage/drift;
remove disposable artifacts; add concise `BUILD_LOG.md` evidence; create one
logical signed commit; then start the next authorized task. At a phase exit,
run the full gate, report PASS/BLOCKED, update the phase PR, and stop.

## Binding invariants

- Exact cost is GBP 0.00 and USD 0.00; quota exhaustion fails closed.
- Raw source, unredacted text and PII mappings never leave the browser.
- Persist no user/document/prompt/report/job data. Only the UTC date and
  aggregate Browser Run milliseconds may persist in `TrustedRuntime`.
- The public edge has zero secrets. Turnstile, AI, Browser Run and signing stay
  inside the externally bound private `TrustedRuntime` Durable Object.
- Add no dispatcher, server parser, Google runtime, email, BYOK, Sentry,
  UptimeRobot, MCP, OCR, paid fallback or unapproved dependency.
- AI is exactly Strawman → Steelman → Oracle.
- Every final PDF is signed over exact bytes with SHA-256, Ed25519 and
  ML-DSA-65; expose no generic signer.
- Desktop Chrome and Edge are the supported parser runtimes.

Use strict TypeScript/Zod, approved local Python parsers, functions of at most
50 lines excluding fixed tables, named registry bounds, fixed failures, tests
with every code change, and warnings-as-errors. Do not use `eval`, `Function`,
Python `exec`, unchecked model output, unsafe HTML, secrets, production keys,
user files/results, logs or build artifacts in Git.

If no Architecture 2.1-compliant implementation can satisfy a binding
invariant, stop and report the exact task, invariant, evidence and
contradiction. Do not silently design another architecture.
