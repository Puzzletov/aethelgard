# Build Log

Technical record of completed human setup work for Aethelgard Phase -1.

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
