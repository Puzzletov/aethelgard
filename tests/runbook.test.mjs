import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("owner runbook is bounded and covers every required operation and checkpoint", async () => {
  const runbook = await readFile(new URL("RUNBOOK.md", root), "utf8");
  const normalized = runbook.replaceAll("\r\n", "\n");
  assert.ok([...runbook].length <= 40_000);
  for (const phrase of ["Release checkpoint", "Deploy and verify", "Provider configuration and incidents",
    "signing-key compromise", "Quota", "Rollback", "Disaster recovery", "explicit owner-reviewed checkpoint",
    "GBP 0.00 and USD 0.00"]) assert.match(runbook, new RegExp(phrase, "u"));
  const privateDeploy = normalized.indexOf("deploy --config workers/trusted-runtime/wrangler.toml");
  const publicDeploy = normalized.indexOf("npx wrangler deploy\n", privateDeploy);
  const pagesDeploy = normalized.indexOf("pages deployment create", publicDeploy);
  assert.ok(privateDeploy >= 0 && publicDeploy > privateDeploy && pagesDeploy > publicDeploy);
  assert.match(runbook, /Strawman → Steelman → Oracle/);
  assert.match(runbook, /every boolean\s+true/);
  assert.doesNotMatch(runbook, /cron|automatic deployment|paid fallback enabled|secret value/iu);
  assert.doesNotMatch(runbook, /[ \t]+$/gmu);
  assert.equal((runbook.match(/^```/gmu) ?? []).length % 2, 0);
});

test("runbook links and non-destructive repository commands resolve", async () => {
  const [runbook, rootPackage, transport] = await Promise.all([
    readFile(new URL("RUNBOOK.md", root), "utf8"),
    readFile(new URL("package.json", root), "utf8").then(JSON.parse),
    readFile(new URL("src/contracts/ai-transport.ts", root), "utf8"),
  ]);
  for (const command of ["architecture:hash", "architecture:lint", "doctor", "zero-cost:check",
    "audit", "test", "build", "verify:report"]) assert.ok(rootPackage.scripts[command]);
  assert.match(transport, /groq: "openai\/gpt-oss-20b"/);
  assert.match(transport, /openrouter_free: "openrouter\/free"/);
  const links = [...runbook.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)].map((match) => match[1]);
  await Promise.all(links.map((link) => access(new URL(link, root))));
});
