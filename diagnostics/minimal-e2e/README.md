# Minimal Aethelgard E2E diagnostic

This disposable slice proves only `TXT -> local redaction -> test Siteverify ->
one real Groq call -> safe browser rendering`. It does not replace Architecture
2.1 and must never be promoted to production.

The public edge has no secrets. The private `MinimalRuntime` requires three
ephemeral bindings: `TURNSTILE_TEST_SECRET`, `GROQ_API_KEY`, and a disposable
`PROBE_NONCE`. The first is Cloudflare's official test secret; the second must
be entered by the owner because deployed Worker secrets are intentionally
non-exportable; the third protects the short-lived direct Groq probe.

Generated `dist/` files and both diagnostic Workers are removed after the
proof. The Pages preview branch is `golden-path` in the existing `aethelgard`
project. Production Pages, beta, the public Worker, and the production
TrustedRuntime are not modified by this diagnostic.
