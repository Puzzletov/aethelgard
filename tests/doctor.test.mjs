import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("Doctor deterministically passes repository invariants without network calls", async () => {
  const result = spawnSync(process.execPath, ["scripts/doctor.mjs"], {
    cwd: root,
    encoding: "utf8",
    timeout: 10_000,
  });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "ok");
  assert.equal(report.architecture, "2.1");
  assert.equal(report.phase, "2");
  assert.ok(report.checks >= 17);

  const source = await readFile(new URL("../scripts/doctor.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\bfetch\s*\(|https?:\/\/|child_process.*exec/i);
});

test("production logging and third-party telemetry are explicitly absent", async () => {
  const [publicConfig, privateConfig] = await Promise.all([
    readFile(new URL("../wrangler.toml", import.meta.url), "utf8"),
    readFile(new URL("../workers/trusted-runtime/wrangler.toml", import.meta.url), "utf8"),
  ]);
  for (const config of [publicConfig, privateConfig]) {
    assert.match(config, /\[observability\]\s+enabled = false/m);
    assert.doesNotMatch(config, /tail_consumers|logpush|analytics_engine_datasets/i);
  }
});
