# EDR: browser-local document trust boundary

Date: 2026-08-27

Status: **Owner approved - pending incorporation into an approved architecture revision**

This decision record does not change `ARCHITECTURE.md` by itself. It records
the owner's security decision for the later proposed `ARCHITECTURE.md` v2.x
revision.

## Decision

Remove ClamAV from the browser-local target architecture because Aethelgard
will no longer accept or parse a source binary on its trusted backend. This is
not a claim that another control provides equivalent known-malware signature
detection.

Keep hostile-content validation and browser processing isolated in a
disposable module Web Worker as mandatory architecture invariants and
regression tests. A Web Worker is useful isolation inside the browser. It is
not a separate formal security sandbox from the browser engine.

## Old trust boundary

```text
potentially hostile source binary
-> Aethelgard backend
-> server parser
-> ClamAV known-signature scan as a secondary defence
```

The backend receives the raw binary. A malformed file can attack the server
parser. The system can accidentally forward or retain a malicious binary.
ClamAV can detect some known malware signatures, but it cannot prove a parser
is safe and does not reliably stop an unknown parser exploit.

## Approved trust boundary

```text
potentially hostile source binary
-> user's browser
-> strict content and archive validation
-> disposable parser module Web Worker
-> local PII redaction
-> typed redacted text only
-> Aethelgard Worker backend
```

The source binary never crosses the network boundary. It never enters an
Aethelgard server parser, AI request, email request, or storage service.

## Property lost

The approved design loses known-malware signature matching on the user's
source binary. A plain-text malware test string remains plain, non-executable
text. The design does not replace known-malware signature detection with an
equivalent scanner.

## Binding malware-scan invariant

Aethelgard must not claim that source files are malware-scanned. If any future
architecture sends source binary bytes to a server, AI provider, email
provider, or storage service, this EDR is automatically reopened and
malware-scanning requirements must be reconsidered before deployment.

## Attack surfaces removed

- Raw binary upload to an Aethelgard backend.
- Server-side parsing of an attacker-controlled binary or archive.
- Hosted-malware forwarding from the backend.
- Backend temporary-file cleanup failure.
- Raw source content reaching an AI or email provider.
- A server parser exploit exposing other in-flight requests in the same
  backend runtime.

## Attack surfaces that remain

- A defect in a browser parser or Pyodide package.
- A browser-engine or WebAssembly defect.
- Resource exhaustion on the user's device.
- A detection miss that leaves PII in extracted text.
- A future code change that accidentally uploads bytes before redaction.

## Mandatory architecture invariants and regression tests

1. Validate real magic, size, word count, archive entry count, expansion size,
   compression ratio, paths, encryption, XML entities, external relationships,
   macros, ActiveX, OLE, and embedded content before normal parsing.
2. Parse only inside a disposable module Web Worker.
3. Terminate the Web Worker on success, timeout, allocation failure, or crash.
4. Show labelled Safe Mode on local failure.
5. Use no localStorage, IndexedDB, Cache Storage, OPFS, or service-worker cache
   for source bytes, extracted text, or results.
6. Prove in tests that the first network request contains only typed redacted
   source records.
7. Keep the hostile-file and PII corpora frozen. Add regressions; do not replace
   old failures.
8. Reopen this decision under the binding malware-scan invariant above.

These controls must be present in the proposed architecture before this EDR
can be incorporated. They must remain release-gating regression tests after
implementation begins.

## Evidence

Phase -1C rejected the tested macro, ActiveX, OLE, embedded object, external
relationship, XML entity, malformed file, false magic, encrypted input, path
traversal, and ZIP bomb cases. It terminated a looping parser and recovered
with a fresh Web Worker.

Phase -1D preserved the privacy boundary across 576 labelled synthetic PII
entities and passed Safe Mode tests in modern Chrome and Edge.

See [`PHASE_MINUS_1C_FEASIBILITY.md`](PHASE_MINUS_1C_FEASIBILITY.md) and
[`PHASE_MINUS_1D_CLOSURE.md`](PHASE_MINUS_1D_CLOSURE.md).

## Strawman and steelman

Strawman: removing ClamAV removes a real security control and can look like a
cost-driven downgrade.

Steelman: ClamAV was a secondary control behind a server parser. Moving the
untrusted binary out of the trusted backend removes the attack path that made
that secondary control useful. Keeping an antivirus only to preserve a named
tool adds code, signatures, updates, and failure modes without restoring the
old trust boundary.

## Owner decision

- Decision: **Approved with the precise Web Worker wording and binding
  malware-scan invariant above.**
- Date: **2026-08-27**
- Scope: decision record only; no production or implementation approval.
