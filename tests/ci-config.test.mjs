import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("CI uses only pinned GitHub-native standard runners without uploaded caches or artifacts", async () => {
  const workflow = await readFile(new URL(".github/workflows/ci.yml", root), "utf8");
  assert.match(workflow, /runs-on: ubuntu-24\.04/);
  assert.match(workflow, /actions\/checkout@[0-9a-f]{40} # v7\.0\.1/);
  assert.match(workflow, /actions\/setup-node@[0-9a-f]{40} # v7\.0\.0/);
  assert.match(workflow, /permissions:\s+contents: read/m);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /package-manager-cache: false/);
  assert.doesNotMatch(workflow, /pull_request_target|self-hosted|actions\/cache|upload-artifact|save-always/i);
});

test("CI runs every Task 0.9 quality and supply-chain gate with diagnostic rejection", async () => {
  const workflow = await readFile(new URL(".github/workflows/ci.yml", root), "utf8");
  for (const command of [
    "npm run doctor",
    "npm run license:check",
    "npm run audit",
    "npm run typecheck",
    "npm run lint",
    "npm test",
    "npm run build",
  ]) {
    assert.ok(workflow.includes(`node scripts/run-warning-free.mjs ${command}`), command);
  }
  assert.match(workflow, /npm ci --no-audit --no-fund/);
  assert.match(workflow, /npm --prefix frontend ci --no-audit --no-fund/);
});

test("Dependabot covers both locked npm dependency trees on a bounded weekly schedule", async () => {
  const config = await readFile(new URL(".github/dependabot.yml", root), "utf8");
  assert.equal((config.match(/package-ecosystem: npm/g) ?? []).length, 2);
  assert.match(config, /directory: \/\s/);
  assert.match(config, /directory: \/frontend/);
  assert.equal((config.match(/interval: weekly/g) ?? []).length, 2);
  assert.equal((config.match(/open-pull-requests-limit: 5/g) ?? []).length, 2);
  assert.doesNotMatch(config, /target-branch|registries|insecure-external-code-execution/);
});

test("the CI command wrapper rejects flagged diagnostics and command errors", () => {
  const run = (source) => spawnSync(process.execPath, [
    "scripts/run-warning-free.mjs",
    process.execPath,
    "-e",
    source,
  ], { cwd: root, encoding: "utf8", timeout: 10_000 });
  assert.equal(run("console.log('clean output')").status, 0);
  const warning = run("console.error('warning: unsafe result')");
  assert.equal(warning.status, 1);
  assert.match(warning.stderr, /"warning_found":true/);
  const error = run("process.exitCode = 2");
  assert.equal(error.status, 1);
  assert.match(error.stderr, /"exit_code":2/);
});
