# EDR 39: Task 1.10 English-first correction

Date: 2026-09-09

Status: **Owner approved and incorporated into Architecture 2.1**

## Decision

After the existing minimum evidence checks, run pinned browser-local
`francAll` and accept only when its first valid ranked language is `eng`.
Another valid language fails as non-English. `und`, insufficient evidence and
malformed detector results fail closed. Score differences are not acceptance
criteria.

## Reason

The previous `francAll` score-gap rule incorrectly treated ranking scores as
calibrated confidence and systematically rejected representative English
documents. Observed clear-English margins ranged from 170 to 1,425 basis
points even though English ranked first. Lowering the threshold would not turn
that heuristic into calibrated confidence.

## Five Whys

1. The user entered Safe Mode because the language gate rejected the document.
2. The gate rejected because the English score lead was below 2,000 basis points.
3. The lead was small because franc scores were treated as calibrated confidence.
4. Tests passed because their English fixtures had unusually large separation.
5. Release proof validated selected examples instead of a representative acceptance corpus.

The permanent process correction is the representative corpus.

## Preserved properties

- English-only source support and existing minimum evidence bounds.
- Local-only classification before redaction and network egress.
- Fail-closed handling for non-English, insufficient and malformed results.
- Runtime topology, privacy, security, exact-zero, providers, cryptography,
  persistence rules and phase sequence.
