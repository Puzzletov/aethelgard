# EDR 37: Architecture 2.1 execution hardening

Date: 2026-08-29

Status: **Owner approved and incorporated into Architecture 2.1**

## Decision

Keep Architecture 2.1 and its runtime topology unchanged. Add canonical task
contracts for Tasks 1.1–4.12, separate phase exit gates, and central Bounds,
Schema, and Failure registries. Add deterministic lint, task-context extraction,
and exact Git-blob hash commands using Node standard library and Git.

The lockfiles remain authoritative for exact compatible npm versions.
Cryptographic and browser binary assets retain explicit version/commit/hash
manifests. Live phase authorization belongs in `BUILD_LOG.md` and `AGENTS.md`,
not immutable architecture prose.

## Reason

The approved product architecture was complete but later-phase lists required
an implementation model to infer limits, schemas, failures and PASS criteria.
That repeated inference consumed context and could create drift. One canonical
definition per task/property makes a smaller implementation model a replaceable
technician without creating another runtime or governance product.

## Preserved properties

- Runtime topology and providers.
- Browser-local source/privacy boundary and approved malware decision.
- Exact GBP/USD 0.00 policy and fail-closed quota behavior.
- Exactly Strawman, Steelman and Oracle.
- Browser Run exact-PDF generation.
- SHA-256, Ed25519 and pinned ML-DSA-65 exact-byte signing.
- Desktop Chrome/Edge and English-only scope.
- No persistence beyond anonymous Browser Run date/aggregate milliseconds.

## Rejected alternatives

- A second machine-readable architecture source: it would duplicate authority.
- Runtime dependencies for documentation tooling: Node standard library and Git
  are sufficient.
- Reopening provider/topology/research decisions: no contradiction was found.
- Keeping ambiguous task lists: smaller models would still need to design while
  implementing.

## Binding consequence

`ARCHITECTURE.md` remains the only normative source. Tooling extracts task
capsules from that document and must not maintain duplicate rules. New tasks,
bounds, schemas or failures require the normal owner-approved architecture/EDR
process. The revision is specification hardening, not Architecture 3.0.
