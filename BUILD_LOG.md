# Build Log

Technical record of setup, build work, checks, and phase-gate audits for Aethelgard.

## 2026-08-25

### 1. Phase -1 Task 2 Cloudflare verification

- The owner confirmed in the Cloudflare dashboard that the Workers Free plan remains selected.
- Used the authenticated Wrangler CLI to read the Turnstile widget configuration without reading or displaying the secret key.
- Verified widget `Aethelgard Protection` is in Managed mode.
- Verified its authorized hostnames are exactly `aethelgard-3j9.pages.dev` and `localhost`.
- Verified pre-clearance is disabled (`no_clearance`).
- Verified the widget was changed through the Cloudflare dashboard on 2026-08-25.
- Used the authenticated Wrangler CLI to verify that Worker `aethelgard` has an active deployment.
- Confirmed `https://aethelgard-3j9.pages.dev/` returns HTTP 200.
- Confirmed `https://aethelgard.justbwas.workers.dev/` returns HTTP 200.
- Kept the existing free `pages.dev` and `workers.dev` hostnames; no custom domain or zone-only WAF control was added.

Phase -1 Task 2 result: **complete**.

Phase -1 remains incomplete because Tasks 3 through 8 and the configuration-record blockers below still require resolution.

### 2. Pull request 2 security and history remediation

- Converted pull request 2 to draft before changing its history.
- Confirmed that GitGuardian found a generated Next.js key inside `frontend/.next/server/server-reference-manifest.json` in old commit `b818750`. The value was not read or displayed.
- Created local recovery branch `backup/pr-2-pre-cleanup-20260825` at the old pull-request tip. The recovery branch was not pushed.
- Rebuilt the pull-request branch from current `origin/main` as focused, signed commits.
- Removed the duplicate Worker commit already squash-merged by pull request 1.
- Removed every `.next`, `__pycache__`, and `.pyc` artifact from the rewritten pull-request history.
- Added `noindex`, `nofollow`, and `noarchive` metadata and a `robots.txt` file that disallows `/`.
- Removed the invalid `next start` command from the static-export frontend.
- Made `.dev.vars.example` trackable and added the required `.env.example`. Every committed assignment in both templates is empty.
- Added regression tests for search-index blocking, static-export scripts, and empty secret templates.
- Ran the frontend tests: 4 passed, 0 failed.
- Ran the frontend production build and static export: passed.
- Ran the root TypeScript check and backend Python syntax check: passed.
- Verified the generated `index.html` contains `noindex, nofollow, noarchive` and the generated `robots.txt` contains `Disallow: /`.
- Updated pull request 2 with `--force-with-lease` only after confirming its old remote tip was still `9010ced`.
- Verified pull request 2 is conflict-free and contains only the focused commits listed in its rewritten history. GitGuardian, both CodeQL checks, and Workers Builds pass.
- Kept pull request 2 in draft. Phase -1 is incomplete, so the pull request must not merge yet.

### 3. Phase -1 Task 3 Google Cloud audit

- Installed the official Google Cloud SDK 581.0.0 after owner approval.
- Authenticated the Google Cloud CLI with a user account that can access the project. No service-account private key was read or downloaded.
- Found that `aethelgard-prod` is the display name, not the project ID. The active project ID is `aethelgard-prod-504515`.
- Corrected the GitHub secret `GCP_PROJECT_ID` to `aethelgard-prod-504515` and verified its update timestamp. No secret value was displayed.
- Verified the project is active and billing is linked and enabled.
- Verified `run.googleapis.com` and `secretmanager.googleapis.com` are enabled.
- Could not query the budget because `billingbudgets.googleapis.com` is disabled. Did not enable an extra API only for this audit.
- Verified the deployment service account is `github-actions-deployer@aethelgard-prod-504515.iam.gserviceaccount.com` and is enabled.
- Verified its project roles are `roles/run.admin`, `roles/iam.serviceAccountUser`, and `roles/secretmanager.secretAccessor`.
- Verified one enabled user-managed key exists. Verified the GitHub secret name `GCP_SA_KEY` exists, but GitHub does not allow its value to be read back, so the key match is not independently proven.
- Verified no Workload Identity Federation pool exists.
- Did not add `roles/secretmanager.admin`, remove `roles/iam.serviceAccountUser`, or delete the existing key. The current Task 3 role and JSON-key instructions conflict with least-privilege Cloud Run deployment and keyless CI guidance, so an owner-approved architecture revision is required first.

Phase -1 Task 3 result: **not complete**. Billing, APIs, project identity, service-account identity, and current IAM are verified. Budget confirmation and the CI identity architecture decision remain open.

### 4. Approved Phase -1 Task 3 keyless identity revision

