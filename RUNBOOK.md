# Aethelgard owner runbook

This runbook operates Architecture 2.1 at exactly GBP 0.00 and USD 0.00. It
never authorizes a paid fallback, automatic top-up, autonomous production
change or secret disclosure.

## Release checkpoint

Before any production mutation, the owner must confirm that the phase pull
request is reviewed, protected `main` contains the reviewed merge, required
checks are green, `git status --porcelain` is empty and exact-zero remains true.

Run the non-destructive gate:

```text
npm ci --ignore-scripts
npm --prefix frontend ci --ignore-scripts
npm run architecture:hash
npm run architecture:lint
npm run doctor
npm run zero-cost:check
npm run audit
npm test
npm run build
npm run verify:report -- frontend/public/sample/aethelgard-synthetic-sample.pdf frontend/public/sample/aethelgard-synthetic-sample.sig.json frontend/public/sample/aethelgard-synthetic-sample.signing-keys.json
```

The architecture hash must equal
`56fdc13dcde678c35dc8ad0ab67c28b9340d5095ed1a63999adde140c0c091c2`.
`S-ZERO-COST-RESULT` must report all four costs, paid fallbacks and automatic
top-ups as zero. Stop on any failure.

## Deploy and verify

Production promotion requires a separate explicit owner-reviewed checkpoint.
Deploy serially so the external Durable Object class exists before its binding:

```text
npx wrangler deploy --config workers/trusted-runtime/wrangler.toml
npx wrangler deploy
npm --prefix frontend run build
npx wrangler pages deployment create frontend/out --project-name aethelgard --branch main
```

Use synthetic data only. Verify `/health`, the live `/trust`, `/verify` and
`/sample` static routes, a fresh Turnstile challenge, one complete
Strawman → Steelman → Oracle analysis, Browser Run PDF output, exact PDF
digest, both signatures, CLI verification and changed-byte rejection. Confirm
the public Worker secret list is empty, the private Worker has exactly the five
approved secret names, and no application logging or legacy service appears.

## Provider configuration and incidents

Approved models are fixed in `src/contracts/ai-transport.ts`: Groq
`openai/gpt-oss-20b`, then `openrouter/free` only. Do not switch models or relax
ZDR/data-collection policy during an outage. Quota, policy, schema, timeout or
provider failure enters Safe Mode; wait for free capacity.

For a compromised Groq, OpenRouter or Turnstile credential:

1. Stop production promotion; revoke the credential at its provider.
2. Create a replacement without printing or committing it.
3. Enter it interactively with `npx wrangler secret put NAME --config
   workers/trusted-runtime/wrangler.toml`.
4. Confirm only secret names with `npx wrangler secret list --name
   aethelgard-trusted-runtime`; rerun Doctor and a synthetic live gate.

For signing-key compromise, stop signing, follow [KEY_ROTATION.md](KEY_ROTATION.md),
retain the old public entries as `retired`, and resume only after both verifiers
pass with the reviewed current keys. Never expose, download or log private seeds.

## Quota

Browser Run quota exhaustion and the public rate limit fail closed. Do not buy
capacity, reset accounting state to restore availability or enable a paid route.
The only Durable Object state permitted is the UTC date and aggregate Browser
Run milliseconds. Confirm recovery with `npm run zero-cost:check`; availability
may resume only when free quota legitimately resets.

## Rollback

Record the current version IDs with `npx wrangler versions list --name NAME
--json` before promotion. If a live gate fails, stop traffic-producing tests and
rollback in reverse dependency order:

```text
npx wrangler rollback PUBLIC_VERSION --name aethelgard
npx wrangler rollback PRIVATE_VERSION --name aethelgard-trusted-runtime
```

Restore the prior Pages deployment in the Cloudflare Pages deployment view; do
not create a second host. Re-run health, topology, synthetic signing, privacy and
exact-zero gates. Record only version IDs and fixed results, never secrets or
user content. A rollback does not authorize bypassing the protected-main fix.

## Disaster recovery

Follow [RECOVERY.md](RECOVERY.md) on a clean machine. Its deterministic runner
must finish within 1,800,000 ms and emit `S-RECOVERY-RESULT` with every boolean
true. It needs no production credentials. After repository recovery, production
restoration still requires the release checkpoint above.

If raw source bytes ever leave the browser, stop deployment and reopen the
malware-scanning EDR before any release. If an incident cannot be handled within
these procedures without weakening privacy, security or exact-zero, keep the
service in Safe Mode and request an owner decision.
