# Clean-machine recovery

Prerequisites are Git and Node.js 24.13.1 on a supported Chrome/Edge desktop.
No production secret, personal package cache or Cloudflare login is required.

From a clean environment:

1. Clone `https://github.com/Puzzletov/aethelgard.git` and check out the reviewed
   release commit.
2. Run `npm ci --ignore-scripts --no-audit --no-fund` in the repository and
   frontend package using an empty npm user configuration and disposable cache.
3. Run `npm run architecture:hash`, `npm run doctor`, `npm test`, and
   `npm run build`. The build performs both Worker deployment dry-runs and the
   static Pages build without production mutation.
4. Run the static-sample and independent changed-byte signature proofs.
5. Exercise `npm run keys:generate -- --disposable --public-output <new-file>`;
   inspect only the generated public-key record, then delete it.
6. Require `git status --porcelain` to be empty.

`node scripts/verify-clean-recovery.mjs` performs this exact procedure against a
disposable remote clone of protected `main`, emits `S-RECOVERY-RESULT`, and
removes all temporary checkout, cache, configuration and key files afterward.
Before merge, reviewers can verify an exact release branch with
`node scripts/verify-clean-recovery.mjs --ref phase/4-trust-portfolio`.
