# Agent guidance for Aethelgard

`ARCHITECTURE.md` version 2.1 is the single source of truth. Read it in full
before any change. Follow its constraints, task order, coding standard, and
phase gates exactly.

## Current authority

- Architecture research is closed.
- Complete the Architecture 2.1 preparation gate before Phase 0 work.
- After the preparation pull request merges to protected `main`, Phase 0 is
  authorized one task at a time.
- Phase 1 and all later phases are not authorized.
- Human review is required before any change reaches protected `main`.

## Task protocol

1. Work on one named task in the active phase.
2. Inspect only the relevant architecture and current code.
3. Add no future-phase scaffold, unused dependency, or unrelated feature.
4. Run the smallest relevant tests and affected regressions.
5. Fix normal implementation defects within Architecture 2.1 and retest.
6. Check cost, privacy, security, storage, and architecture drift.
7. Remove disposable artifacts.
8. Add concise evidence to `BUILD_LOG.md`.
9. Create one logical signed commit.
10. Start the next task only after the current task passes.

At a phase exit, run the complete phase gate, open or update the phase pull
request, and stop. Do not start the next phase without owner approval.

## Binding architecture rules

- Exact cost is GBP 0.00 and USD 0.00. No paid path or automatic top-up.
- Raw source files, unredacted text, and PII mappings never leave the browser.
- Persist no user, document, prompt, report, email, or job data.
- The only application state is the UTC date and aggregate Browser Run
  milliseconds in `TrustedRuntime`.
- The public edge Worker has zero secrets.
- Turnstile Siteverify, AI secrets, Browser Run, and signing stay inside the
  external `TrustedRuntime` Durable Object boundary.
- Add no Service Binding dispatcher, server parser, Google runtime, email,
  BYOK, Sentry, UptimeRobot, MCP, OCR, or paid fallback.
- Normal AI analysis uses exactly Strawman, Steelman, and Oracle.
- Every final PDF is signed over its exact final bytes with SHA-256, Ed25519,
  and ML-DSA-65. Expose no generic signing input or route.
- Fail closed when a security, privacy, quota, schema, or signing gate fails.

## Code and dependencies

- Use strict TypeScript and Zod for runtime schemas.
- Browser Python is local-only and uses the approved direct parser stack.
- Functions are at most 50 lines, excluding fixed data tables.
- Bound every input, retry, loop, allocation, queue, timeout, and output.
- Do not use `eval`, `Function`, Python `exec`, unsafe model HTML, or unchecked
  model output.
- Add tests with every code change. Warnings fail.
- Before adding a dependency, add and approve its Architecture Section 29
  register entry. Cryptographic or native code also needs an audit note.
- Use clear Simplified Technical English. HTML uses `lang="en"`.

## Repository controls

- Preserve the approved browser-local EDR and frozen security/PII fixtures.
- Keep the build log concise; Git history is the detailed archive.
- Never rewrite protected `main` or weaken branch protection.
- Do not disable signed commits.
- Do not write secrets, production keys, user files, results, logs, or build
  artifacts to the repository.

If implementation proves that no Architecture 2.1-compliant solution can
satisfy a binding invariant, stop and report the exact task, invariant,
evidence, and contradiction. Do not implement a different architecture.
