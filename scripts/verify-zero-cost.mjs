import { readFile } from "node:fs/promises";

const required = (condition, message) => {
  if (!condition) throw new Error(message);
};
const text = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [buildLog, publicConfig, privateConfig, pagesConfig, quota, orchestrator, workflow,
  rootPackage, frontendPackage] = await Promise.all([
  text("BUILD_LOG.md"), text("wrangler.toml"), text("workers/trusted-runtime/wrangler.toml"),
  text("frontend/wrangler.toml"), text("workers/trusted-runtime/src/browser-quota.ts"),
  text("workers/trusted-runtime/src/analysis-orchestrator.ts"), text(".github/workflows/ci.yml"),
  text("package.json").then(JSON.parse), text("frontend/package.json").then(JSON.parse),
]);

required(buildLog.includes("owner confirmed the final Free-account checklist on 2026-08-27"),
  "Signed owner exact-zero checklist evidence is absent.");
required(/ALLOWED_ORIGIN = "https:\/\/aethelgard-3j9\.pages\.dev"/u.test(publicConfig),
  "The public free hostname changed.");
required(/limit = 5[\s\S]*period = 60/u.test(publicConfig), "The free rate guard changed.");
required(!/\[secrets\]|API_KEY|PRIVATE_KEY/u.test(publicConfig), "The public edge is not secret-free.");
required(/workers_dev = false[\s\S]*preview_urls = false/u.test(privateConfig),
  "The private runtime gained a public target.");
required(/pages_build_output_dir = "\.\/out"/u.test(pagesConfig), "Pages is not static.");
required(/8 \* 60 \* 1_000/u.test(quota), "The Browser Run daily guard changed.");
required(/MAX_PROVIDER_ATTEMPTS_TOTAL = 6/u.test(orchestrator), "The provider attempt bound changed.");
required(/openrouter_free/u.test(orchestrator) && !/paid|BYOK/iu.test(orchestrator),
  "The provider route is not free-only.");
required(/runs-on: ubuntu-24\.04/u.test(workflow) && !/self-hosted/u.test(workflow),
  "CI is not on the approved standard runner.");

const dependencies = { ...rootPackage.dependencies, ...rootPackage.devDependencies,
  ...frontendPackage.dependencies, ...frontendPackage.devDependencies };
for (const forbidden of ["@sentry/cloudflare", "@sentry/nextjs", "@google-cloud/secret-manager",
  "resend", "stripe"]) required(dependencies[forbidden] === undefined, `${forbidden} is forbidden.`);

process.stdout.write(`${JSON.stringify({ schema_version: "1", gbp_upfront: 0, gbp_monthly: 0,
  usd_upfront: 0, usd_monthly: 0, paid_fallbacks: 0, automatic_topups: 0, passed: true })}\n`);
