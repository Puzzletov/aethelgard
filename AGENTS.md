# Agent guidance for Aethelgard

`ARCHITECTURE.md` 2.2 is the single source of truth. It is an owner-authorized
product-boundary reconciliation; runtime implementation remains paused until
the owner approves the reviewed PES. Protected `main` changes require human
review.

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
- Phase 3 Tasks 3.1–3.26 and its exit gate are complete and merged in PR #18.
- Architecture 2.1 Phases 0–3 and Tasks 4.1–4.11 are preserved completed
  evidence. Its former Task 4.12 is superseded before completion.
- The six-format, local-protection, Managed-Turnstile, one-call Groq golden
  spine is owner-verified. Architecture 2.2 implementation has not started.
- Remaining implementation begins with Task 5.1 only after explicit owner
  approval of the reconciled PES.

## Task protocol

Implement only the named task contract. Run its required tests and affected
regressions; fix ordinary defects; verify cost/privacy/security/storage/drift;
remove disposable artifacts; add concise `BUILD_LOG.md` evidence; create one
logical signed commit; then start the next authorized task. At a phase exit,
run the full gate, report PASS/BLOCKED, update the phase PR, and stop.

## Binding invariants

- Exact cost is GBP 0.00 and USD 0.00; quota exhaustion fails closed.
- Raw source, unredacted text and PII mappings never leave the browser.
- Persist no user/document/prompt/report/job data. The browser-private identity
  map exists only in ephemeral memory through local restoration and delivery.
- The public edge has zero secrets. Turnstile and AI stay inside the externally
  bound private `TrustedRuntime` Durable Object.
- Add no dispatcher, server parser, Google runtime, email, BYOK, Sentry,
  UptimeRobot, MCP, OCR, paid fallback or unapproved dependency.
- MVP AI is exactly one Groq request returning one strict cohesive finished
  analysis. The prompt performs challenge and synthesis internally; do not
  expose or make separate Strawman, Steelman, or Oracle calls.
- MVP output is the browser plus local Markdown/TXT. Browser Run, generated
  PDF, XLSX, charts and hybrid signing are preserved portfolio evidence, not
  active MVP release dependencies.
- Desktop Chrome and Edge are the supported parser runtimes.

Use strict TypeScript/Zod, approved local Python parsers, functions of at most
50 lines excluding fixed tables, named registry bounds, fixed failures, tests
with every code change, and warnings-as-errors. Do not use `eval`, `Function`,
Python `exec`, unchecked model output, unsafe HTML, secrets, production keys,
user files/results, logs or build artifacts in Git.

If no Architecture 2.2-compliant implementation can satisfy a binding
invariant, stop and report the exact task, invariant, evidence and
contradiction. Do not silently design another architecture.
