# EDR 40: Turnstile Siteverify timeout correction

Date: 2026-09-10

Status: **Owner approved and incorporated into Architecture 2.1**

## Decision

Use exactly one 10,000 ms Siteverify attempt. Do not retry a Turnstile token.
Continue to fail closed and require successful verification, the exact
`analyze` action and an exact approved hostname before any AI, Browser Run,
report-generation or signing work.

## Reason

The previous 5,000 ms Siteverify timeout was demonstrated in the deployed beta
to abort a legitimate Managed Turnstile validation request at approximately
5,001 ms. Cloudflare's current canonical Worker implementation uses a
10,000 ms Siteverify timeout. The timeout was therefore corrected to 10,000 ms
while retaining one attempt and fail-closed validation.

## Preserved properties

- Server-side Siteverify remains mandatory inside private `TrustedRuntime`.
- The public edge remains secret-free.
- Tokens remain single-use and the client resets after an analysis attempt.
- Exact action, production/beta hostname, CORS and origin validation remain.
- `remoteip` remains omitted.
- Privacy, provider, persistence, signing and exact-zero behavior are unchanged.
