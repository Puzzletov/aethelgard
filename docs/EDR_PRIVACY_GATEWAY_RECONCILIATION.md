# EDR 42 — Privacy gateway and local identity restoration

**Status:** Active  
**Date:** 2026-09-18  
**Decision authority:** Owner-approved Architecture 2.2 reconciliation

## Context

The owner-verified beta proved the smallest dependable spine: six browser-local
parsers, local PII protection, real Managed Turnstile, a secret-free edge, a
private TrustedRuntime, one Groq call, strict response validation and browser
rendering. Architecture 2.1 still treated Browser Run PDF, charts, XLSX output
and hybrid signing as release requirements. Those components were proven, but
they obscured the core product and kept the browser-private identity map from
supporting a useful restored deliverable.

## Decision

Aethelgard is a privacy gateway for AI document processing.

The browser retains the identity map only in ephemeral memory through response
validation, exact local restoration and delivery. The default output restores
known tokens locally; an explicit protected mode keeps pseudonyms. Unknown
reserved tokens fail closed. Restoration never uses AI, a server, fuzzy
matching or a second provider call.

One Groq call returns one strict professional canonical report. The MVP renders
that report in the browser and provides browser-local Markdown and TXT. PDF,
DOCX, PPTX and LaTeX may be considered later one renderer at a time.

Browser Run, generated PDF, charts, XLSX output, SHA-256, Ed25519, ML-DSA-65,
detached manifests and verifier UX are preserved as portfolio and regression
evidence, but they are not MVP release dependencies.

## Consequences

The raw file, filename, unredacted text, identity map and restored result remain
browser-only. Persistent user-derived application state remains zero. The
public edge remains secret-free, Turnstile and Groq remain private, the active
AI path remains one exact-zero Groq call, and the proven golden heartbeat is a
regression gate for every later layer.

The former Architecture 2.1 Task 4.12 is superseded before completion. Remaining
work is the privacy result lifecycle, canonical report, Markdown/TXT delivery
and an owner-reviewed canonical MVP release.

## Rejected alternatives

* Return pseudonyms to users without restoration: less useful and does not use
  the browser-private map's legitimate purpose.
* Restore on the server or with AI: expands the privacy boundary and adds a call.
* Keep the entire old output/signing pipeline mandatory: proven but unnecessary
  for the smallest useful MVP.
* Delete completed heavy-output work: destroys valuable engineering evidence.
