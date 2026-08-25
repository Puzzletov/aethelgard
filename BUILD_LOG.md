# Build Log

Technical record of setup, build work, checks, and phase-gate audits for Aethelgard.

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
- The active ruleset does not require a passing status check.
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

Phase -1 blockers:

1. GitHub does not require a passing status check on `main`.
2. GitHub secret names and some security settings are not independently verified because the local GitHub CLI login is invalid.
3. Cloudflare Bot Fight Mode and the WAF upload rate limit were skipped.
4. The Turnstile widget is documented for `localhost`, not the public Pages host.
5. The documented Google Cloud roles do not match Phase -1 Task 3. The log records Secret Manager Secret Accessor, not Secret Manager Admin, and also records Service Account User.
6. Google Cloud project, API, billing, budget, IAM, and secret state are documented but not independently verified in this audit. The Google Cloud CLI is not installed.
7. Groq, OpenRouter, Resend, and Sentry setup is documented but not independently verified in this audit.
8. No UptimeRobot account setup is documented.
9. The Ed25519 and ML-DSA-65 keypairs from Phase -1 Task 7 do not exist in the repository record. The generic `ENCRYPTION_KEY` does not satisfy this task.
10. Phase -1 Task 7 depends on a key-generation script assigned to Phase 5. This is a phase-order conflict that needs a human decision.
11. The tracked `.env.example` claimed in the earlier log does not exist. A local `.dev.vars.example` exists, but `.gitignore` ignores it and Git does not track it.
12. The local example file does not list every required configuration name. The purpose of `ENCRYPTION_KEY` is also not defined in the architecture or used by current code.

Phase 0 result: **not complete**.

Phase 0 task status:

1. Frontend: implemented and live, but not review-complete. Its latest source is uncommitted, has no pull request, and is not on `main`.
2. Backend: a local FastAPI `/health` route exists. No container file, Cloud Run deployment configuration, or Cloud Run URL exists. The Worker endpoint is not the required FastAPI backend.
3. CI/CD: no repository workflow deploys the frontend or backend from a push to `main`.
4. Index blocking: incomplete. The live frontend uses `lang="en"`, has no required robots meta tag, and has no `X-Robots-Tag`. Its `robots.txt` does not contain `Disallow: /`. The Worker response also has no `X-Robots-Tag`.
5. Tests: partial. One frontend configuration test exists locally. No backend unit test exists, and no project test runs in CI.
6. UptimeRobot: no monitor is documented, and the required Cloud Run `/health` URL does not exist.

Phase 0 exit-test result:

- The frontend is live.
- The required Cloud Run `/health` endpoint is not live.
- A push to `main` does not deploy both parts.
- The Phase 0 exit test fails.

Gate decision:

- Do not start or continue Phase 0 work until the Phase -1 blockers are resolved or the repository owner gives an explicit architecture decision.
- Do not start Phase 1 or any later phase.

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
