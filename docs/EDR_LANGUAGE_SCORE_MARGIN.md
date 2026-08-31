# EDR 38: Task 1.10 normalized-score margin correction

Date: 2026-08-30

Status: **Owner approved and incorporated into Architecture 2.1**

## Decision

Use the normalized scores returned by pinned offline `francAll`. Define the
English lead as integer basis points:

`round((eng_score - runner_up_score) * 10,000)`

Accept only when `eng` ranks first and this margin is at least 2,000. Every
other result fails closed locally under the existing language gate.

## Reason

`franc-min` returns normalized scores, not integer distances. The previous
distance terminology, reversed subtraction, integer schema, and threshold of
20 were mutually incompatible and could not accept any English input. Basis
points preserve the intended 20-percentage-point lead without floating output.

## Preserved properties

- English-only source support and the frozen evidence thresholds.
- Local-only classification before redaction and network egress.
- Failure for non-English, mixed, uncertain, tied, or insufficient evidence.
- Existing runtime topology, privacy boundary, exact-zero policy, providers,
  cryptography, persistence rules, and phase sequence.

## Binding consequence

Task 1.10 and Schema `S-LANGUAGE-DECISION` use `eng_score` and
`runner_up_score` terminology. `B-LANGUAGE-MARGIN` is 2,000 integer basis
points. Distance terminology is not valid for this contract.