- The owner approved replacing the JSON service-account key design with GitHub OIDC and Google Cloud Workload Identity Federation.
- Revised `ARCHITECTURE.md` to record Engineering Decision 17 and the exact Task 3 least-privilege design. This revision also moves runtime provider keys and the Sentry DSN from GitHub Actions secrets to Google Secret Manager.
- Verified the active project ID is `aethelgard-prod-504515` and the project number is `922415089317`.
- Verified the Cloud Run and Secret Manager APIs remain enabled. Enabled and then verified the IAM, IAM Service Account Credentials, and Security Token Service APIs required for federation.
- Kept `github-actions-deployer@aethelgard-prod-504515.iam.gserviceaccount.com` as the deployment identity.
- Created `aethelgard-runtime@aethelgard-prod-504515.iam.gserviceaccount.com` as the separate Cloud Run runtime identity.
- Created Workload Identity pool `github-actions` and GitHub OIDC provider `aethelgard`.
- Restricted provider admission to immutable GitHub owner ID `131607539`, immutable repository ID `1322880852`, and `refs/heads/main`.
- Granted `roles/iam.workloadIdentityUser` on the deployer service account only to the repository-ID principal set for repository ID `1322880852`.
- Verified the deployer has only `roles/run.admin` at project level.
- Removed project-level `roles/iam.serviceAccountUser` from the deployer. Granted it only on the `aethelgard-runtime` service-account resource.
- Removed project-level `roles/secretmanager.secretAccessor` from the deployer. The deployer has no Secret Manager role.
- Created empty Secret Manager containers named `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `RESEND_API_KEY`, `SENTRY_DSN`, and `EDGE_GATEWAY_SECRET`. No secret value was read, copied, or added, and each container has zero versions.
- Granted `roles/secretmanager.secretAccessor` to `aethelgard-runtime` separately on each of those five secrets. The runtime identity has no project-level IAM role.
- Added GitHub Actions variables `GCP_PROJECT_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, and `GCP_SERVICE_ACCOUNT`. These contain identifiers, not credentials.
- Temporarily allowed `chore/bootstrap-worker` in the provider only while running the proof workflow. The temporary workflow used minimum GitHub permissions and official actions pinned to immutable commits.
- GitHub Actions run [32886633686](https://github.com/Puzzletov/aethelgard/actions/runs/32886633686) completed successfully from commit `e1195827ae93b059b8a424618622673ebd5fba7f`. It proved OIDC exchange and a read-only Cloud Run API call without a stored key.
- Immediately removed the temporary feature-branch exception. Re-verified that the provider now accepts only `refs/heads/main` for the immutable owner and repository IDs above.
- Deleted the deployer's only user-managed Google service-account key. Re-verified that the deployer has zero user-managed keys.
- Deleted GitHub secrets `GCP_SA_KEY` and the redundant secret-form `GCP_PROJECT_ID`. Re-verified that neither secret name remains and that the three non-secret variables remain.
- Removed the temporary smoke-test workflow from the final worktree after the successful proof.
- Updated draft pull request 2 so reviewers can see the keyless identity design, least-privilege scopes, retired key, proof run, and passing validation.

This section supersedes the Google Cloud IAM and CI-identity state recorded earlier on 2026-08-25.

Phase -1 Task 3 result: **not complete**. The keyless identity architecture and all IAM work are complete and verified. The only Task 3 blocker is independent confirmation that the documented `Aethelgard Prod Budget` still has a monthly limit of `$1.00` and alert thresholds at 50%, 90%, and 100%. The Billing Budgets API remains disabled, so this must be confirmed in Billing → Budgets & alerts or through an explicitly approved temporary API audit.

## 2026-08-24

### 1. Cloudflare Pages frontend deployment

- Configured the Next.js frontend to make a static export for Cloudflare Pages.
- Added a test for the static export setting.
- Added the generated `frontend/out/` directory to `.gitignore`.
- Ran `npm test` in `frontend/`; 1 test passed.
- Ran `npm run build` in `frontend/`; the production build and static export passed.
- Created the Cloudflare Pages project `aethelgard` with `main` as its production branch.
- Deployed the static frontend to `https://aethelgard-3j9.pages.dev/`.
- Recorded deployment URL `https://f721c0c7.aethelgard-3j9.pages.dev/`.
- Confirmed that the public URL returned HTTP 200 and contained the expected title and heading.
- The deployment source was an uncommitted worktree on `chore/bootstrap-worker`.
- No pull request exists for these local changes. This deployment is not yet review-complete.

### 2. Phase-gate audit and correction

Audit scope:

- Read `AGENTS.md` and the full approved `ARCHITECTURE.md` again.
- Compared all Phase -1 and Phase 0 tasks with repository files, Git history, the public GitHub API, and the live public endpoints.
- Did not inspect secret values.

Confirmed evidence:

- The GitHub repository is public and uses `main` as its default branch.
- The active `main` ruleset requires pull requests, linear history, and signed commits.
- Verified through the public GitHub API that the active ruleset requires `Analyze (javascript-typescript)` from GitHub Actions.
- Verified that the required-status-check policy is strict, so a branch must be up to date before merge.
- GitHub reports active managed Dependabot Updates and CodeQL workflows.
- The public `main` branch contains only `README.md`.
- No pull request is open.
- The Cloudflare Pages frontend returns HTTP 200 at `https://aethelgard-3j9.pages.dev/`.
- The Cloudflare Worker returns HTTP 200 at `https://aethelgard.justbwas.workers.dev/health`.
- The local frontend test passes: 1 test, 0 failures.
- The local frontend production build and static export pass.
- The root TypeScript check passes.
- The FastAPI source passes a Python syntax check.

Phase -1 result: **not complete**. The earlier completion statement in this log is not a valid phase-gate result.

Phase -1 Task 1 result: **complete**. GitHub branch protection now meets the required passing-status-check rule.

Phase -1 Task 2 result: **complete**. The production Turnstile hostname, Workers Free selection, deployed Worker gateway, and public endpoints are verified.

Phase -1 remaining blockers:

1. Phase -1 Task 3 requires a human architecture decision between its long-lived JSON key instructions and the recommended keyless Workload Identity Federation design. Its documented role pair also omits the Cloud Run service-identity permission and requests broader Secret Manager access than the deployer needs.
2. The `$1.00` Google Cloud budget is documented but not independently verified. The Billing Budgets API is disabled, and this audit did not enable an extra API.
3. The GitHub secret `GCP_SA_KEY` exists, and one enabled user-managed Google Cloud key exists, but the secret value cannot be read back to prove that they match.
4. Groq, OpenRouter, Resend, and Sentry setup is documented but not independently verified in this audit.
5. No UptimeRobot account setup is documented.
6. The Ed25519 and ML-DSA-65 keypairs from Phase -1 Task 7 do not exist in the repository record. The generic `ENCRYPTION_KEY` does not satisfy this task.
7. Phase -1 Task 7 depends on a key-generation script assigned to Phase 5. This is a phase-order conflict that needs a human decision.
8. The empty `.env.example` and `.dev.vars.example` files are now tracked, but Phase -1 Task 7 does not define exact secret-slot names for its two private keys. The purpose of the earlier `ENCRYPTION_KEY` remains undefined, and it does not satisfy Task 7.

Phase 0 result: **not complete**.

Phase 0 task status:

1. Frontend: implemented and live, but not review-complete. Its latest source is in draft pull request 2 and is not on `main`.
2. Backend: a local FastAPI `/health` route exists. No container file, Cloud Run deployment configuration, or Cloud Run URL exists. The Worker endpoint is not the required FastAPI backend.
3. CI/CD: no repository workflow deploys the frontend, edge gateway, and backend from a push to `main`.
4. Index blocking: partial. Draft pull request 2 adds the required frontend robots metadata and `robots.txt`, but the production Pages deployment has not been updated and verified. The required `X-Robots-Tag` response header is also not implemented.
5. Tests: partial. Four frontend configuration and security tests pass. No backend unit test exists, and no project test runs in CI.
6. UptimeRobot: no monitor is documented, and the required Cloud Run `/health` URL does not exist.

Phase 0 exit-test result:

- The frontend is live.
- The required Cloud Run `/health` endpoint is not live.
- A push to `main` does not deploy all three parts.
- The Phase 0 exit test fails.

Gate decision:

- Do not start or continue Phase 0 work until the Phase -1 blockers are resolved or the repository owner gives an explicit architecture decision.
- Do not start Phase 1 or any later phase.

### 3. Approved `pages.dev` edge-control revision

- The owner confirmed that no custom domain is available.
- The owner chose to keep the free `aethelgard-3j9.pages.dev` hostname.
- The owner approved an architecture revision instead of buying a domain and breaking the $0.00 constraint.
- Verified from Cloudflare documentation that Workers provide a stable Rate Limiting binding and that the Workers Free plan has a 100,000-request daily platform ceiling.
- Revised the architecture to use the existing `aethelgard.justbwas.workers.dev` Worker as the edge gateway.
- Replaced the zone-only Bot Fight Mode and WAF rate-limit requirement with Turnstile, the Workers Rate Limiting binding, an API route allow-list, `EDGE_GATEWAY_SECRET`, and a backend request ceiling.
- Set the edge upload limit to 5 `POST /analyze` attempts per source IP per Cloudflare location per 60 seconds.
- Added Engineering Decision Record entry 16.
- Updated Phase -1 Task 2, the Phase 0 skeleton, the Phase 1 controls, and the Phase 0 exit test to match the approved three-part deployment.
- Added no dependency.
- Changed no application code, CI configuration, or external Cloudflare setting.
- Phase -1 Task 2 was completed and independently verified on 2026-08-25.

## 2026-08-04

### 0. Phase 0 scaffold init

- Added a minimal FastAPI backend under `backend/` with a `/health` endpoint returning JSON status.
- Added a minimal Next.js frontend under `frontend/` with a landing page and app layout.
- Added frontend runtime and type dependencies in `frontend/package.json`.
- Generated the frontend lockfile with `npm install` inside `frontend/`.
- Verified the backend module with `py_compile`.
- Verified the frontend with `npm run build`; Next.js completed a successful production build and normalized the TypeScript config.

### 1. GitHub repository and policy setup

- Created the public repository `Puzzletov/aethelgard`.
- Added the initial `README.md` with the repository title.
- Enabled repository security features:
	- Security Advisories
	- Dependabot alerts
	- Code scanning alerts
	- Secret scanning alerts
- Created and activated a branch protection ruleset on `main`.
- Required pull requests before merge on `main`.
- Set required approvals to `0` to allow self-merge through the PR workflow.

### 2. Cloudflare Turnstile and worker deployment

- Created a Turnstile widget named `Aethelgard Protection`.
- Configured the widget for `localhost`.
- Selected Managed mode.
- Saved the generated Site Key and Secret Key.
- Deployed the baseline Cloudflare Worker application.
- Confirmed successful deployment to `https://aethelgard.justbwas.workers.dev`.
- Chose the free `workers.dev` subdomain path.
- Skipped Cloudflare Dashboard WAF and Bot Fight Mode setup because the free subdomain path does not use a custom domain-based dashboard WAF flow.

### 3. Google Cloud project and service setup

- Created the Google Cloud project `aethelgard-prod`.
- Linked billing to the project.
- Enabled the Cloud Run API.
- Enabled the Secret Manager API.
- Created the deployment service account `github-actions-deployer@aethelgard-prod.iam.gserviceaccount.com`.
- Assigned the following IAM roles to that service account:
	- `roles/run.admin` (`Cloud Run Admin`)
	- `roles/iam.serviceAccountUser` (`Service Account User`)
	- `roles/secretmanager.secretAccessor` (`Secret Manager Secret Accessor`)
- Generated a JSON private key for the service account.
- Stored the JSON key in GitHub as the secret `GCP_SA_KEY`.
- Stored the project ID in GitHub as the secret `GCP_PROJECT_ID` with value `aethelgard-prod`.

### 4. Google Cloud budget controls

- Created the budget `Aethelgard Prod Budget` for `aethelgard-prod`.
- Set the monthly budget limit to `$1.00`.
- Configured alert thresholds at `50%`, `90%`, and `100%` of actual spend.
- Enabled email notifications for billing admins and project owners.

### 5. AI provider keys

- Created a Groq API key.
- Stored the key in GitHub as `GROQ_API_KEY`.
- Created an OpenRouter API key.
- Stored the key in GitHub as `OPENROUTER_API_KEY`.

### 6. Email provider key

- Created a Resend API key with Full access permissions.
- Stored the key in GitHub as `RESEND_API_KEY`.

### 7. Monitoring and alerting

- Created a Sentry project.
- Selected `Cloudflare Workers` as the platform.
- Set the project slug to `node-cloudflare-workers`.
- Configured the alert threshold to fire on more than 10 occurrences of a unique error in 1 minute.
- Copied the Sentry DSN.
- Stored the DSN in GitHub as `SENTRY_DSN`.

### 8. Local secret material and developer config

- Generated a 64-character hex secret with Node.js crypto:
	- `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Stored the generated value in GitHub as `ENCRYPTION_KEY`.
- Created local `.dev.vars` in the repository root.
- Populated `.dev.vars` with local values for `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `RESEND_API_KEY`, `SENTRY_DSN`, and `ENCRYPTION_KEY`.
- Confirmed `.dev.vars` is ignored by `.gitignore` and is not tracked.
- Verified the local variable set by running `npx wrangler dev`.
- Confirmed Miniflare started successfully at `http://127.0.0.1:8787` and loaded the hidden variables.
- Created `.env.example` with all secret names and empty values.
- Committed `.env.example` to the repository.

### 9. Outcome

- Phase -1 preparation is complete.
- Required accounts, keys, policies, budgets, and local developer secrets are in place.
- The repository is ready for code development.
