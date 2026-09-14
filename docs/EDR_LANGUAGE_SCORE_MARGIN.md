# EDR 38: Task 1.10 normalized-score margin correction

Date: 2026-08-30

Status: **Superseded by EDR 39 on 2026-09-09**

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

## Historical binding consequence

Task 1.10 and Schema `S-LANGUAGE-DECISION` use `eng_score` and
`runner_up_score` terminology. `B-LANGUAGE-MARGIN` is 2,000 integer basis
points. Distance terminology was not valid for that superseded contract; these
requirements are no longer current after EDR 39.

## Supersession

Representative beta evidence later showed that valid ordinary English ranked
first with margins from 170 to 1,425 basis points. The score-gap rule treated
ranking/distance-derived heuristic values as calibrated confidence and caused
systematic false rejection. EDR 39 replaces this acceptance contract.
